'use strict';

const assert = require('assert');
const when = require('when');
const NeDB = require('nedb');

const Messages = require('../../utils/nodejs/messages');

const storageAPI = require('../api');
const allAccessRights = require('../constants').rights;
const allOperations = require('../constants').operation;
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

    const logger = config && config.logger ? config.logger : require('../../utils/nodejs/console_logger').get('storage');

    let globalId = null;
    const getNextId = () => {
        const d = when.defer();
        const filter = globalId ? { _id: globalId } : { what: 'globalId' };
        db.update(filter, {
            $inc: {value: 1}
        }, {
            upsert: true,
            returnUpdatedDocs: true
        }, (err, num, doc, upsert) => {
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

    const storage = Object.assign({}, storageAPI);

    storage.clear = () => {
        const d = when.defer();
        db.remove({}, {multi: true}, (err, numRemoved) => {
            if (err) return d.reject(err);
            logger.debug('clear() removed:', numRemoved);
            globalId = null;
            d.resolve(numRemoved);
        });
        return d.promise;
    };

    const getNodes = (ids) => {
        const d = when.defer();
        db.find({
            id: {$in: ids}
        }, (err, docs) => {
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

    const fullAccess = parseInt(''.padEnd(allAccessRights.length, '1'), 2);
    const accessHas = {};
    for (let i = 0; i < allAccessRights.length; i++) {
        accessHas[allAccessRights[i]] = (val) => (val & Math.pow(2, i)) > 0;
    }

    const calcAccessRights = (idA, nodeA, nodeB) => {
        //logger.debug('calcAccessRights()', 'idA:', idA, 'nodeA:', nodeA, 'nodeB:', nodeB);
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
                rights = (rights & nodeB.accessRightsById[rId]);
            }
        }
        return rights;
    };

    const getAccessRights = (idA, idB) => {
        // Node has full access to itself
        if (idA == idB) {
            return when.resolve(fullAccess);
        }
        return getNodes([idA, idB])
        .then((nodes) => {
            const nodeA = nodes[0];
            const nodeB = nodes[1];
            return calcAccessRights(idA, nodeA, nodeB);
        });
    };

    storage.getAccess = (user, idA, idB) => {
        user = JSON.parse(user);
        idA = JSON.parse(idA);
        idB = JSON.parse(idB);
        let msg = Messages.new('where', 'getAccess()', 'user', user, 'idA', idA, 'idB', idB);
        logger.verbose(msg);
        return whan.join(
            getAccessRights(user, idA)
            .then((rights) => {
                if (!accessHas.create_access_from(rights)) {
                    throw new Error('user has no right to see access from ' + idA);
                }
            }),
            getAccessRights(user, idB)
            .then((rights) => {
                if (!accessHas.create_access_to(rights)) {
                    throw new Error('user has no right to see access to ' + idB);
                }
            })
        )
        .then(() => {
            return getAccessRights(idA, idB);
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

/*
    storage.setAccessRight = (rights, rightName) => {
        return accessHas[rightName](rights);
    };

    storage.hasAccessRight = (rights, rightName) => {
        return accessHas[rightName](rights);
    };
*/
    storage.editAccess = (user, idA, idB, rights) => {
        user = JSON.parse(user);
        idA = JSON.parse(idA);
        idB = JSON.parse(idB);
        let msg = Messages.new('where', 'editAccess()', 'user', user, 'idA', idA, 'idB', idB);
        logger.verbose(msg);
        logger.debug(msg.clone().set('rights', rights));
        return when.join(
            getAccessRights(user, idA)
            .then((rights) => {
                if (!accessHas.create_access_from(rights)) {
                    throw new Error('user has no right to create access from ' + idA);
                }
            }),
            getAccessRights(user, idB)
            .then((rights) => {
                if (!accessHas.create_access_to(rights)) {
                    throw new Error('user has no right to create access to ' + idB);
                }
            })
        )
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
            logger.debug(msg.clone().set('what', 'db.update()').set('filter', filter).set('update', update));
            db.update(filter, update, (err, numAffected) => {
                if (err) return d.reject(err);
                if (numAffected == 0) return d.reject('Node ' + idB + ' not found');
                d.resolve(numAffected);
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
        });;
    };

    const operationIs = {};
    let _create = 0;
    // first operation is 'delete', all other are positive, so 'create' is sum of positives
    _create--;
    for (let i = 0; i < allOperations.length; i++) {
        operationIs[allOperations[i]] = (val) => (val & Math.pow(2, i)) > 0;
        _create += Math.pow(2, i);
    }
    operationIs.create = (val) => (val & _create) == _create;

    // @return {number} id
    storage.editNode = (
        id, user, operation, klass, title, ctype, content, flags, meta, relationsAdd, relationsRm
    ) => {
        let msg = Messages.new('where', 'editNode()', 'user', user, 'id', id);
        logger.verbose(msg);

        logger.debug(
            msg.clone().set('args', [id, user, operation, klass, title, ctype, content, flags, meta, relationsAdd, relationsRm])
        );
        return when().then(() => {
            // TODO more checks
            if (id == null && user == null && klass == 'user' && operationIs.create(operation)) {
                return getNextId()
                .then((_id) => {
                    user = _id;
                    id = user;
                    msg.set('user', user);
                    msg.set('id', id);
                });
            }
            if (id == null && user != null && klass != 'user' && klass != null && operationIs.create(operation)) {
                return getNextId()
                .then((_id) => {
                    id = _id;
                    msg.set('id', id);
                });
            }
        })
        .then(() => {
            assert(user != null, '"user" cannot be null');
            assert(id != null, 'node "id" cannot be null');
            assert(operation != null, '"operation" cannot be null');
            user = JSON.parse(user);
            return getAccessRights(user, id);
        })
        .then((rights) => {
            logger.debug(msg.clone().set('what', 'getAccessRights()').set('result', rights));
            const set = {};
            const unset = {};
            let upsert = false;
            const relIds = [];

            if (operationIs.delete(operation)) {
                msg.set('what', 'deleted node');
                assert(accessHas.delete(rights), 'user has no right to delete ' + id);
                const d = when.defer();
                db.remove({id: id}, (err, numAffected) => {
                    if (err) {
                        d.reject(err);
                    } else {
                        d.resolve(id);
                    }
                });
                return d.promise;
            }
            assert(accessHas.write(rights), 'user has no right to write ' + id);
            if (operationIs.title(operation)) {
                assert(title != null, '"title" cannot be null');
                assert.equal(typeof title, 'string', 'typeof "title" must be string');
                set.title = title;
            }
            if (operationIs.content(operation)) {
                assert(content != null, '"content" cannot be null');
                assert.equal(typeof ctype, 'string', 'typeof "ctype" must be string');
                if (content instanceof Buffer) {
                    content = content.toJSON();
                }
                set.content = content;
            }
            if (operationIs.flags(operation)) {
                assert(flags != null, '"flags" cannot be null');
                assert.equal(typeof flags, 'number', 'typeof "flags" must be number');
                set.flags = flags;
            }
            if (operationIs.meta(operation)) {
                assert(meta != null, '"meta" cannot be null');
                // check meta is valid json
                JSON.parse(meta);
                set.meta = meta;
            }
            if (operationIs.relations(operation)) {
                assert(relationsAdd != null || relationsRm != null, '"relations" cannot be null');
                relationsAdd = relationsAdd ? relationsAdd.split(',') : [];
                if (relationsAdd && relationsAdd.length > 0) {
                    msg.set('relationsAdd', relationsAdd.length/3);
                    for (let i = 0; i < relationsAdd.length / 3; i++) {
                        const rId = JSON.parse(relationsAdd[3*i + 0]);
                        const rTitle = decodeURIComponent(relationsAdd[3*i + 1]);
                        const rValue = JSON.parse(decodeURIComponent(relationsAdd[3*i + 2]) || 'null');
                        assert.equal(typeof rId, 'number', '"relation" id must be number');
                        assert(rId != id, '"relations" cant have the node itself');
                        set['relations.' + rId] = {
                            local_title: rTitle,
                            local_value: rValue
                        };
                        relIds.push(rId);
                    }
                }
                relationsRm = relationsRm ? relationsRm.split(',') : [];
                if (relationsRm && relationsRm.length > 0) {
                    msg.set('relationsRm', relationsRm.length);
                    for (let i = 0; i < relationsRm.length; i++) {
                        const rId = JSON.parse(relationsRm[i]);
                        assert.equal(typeof rId, 'number', '"relation" id must be number');
                        assert(rId != id, '"relations" cant have the node itself');
                        unset['relations.' + rId] = true;
                        relIds.push(rId);
                    }
                }
            }
            if (operationIs.create(operation)) {
                msg.set('what', 'created node', id);
                assert(klass != null, '"class" cannot be null');
                assert.equal(typeof klass, 'string', 'typeof "class" must be string');
                set.author = user;
                set.class = klass;
                upsert = true;
                set.accessRightsById = {};
                set.accessRightsById[user] = fullAccess;
            }

            return when()
            .then(() => {
                // check that user can 'relate' to nodes
                if (relIds.length > 0) {
                    return getNodes(relIds.concat(user))
                    .then((nodes) => {
                        const userNode = nodes.pop();
                        for (let i = 0; i < nodes.length; i++) {
                            const node = nodes[i];
                            assert(node != null, 'relation ' + relIds[i] + ' not found');
                            if (!hasUserRightOnNode(user, userNode, node, 'relate')) {
                                throw new Error('user ' + user + ' cant relate to node ' + node.id);
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
                }
            })
            .then(() => {
                const filter = {id: id};
                const update = {$set: set, $unset: unset};
                const opts = {upsert: upsert};
                logger.debug(msg.clone().set('what', 'db.update()').set('filter', filter).set('update', update).set('options', opts));
                const d = when.defer();
                db.update(filter, update, opts, (err, numAffected) => {
                    if (err) {
                        return d.reject(err);
                    }
                    if (numAffected == 0) {
                        return d.reject(new Error('Node not found'));
                    }
                    d.resolve(id);
                });
                return d.promise;
            });
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
        for (let i = 0; i < relationsFilter.length / 4; i++) {
            const rType = relationsFilter[4*i];
            const rId = relationsFilter[4*i + 1];
            const rValMin = relationsFilter[4*i + 2];
            const rValMax = relationsFilter[4*i + 3];
            if (rType && !rId) {
                filter['relationsByType.' + rType] = {$exists: true, $ne: {}};
            }
            if (rId) {
                if (rValMin == null && rValMax == null) {
                    filter['relations.' + rId] = {$exists: true};
                }
                if (rValMin != null) {
                    filter['relations.' + rId +'.local_value'] = filter['relations.' + rId +'.local_value'] || {};
                    filter['relations.' + rId +'.local_value'].$gte = parseFloat(rValMin, 10);
                }
                if (rValMax != null) {
                    filter['relations.' + rId +'.local_value'] = filter['relations.' + rId +'.local_value'] || {};
                    filter['relations.' + rId +'.local_value'].$lte = parseFloat(rValMax, 10);
                }
            }
        }
        if (Object.keys(filter).length == 0) return null;
        return filter;
    };

    storage.getNodes = (
        user, idIn, idOut, idMin, idMax, classIn, classOut, titleLike, contentLike,
            relationsIn, relationsOut, responseFields, sort, limit
    ) => {
        // TODO check args
        user = JSON.parse(user);
        let msg = Messages.new('where', 'getNodes()', 'user', user);
        logger.verbose(msg);
        logger.debug(
            msg.clone().set('args', [user, idIn, idOut, idMin, idMax, classIn, classOut, titleLike, contentLike,
                relationsIn, relationsOut, responseFields, sort, limit])
        );
        return getNodes([user])
        .then((nodes) => {
            const ignoredParameters = [];
            const projection = {id: 1, accessRightsById: 1, _id: 0};
            const filter = {};
            const userNode = nodes[0];
            addToFilterAccessByUser(filter, user, userNode);
            logger.debug(msg.clone().set('what', 'addToFilterAccessByUser()').set('result', filter));
            try {
                if (idIn || idOut || idMin || idMax) {
                    filter.id = {};
                }
                if (idIn) {
                    filter.id.$in = JSON.parse('[' + idIn + ']');
                }
                if (idOut) {
                    filter.id.$nin = JSON.parse('[' + idOut + ']');
                }
                if (idMin) {
                    filter.id.$gte = JSON.parse(idMin);
                }
                if (idMax) {
                    filter.id.$lt = JSON.parse(idMax);
                }
                if (classIn || classOut) {
                    filter.class = {};
                }
                if (classIn) {
                    filter.class.$in = classIn.split(',');
                }
                if (classOut) {
                    filter.class.$nin = classIn.split(',');
                }
                if (titleLike) {
                    const re = titleLike.match(/^regex:(.*)$/);
                    if (re) {
                        filter.title = {$regex: RegExp(re[1])};
                    } else {
                        ignoredParameters.push('titleLike');
                    }
                }
                if (contentLike) {
                    ignoredParameters.push('contentLike');
                }
                if (relationsIn) {
                    const addFilter = makeRelationsFilter(relationsIn);
                    if (addFilter) {
                        Object.assign(filter, addFilter);
                    }
                }
                if (relationsOut) {
                    const addFilter = makeRelationsFilter(relationsOut);
                    if (addFilter) {
                        Object.assign(filter, {$not: addFilter});
                    }
                }
                if (responseFields) {
                    const ar = responseFields.split(',');
                    for (let i in ar) {
                        if (NodeFields.get(ar[i])) {
                            projection[ar[i]] = 1;
                        }
                    }
                }
            } catch (e) {
                return when.reject(e);
            }
            const d = when.defer();
            logger.debug(msg.clone().set('what', 'db.find()').set('filter', filter));
            db.find(filter, projection, (err, docs) => {
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
                                encodeURIComponent(JSON.stringify(node.relations[rId].local_value))
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

    return storage;
};
