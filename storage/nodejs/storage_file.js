'use strict';

const assert = require('assert');
const when = require('when');
const NeDB = require('nedb');
const Hash = require('crypto').Hash;
const LRU = require('lru-cache');

const Message = require('../../utils/nodejs/messages').Message;

const description = require('../description');
/*
* int **id** - unique serial integer being assigned to *Node* on create
* int **author** - id of User who created this *Node*
* string **class** - one word
* string **title** - text
* string **ctype** - MIME content type?
* binary **content** - anything
* int **flags** - some bits, `...<title is encrypted><content is encrypted>`
* string **meta** - json string
* Relation[] **relations**
*/
const NodeFields = new Map([
    ['id', true],
    ['author', true],
    ['class', true],
    ['title', true],
    ['ctype', true],
    ['content', true],
    ['flags', true],
    ['meta', true],
    ['relations', true]
]);

module.exports = (config) => {
    const db = config
        ?
        new NeDB({
            filename: config.filename,
            autoload: true,
        })
        :
        new NeDB();

    const logger = config && config.logger ? 
        config.logger : 
        require('../../utils/nodejs/console_logger').get('storage');

    /* HELPERS */

    const requestHash = function(...args) {
        const h = Hash('sha256');
        h.update(JSON.stringify(args));
        return h.digest('hex');
    };
    const cache = new LRU({
        max: 1000
    });

    let globalId = null;
    const getNextId = function () {
        const d = when.defer();
        const filter = globalId ? { _id: globalId } : { what: 'globalId' };
        const update = {
            $inc: {value: 1}
        };
        const opts = {
            upsert: true,
            returnUpdatedDocs: true
        };
        // It is useful to pass Message as 'this'
        if (this instanceof Message) {
            logger.debug(this.clone('what', 'db.update()', 'filter', filter, 'update', update, 'options', opts));
        }
        db.update(filter, update, opts, (err, num, doc, upsert) => {
            // console.log(err, num, doc);
            if (err || num == 0) {
                return d.reject(err || new Error('failed to upsert globalId'));
            }
            if (num != 1) {
                return d.reject(new Error('more 1 globalIdss'));
            }
            globalId = doc._id;
            d.resolve(doc.value);
        });
        return d.promise;
    };

    const getNodesByIds = function (ids) {
        const d = when.defer();
        const filter = {
            id: {$in: ids}
        };
        if (this instanceof Message) {
            logger.debug(this.clone('what', 'db.find()', 'filter', filter));
        }
        db.find(filter, {_id: 0}, (err, docs) => {
            if (err) return d.reject(err);
            const order = new Map();
            const res = new Array(ids.length);
            for (let i = 0; i < ids.length; i++) {
                order.set(ids[i], i);
            }
            for (let i = 0; i < docs.length; i++) {
                res[order.get(docs[i].id)] = docs[i];
            }
            d.resolve(res);
        });
        return d.promise;
    };

    const drts = description.editAccess.constants.rights;
    const fullAccess = parseInt(''.padEnd(drts.length, '1'), 2);
    const accessHas = {};
    const accessIs = {};
    for (let i = 0; i < drts.length; i++) {
        accessHas[drts[i]] = (val) => (val & Math.pow(2, i)) > 0;
        accessIs[drts[i]] = (val) => (val == Math.pow(2, i));
    }

    const calcAccessRights = function (idA, nodeA, nodeB) {
        if (this instanceof Message) {
            logger.debug(this.clone('what', 'calcAccessRights()', 'idA', idA, 'nodeA', nodeA, 'nodeB', nodeB));
        }
        if (nodeB == null) {
            // logger.debug('nodeB not exists => full rights');
            return fullAccess;
        }
        // direct rights are above indirect
        if (nodeB.accessRightsById[idA]) {
            return nodeB.accessRightsById[idA];
        }
        // summarize indirect rights
        let rights = 0;
        for (const rId in nodeA.relations) {
            if (nodeB.accessRightsById[rId] > 0) {
                rights = (rights | nodeB.accessRightsById[rId]);
            }
        }
        return rights;
    };

    const getAccessRights = function (idA, idB) {
        if (this instanceof Message) {
            logger.debug(this.clone('what', 'getAccessRights()', 'idA', idA, 'idB', idB));
        }
        // Node has full access to itself
        if (idA == idB) {
            return when.resolve(fullAccess);
        }
        return getNodesByIds.call(this, [idA, idB])
        .then((nodes) => {
            const nodeA = nodes[0];
            const nodeB = nodes[1];
            return calcAccessRights.call(this, idA, nodeA, nodeB);
        });
    };

    const operationHas = {};
    const operationIs = {};
    let _create = 0;
    // first operation is 'delete', all other are positive, so 'create' is sum of positives
    _create--;
    const dops = description.editNode.constants.operations;
    for (let i = 0; i < dops.length; i++) {
        operationHas[dops[i]] = (val) => (val & Math.pow(2, i)) > 0;
        operationIs[dops[i]] = (val) => (val == Math.pow(2, i));
        _create += Math.pow(2, i);
    }
    operationHas.create = (val) => (val & _create) == _create;
    operationIs.create = (val) => (val == _create);

    const addToFilterAccessByUser = (filter, user, userNode) => {
        // find Nodes with any kind of access from user, then filter out those without read access
        const rIds = Object.keys(userNode.relations || {});
        rIds.push(user);
        filter.$or = [];
        for (let i = 0; i < rIds.length; i++) {
            const tmp = {};
            tmp['accessRightsById.' + rIds[i]] = {$exists: true};
            filter.$or.push(tmp);
        }
    };

    const hasUserRightOnNode = (user, userNode, node, rightName) => {
        return accessHas[rightName](calcAccessRights(user, userNode, node));
    };

    const makeRelationsFilter = (relationsFilter) => {
        const filter = {};
        assert(relationsFilter.length % 4 == 0, 'length of relations filter must be multiple of 4');
        for (let i = 0; i < relationsFilter.length / 4; i++) {
            const rType = relationsFilter[4*i];
            const rId = parseInt(relationsFilter[4*i + 1], 10);
            const rValMin = parseFloat(relationsFilter[4*i + 2], 10);
            const rValMax = parseFloat(relationsFilter[4*i + 3], 10);
            if (rType != '' && isNaN(rId)) {
                filter['relationsByType.' + rType] = {$exists: true, $ne: {}};
            }
            if (!isNaN(rId)) {
                if (isNaN(rValMin) && isNaN(rValMax)) {
                    filter['relations.' + rId] = {$exists: true};
                }
                if (!isNaN(rValMin)) {
                    filter['relations.' + rId +'.local_value'] = filter['relations.' + rId +'.local_value'] || {};
                    filter['relations.' + rId +'.local_value'].$gte = rValMin;
                }
                if (!isNaN(rValMax)) {
                    filter['relations.' + rId +'.local_value'] = filter['relations.' + rId +'.local_value'] || {};
                    filter['relations.' + rId +'.local_value'].$lte = rValMax;
                }
            }
        }
        if (Object.keys(filter).length == 0) return null;
        return filter;
    };

    const decorateWithCache = function (fname, f) {
        return function (...args) {
            const rHash = requestHash(...args);
            const cached = cache.get(rHash);
            if (cached) {
                const msg = new Message('where', fname, 'what', 'result from cache');
                logger.info(msg);
                logger.debug(msg.setm('args', args, 'result', cached));
                return when(cached);
            }
            return f.call(this, ...args)
            .tap((res) => {
                cache.set(rHash, res);
            });
        };
    };

    /* HELPERS */
    /*******************/
    /* STORAGE METHODS */
    const storage = {};

    storage.clear = function () {
        cache.reset();
        const d = when.defer();
        const filter = {};
        const opts = {multi: true};
        // if 'this' is not Message it equals new Message()
        logger.debug(new Message(this).setm('what', 'db.remove()', 'filter', {}, 'options', opts));
        db.remove(filter, opts, (err, numRemoved) => {
            if (err) return d.reject(err);
            globalId = null;
            d.resolve(numRemoved);
        });
        return d.promise;
    };

    // @return {number}
    storage.getAccess = function (user, idA, idB) {
        let checkingParam;
        let msg = new Message('where', 'getAccess()', 'user', user);
        return when().then(() => {
            logger.verbose(msg.clone('idA', idA, 'idB', idB));
            try {
                checkingParam = 'user';
                user = JSON.parse(user);
                assert(typeof user == 'number', 'typeof "user" must be number');
                checkingParam = 'idA';
                idA = JSON.parse(idA);
                assert(typeof idA == 'number', 'typeof "idA" must be number');
                checkingParam = 'idB';
                idB = JSON.parse(idB);
                assert(typeof idB == 'number', 'typeof "idB" must be number');
            } catch (e) {
                logger.error(msg.setm('what', 'invalid params', 'error', e.message));
                return when.reject(new Error('invalid parameter:'+checkingParam));
            }
            return when.join(
                (user == idB) ? when() :
                    getAccessRights.call(msg, user, idA)
                    .then((rights) => {
                        if (!accessHas.create_access_from(rights)) {
                            throw new Error('access denied:idA');
                        }
                    }),
                (user == idA) ? when() :
                    getAccessRights.call(msg, user, idB)
                    .then((rights) => {
                        if (!accessHas.create_access_to(rights)) {
                            throw new Error('access denied:idB');
                        }
                    })
            );
        })
        .then(() => {
            return getAccessRights.call(msg, idA, idB);
        })
        .tap((res) => {
            if (msg.get('what')) {
                logger.info(msg);
            } else {
                logger.verbose(msg.set('result', res));
            }
        })
        .catch((e) => {
            logger.error(msg.set('error', e.message));
            throw e;
        });
    };

    // @return {number} idB
    storage.editAccess = function (user, idA, idB, rights) {
        let checkingParam;
        let msg = new Message('where', 'editAccess()', 'user', user);
        return when().then(() => {
            logger.verbose(msg);
            logger.debug(msg.clone('idA', idA, 'idB', idB, 'rights', rights));
            try {
                checkingParam = 'user';
                user = JSON.parse(user);
                assert(typeof user == 'number', 'typeof "user" must be number');
                checkingParam = 'idA';
                idA = JSON.parse(idA);
                assert(typeof idA == 'number', 'typeof "idA" must be number');
                checkingParam = 'idB';
                idB = JSON.parse(idB);
                assert(typeof idB == 'number', 'typeof "idB" must be number');
                checkingParam = 'rights';
                rights = JSON.parse(rights);
                assert(typeof rights == 'number', 'typeof "rights" must be number');
            } catch (e) {
                logger.error(msg.setm('what', 'invalid params', 'error', e.message));
                return when.reject(new Error('invalid parameter:'+checkingParam));
            }
            const isCreateAccessFromSelf = (user == idB && accessIs.create_access_from(rights));

            return when.join(
                isCreateAccessFromSelf ? when() :
                    getAccessRights.call(msg, user, idA)
                    .then((_rights) => {
                        if (!accessHas.create_access_from(_rights)) {
                            throw new Error('access denied:idA');
                        }
                    }),
                isCreateAccessFromSelf ? when() :
                    getAccessRights.call(msg, user, idB)
                    .then((_rights) => {
                        if (!accessHas.create_access_to(_rights)) {
                            throw new Error('access denied:idB');
                        }
                    })
            );
        })
        .then(() => {
            const d = when.defer();
            const set = {};
            set['accessRightsById.' + idA] = rights;
            const filter = {
                id: idB
            };
            const update = {
                $set: set
            };
            logger.debug(msg.clone('what', 'db.update()', 'filter', filter, 'update', update));
            db.update(filter, update, (err, numAffected) => {
                if (err) return d.reject(err);
                if (numAffected == 0) return d.reject(new Error('not found:idB'));
                d.resolve(idB);
            });
            return d.promise;
        })
        .tap((res) => {
            if (msg.get('what')) {
                logger.info(msg);
            } else {
                logger.verbose(msg.set('result', res));
            }
        })
        .catch((e) => {
            logger.error(msg.set('error', e.message));
            throw e;
        });
    };

    // @return {number} id
    storage.editNode = function (
        id, user, operation, klass, title, ctype, content, flags, meta, relationsAdd, relationsRm
    ) {
        let checkingParam;
        let msg = new Message('where', 'editNode()', 'user', user, 'id', id);
        return when().then(() => {
            logger.verbose(msg);
            logger.debug(
                msg.clone('args', [id, user, operation, klass, title, ctype, content, flags, meta, relationsAdd, relationsRm])
            );
            try {
                checkingParam = 'user';
                user = JSON.parse(user || 'null');
                checkingParam = 'id';
                id = JSON.parse(id || 'null');
                checkingParam = 'operation';
                operation = JSON.parse(operation);
                assert(operation != null, '"operation" cannot be null');
                if (operationHas.title(operation)) {
                    checkingParam = 'title';
                    assert(title != null, '"title" cannot be null');
                    assert.equal(typeof title, 'string', 'typeof "title" must be string');
                }
                if (operationHas.content(operation)) {
                    checkingParam = 'content';
                    assert(content != null, '"content" cannot be null');
                    assert.equal(typeof ctype, 'string', 'typeof "ctype" must be string');
                }
                if (operationHas.flags(operation)) {
                    checkingParam = 'flags';
                    flags = JSON.parse(flags);
                    assert(flags != null, '"flags" cannot be null');
                    assert.equal(typeof flags, 'number', 'typeof "flags" must be number');
                }
                if (operationHas.meta(operation)) {
                    checkingParam = 'meta';
                    assert(meta != null, '"meta" cannot be null');
                    // check meta is valid json
                    JSON.parse(meta);
                }
                if (operationHas.relations(operation)) {
                    checkingParam = 'relationsAdd or relationsRm';
                    assert(relationsAdd != null || relationsRm != null, 
                        '"relationsAdd" and "relationsRm" cannot be null together');
                    relationsAdd = relationsAdd ? relationsAdd.split(',') : [];
                    if (relationsAdd && relationsAdd.length > 0) {
                        checkingParam = 'relationsAdd';
                        for (let i = 0; i < relationsAdd.length / 3; i++) {
                            const rId = relationsAdd[3*i + 0] = JSON.parse(relationsAdd[3*i + 0]);
                            const rTitle = relationsAdd[3*i + 1] = relationsAdd[3*i + 1];
                            const rValue = relationsAdd[3*i + 2] = parseFloat(
                                relationsAdd[3*i + 2], 10) || undefined;
                            assert.equal(typeof rId, 'number', '"relation" id must be number');
                            assert(rId != id, 'node cant relate to itself');
                        }
                    }
                    relationsRm = relationsRm ? relationsRm.split(',') : [];
                    if (relationsRm && relationsRm.length > 0) {
                        checkingParam = 'relationsRm';
                        for (let i = 0; i < relationsRm.length; i++) {
                            const rId = relationsRm[i] = JSON.parse(relationsRm[i]);
                            assert.equal(typeof rId, 'number', '"relation" id must be number');
                            assert(rId != id, 'node cant relate to itself');
                        }
                    }
                }
                if (operationHas.create(operation)) {
                    checkingParam = 'class';
                    assert(klass != null, '"class" cannot be null');
                    assert.equal(typeof klass, 'string', 'typeof "class" must be string');
                }
            } catch (e) {
                logger.error(msg.setm('what', 'invalid params', 'error', e.message));
                return when.reject(new Error('invalid parameter:'+checkingParam));
            }
        })
        .then(() => {
            if (id == null && user == null && klass == 'user' && operationHas.create(operation)) {
                return getNextId.call(msg)
                .then((_id) => {
                    user = _id;
                    id = user;
                    msg.set('user', user);
                    msg.set('id', id);
                });
            }
            if (id == null && user != null && klass != 'user' && klass != null && operationHas.create(operation)) {
                return getNextId.call(msg)
                .then((_id) => {
                    id = _id;
                    msg.set('id', id);
                });
            }
        })
        .then(() => {
            try {
                checkingParam = 'id';
                assert(id != null, 'node "id" cannot be null');
                id = JSON.parse(id);
                checkingParam = 'user';
                assert(user != null, '"user" cannot be null');
                user = JSON.parse(user);
            } catch (e) {
                logger.error(msg.setm('what', 'invalid params', 'error', e.message));
                return when.reject(new Error('invalid parameter:'+checkingParam));
            }
            return getAccessRights.call(msg, user, id);
        })
        .then((rights) => {
            logger.debug(msg.clone('what', 'getAccessRights()', 'result', rights));
            const set = {};
            const unset = {};
            let upsert = false;
            const relIds = [];

            if (operationHas.delete(operation)) {
                assert(accessHas.delete(rights), 'access denied:delete');
                msg.set('what', 'deleted node');
                const filter = {id: id};
                logger.debug(msg.clone('what', 'db.remove()', 'filter', filter));
                const d = when.defer();
                db.remove(filter, (err, numAffected) => {
                    if (err) {
                        d.reject(err);
                    } else {
                        d.resolve(id);
                    }
                });
                return d.promise;
            }
            assert(accessHas.write(rights), 'access denied:write');
            msg.set('what', 'updated node');
            if (operationHas.title(operation)) {
                set.title = title;
            }
            if (operationHas.content(operation)) {
                set.content = content;
            }
            if (operationHas.flags(operation)) {
                msg.set('flags', flags);
                set.flags = flags;
            }
            if (operationHas.meta(operation)) {
                set.meta = meta;
            }
            if (operationHas.relations(operation)) {
                if (relationsAdd && relationsAdd.length > 0) {
                    for (let i = 0; i < relationsAdd.length / 3; i++) {
                        const rId = relationsAdd[3*i + 0];
                        const rTitle = relationsAdd[3*i + 1];
                        const rValue = relationsAdd[3*i + 2];
                        set['relations.' + rId] = {
                            local_title: rTitle,
                            local_value: rValue
                        };
                        relIds.push(rId);
                    }
                    msg.set('relationsAdd', relIds.join(','));
                }
                if (relationsRm && relationsRm.length > 0) {
                    for (let i = 0; i < relationsRm.length; i++) {
                        const rId = relationsRm[i];
                        unset['relations.' + rId] = true;
                        relIds.push(rId);
                    }
                    msg.set('relationsRm', relIds.slice(relIds.length - relationsRm.length).join(','));
                }
            }
            if (operationHas.create(operation)) {
                msg.set('what', 'created node');
                set.author = user;
                set.class = klass;
                upsert = true;
                set.accessRightsById = {};
                set.accessRightsById[user] = fullAccess;
            }

            return when()
            .then(() => {
                if (relIds.length == 0) {
                    return;
                }
                // check that user can 'relate' to nodes
                return getNodesByIds.call(msg, relIds.concat(user))
                .then((nodes) => {
                    const userNode = nodes.pop();
                    for (let i = 0; i < nodes.length; i++) {
                        const node = nodes[i];
                        assert(node != null, 'not found:relation');
                        if (!hasUserRightOnNode(user, userNode, node, 'relate')) {
                            throw new Error('access denied:relate');
                        }
                        // setting "class" for easier search
                        if (relationsAdd && i < relationsAdd.length / 3) {
                            set['relationsByType.' + node.class +'.' + node.id] = true;
                            set['relations.' + node.id].class = node.class;
                        } else {
                            unset['relationsByType.' + node.class +'.' + node.id] = true;
                        }
                    }
                });
            })
            .then(() => {
                const filter = {id: id};
                const update = {$set: set, $unset: unset};
                const opts = {upsert: upsert};
                logger.debug(msg.clone('what', 'db.update()', 'filter', filter, 'update', update, 'options', opts));
                const d = when.defer();
                db.update(filter, update, opts, (err, numAffected) => {
                    if (err) {
                        return d.reject(err);
                    }
                    if (numAffected == 0) {
                        return d.reject(new Error('not found:node'));
                    }
                    d.resolve(id);
                });
                return d.promise;
            });
        })
        .tap((res) => {
            if (msg.get('what')) {
                logger.info(msg);
            }
            logger.verbose(msg.set('result', res));
        })
        .catch((e) => {
            logger.error(msg.set('error', e.message));
            throw e;
        });
    };

    // @return {Array.<object>}
    storage.getNodes = function (
        user, idIn, idOut, idMin, idMax, classIn, classOut, titleLike, contentLike, relationsIn, relationsOut, 
        responseFields, sort, limit
    ) {
        let checkingParam;
        let msg = new Message('where', 'getNodes()', 'user', user);
        return when().then(() => {
            logger.verbose(msg);
            logger.debug(
                msg.clone('args', [user, idIn, idOut, idMin, idMax, classIn, classOut, titleLike, contentLike,
                    relationsIn, relationsOut, responseFields, sort, limit])
            );
            try {
                user = JSON.parse(user);
                assert(typeof user == 'number', 'typeof "user" must be number');
            } catch (e) {
                logger.error(msg.setm('what', 'invalid params', 'error', e.message));
                return when.reject(new Error('invalid parameter:user'));
            }
            return getNodesByIds.call(msg, [user])
        })
        .then((nodes) => {
            const ignoredParameters = [];
            const projection = {id: 1, accessRightsById: 1, _id: 0};
            const filter = {};
            let cursor;
            const userNode = nodes[0];
            addToFilterAccessByUser(filter, user, userNode);
            logger.debug(msg.clone('what', 'addToFilterAccessByUser()').set('result', filter));
            try {
                if (idIn || idOut || idMin || idMax) {
                    filter.id = {};
                }
                if (idIn) {
                    checkingParam = 'idIn';
                    filter.id.$in = JSON.parse('[' + idIn + ']');
                }
                if (idOut) {
                    checkingParam = 'idOut';
                    filter.id.$nin = JSON.parse('[' + idOut + ']');
                }
                if (idMin) {
                    checkingParam = 'idMin';
                    filter.id.$gte = JSON.parse(idMin);
                }
                if (idMax) {
                    checkingParam = 'idMax';
                    filter.id.$lt = JSON.parse(idMax);
                }
                if (classIn || classOut) {
                    filter.class = {};
                }
                if (classIn) {
                    checkingParam = 'classIn';
                    filter.class.$in = classIn.split(',');
                }
                if (classOut) {
                    checkingParam = 'classOut';
                    filter.class.$nin = classOut.split(',');
                }
                if (titleLike) {
                    checkingParam = 'titleLike';
                    const re = titleLike.match(/^regex:(.*)$/);
                    if (re) {
                        filter.title = {$regex: RegExp(re[1])};
                    } else {
                        ignoredParameters.push('titleLike');
                    }
                }
                if (contentLike) {
                    checkingParam = 'contentLike';
                    ignoredParameters.push('contentLike');
                }
                if (relationsIn) {
                    checkingParam = 'relationsIn';
                    const addFilter = makeRelationsFilter(relationsIn.split(','));
                    if (addFilter) {
                        Object.assign(filter, addFilter);
                    }
                }
                if (relationsOut) {
                    checkingParam = 'relationsOut';
                    const addFilter = makeRelationsFilter(relationsOut.split(','));
                    if (addFilter) {
                        Object.assign(filter, {$not: addFilter});
                    }
                }
                if (responseFields) {
                    checkingParam = 'responseFields';
                    const ar = responseFields.split(',');
                    for (let i in ar) {
                        if (NodeFields.get(ar[i])) {
                            projection[ar[i]] = 1;
                        }
                    }
                }
                logger.debug(msg.clone('what', 'db.find()', 'filter', filter));
                cursor = db.find(filter, projection);
                if (sort) {
                    checkingParam = 'sort';
                    assert(sort == 'asc' || sort == 'desc', '"sort" must be "asc" or "desc"');
                    cursor = cursor.sort({id: sort == 'asc' ? 1 : -1});
                }
                if (limit) {
                    checkingParam = 'limit';
                    cursor = cursor.limit(parseInt(limit, 10));
                }
            } catch (e) {
                logger.error(msg.setm('what', 'invalid params', 'error', e.message));
                return when.reject(new Error('invalid parameter:'+checkingParam));
            }
            const d = when.defer();
            cursor.exec((err, docs) => {
                if (err) return d.reject(err);
                const res = [];
                for (let i = 0; i < docs.length; i++) {
                    const node = docs[i];
                    if (!hasUserRightOnNode(user, userNode, node, 'read')) continue;
                    delete node.accessRightsById;
                    if (node.relations) {
                        const r = [];
                        for (const rId in node.relations) {
                            r.push(
                                node.relations[rId].class,
                                rId,
                                encodeURIComponent(node.relations[rId].local_title),
                                encodeURIComponent(node.relations[rId].local_value || '')
                            );
                        }
                        node.relations = r.join(',');
                    }
                    res.push(node);
                }
                if (ignoredParameters.length > 0) {
                    res.push({ignoredParameters: ignoredParameters.join(',')});
                }
                d.resolve(res);
            });
            return d.promise;
        })
        .tap((res) => {
            if (msg.get('what')) {
                logger.verbose(msg);
            } else {
                logger.debug(msg.set('result', res));
            }
        })
        .catch((e) => {
            logger.error(msg.set('error', e.message));
            throw e;
        });
    };

    /* CACHE */
    /*
    editNode must not create doubles
    Bulletproof and overkill: store MD5 hash of Node in it, recalculate it on every update and check it before insert/update
    Balaced: use 'user' + 'class' + MD5('title') + MD5('content')
    Easy: keep last calls and respond from cache
    */
    storage.editNode = decorateWithCache('editNode()', storage.editNode);

    return storage;
};
