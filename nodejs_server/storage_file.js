'use strict';

const assert = require('assert');
const when = require('when');
const NeDB = require('nedb');
const storageAPI = require('./storage_api');

module.exports = (config) => {
    const db = config
        ?
        new NeDB({
            filename: config.filename,
            autoload: true,
        })
        :
        new NeDB();

    const logger = config && config.logger ? config.logger : require('./console_logger');

    const storage = Object.assign({}, storageAPI);

    storage.clear = () => {
        const d = when.defer();
        db.remove({}, {multi: true}, (err, numRemoved) => {
            if (err) return d.reject(err);
            // logger.debug('clear() removed:', numRemoved);
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

    const allAccessRights = ['read', 'relate', 'write', 'delete', 'create_access_to', 'create_access_from'];
    const fullAccess = parseInt(''.padEnd(allAccessRights.length, '1'), 2);
    const accessHas = {};
    for (let i = 0; i < allAccessRights.length; i++) {
        accessHas[allAccessRights[i]] = (val) => (val & Math.pow(2, i)) > 0;
    }

    const calcAccesRights = (idA, nodeA, nodeB) => {
        // logger.debug('calcAccesRights()', 'idA:', idA, 'nodeA:', nodeA, 'nodeB:', nodeB);
        if (nodeB == null) {
            // logger.debug('nodeB not exists');
            return fullAccess;
        }
        // direct rights cover all indirect
        if (nodeB.accessRightsById[idA]) {
            return nodeB.accessRightsById[idA];
        }
        // summarize indirect rights
        let rights = 0;
        for (const rId in nodeA.relationsById) {
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
            return calcAccesRights(idA, nodeA, nodeB);
        });
    };

    storage.getAccess = (userId, idA, idB) => {
        logger.verbose('editAccess()');
        logger.debug('editAccess args:', userId, idA, idB, rights);
        return whan.join(
            getAccessRights(userId, idA)
            .then((rights) => {
                if (!accessHas.create_access_from(rights)) {
                    throw new Error('user has no right to see access from ' + idA);
                }
            }),
            getAccessRights(userId, idB)
            .then((rights) => {
                if (!accessHas.create_access_to(rights)) {
                    throw new Error('user has no right to see access to ' + idB);
                }
            })
        )
        .then(() => {
            return getAccessRights(idA, idB);
        });
    };

    storage.setAccessRight = (rights, rightName) => {
        return accessHas[rightName](rights);
    };

    storage.hasAccessRight = (rights, rightName) => {
        return accessHas[rightName](rights);
    };

    storage.editAccess = (userId, idA, idB, rights) => {
        logger.verbose('editAccess()');
        logger.debug('editAccess args:', userId, idA, idB, rights);
        return when.join(
            getAccess(userId, idA)
            .then((rights) => {
                if (!accessHas.create_access_from(rights)) {
                    throw new Error('user has no right to create access from ' + idA);
                }
            }),
            getAccess(userId, idB)
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
            db.update({
                id: idB
            }, {
                $set: set
            }, (err, numAffected) => {
                if (err) return d.reject(err);
                logger.debug('editAccess result:', numAffected);
                if (numAffected == 0) return d.reject('Node ' + idB + ' not found');
                d.resolve(numAffected);
            });
            return d.promise;
        });
    };

    const allOperations = ['delete', 'title', 'content', 'flags', 'meta', 'relations'];
    const operationIs = {};
    for (let i = 0; i < allOperations.length; i++) {
        operationIs[allOperations[i]] = (val) => (val & Math.pow(2, i)) > 0;
    }
    operationIs.create = (val) => (val & 62) == 62;

    storage.editNode = (
        userId, id, type, operation, title, content, flags, meta, relationsAdd, relationsRm
    ) => {
        logger.verbose('editNode()');
        logger.debug(
            'editNode() args:', userId, id, type, operation, title, content, flags, meta, relationsAdd, relationsRm
        );
        try {
            assert(userId != null, '"userId" cannot be null');
            assert(id != null, 'node "id" cannot be null');
            assert(operation != null, '"operation" cannot be null');
        } catch (e) {
            return when.reject(e);
        }
        return getAccessRights(userId, id)
        .then((rights) => {
            logger.vverbose('getAccessRights()', 'userId:', userId, 'id:', id, 'rights:', rights);
            const set = {};
            const unset = {};
            let upsert = false;
            const relIds = [];
            try {
                if (operationIs.delete(operation)) {
                    assert(accessHas.delete(rights), 'user has no right to delete ' + id);
                    const d = when.defer();
                    db.remove({id: id}, (err, numAffected) => {
                        logger.debug('editNode() result:', err, numAffected);
                        if (err) d.reject(err);
                        else d.resolve(numAffected);
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
                    JSON.parse(meta);
                    set.meta = meta;
                }
                if (operationIs.relations(operation)) {
                    assert(relationsAdd != null || relationsRm != null, '"relations" cannot be null');
                    if (relationsAdd && relationsAdd.length > 0) {
                        for (let i = 0; i < relationsAdd.length / 3; i++) {
                            const rId = relationsAdd[3*i + 0];
                            const rTitle = relationsAdd[3*i + 1];
                            const rValue = relationsAdd[3*i + 2];
                            assert(rId != id, '"relations" cant have the node itself');
                            assert(rId != null, '"relations" must have ids');
                            set['relationsById.' + rId] = {
                                local_title: rTitle,
                                local_value: rValue
                            };
                            relIds.push(rId);
                        }
                    }
                    if (relationsRm && relationsRm.length > 0) {
                        for (let i = 0; i < relationsRm.length; i++) {
                            const rId = relationsRm[i];
                            assert(rId != id, '"relations" cant have the node itself');
                            assert(rId != null, '"relations" must have ids');
                            unset['relationsById.' + rId] = true;
                            relIds.push(rId);
                        }
                    }
                }
                if (operationIs.create(operation)) {
                    assert(type != null, '"type" cannot be null');
                    assert.equal(typeof type, 'string', 'typeof "type" must be string');
                    set.author = userId;
                    set.type = type;
                    upsert = true;
                    set.accessRightsById = {};
                    set.accessRightsById[userId] = fullAccess;
                }
            } catch (e) {
                return when.reject(e);
            }
            return when()
            .then(() => {
                // check that user can 'relate' to nodes
                if (relIds.length > 0) {
                    return getNodes(relIds.concat(userId))
                    .then((nodes) => {
                        const userNode = nodes.pop();
                        for (let i = 0; i < nodes.length; i++) {
                            const node = nodes[i];
                            assert(node != null, 'relation ' + relIds[i] + ' not found');
                            if (!hasUserRightOnNode(userId, userNode, node, 'relate')) {
                                throw new Error('user ' + userId + ' cant relate to ' + node.id);
                            }
                            // setting "type" for easier search
                            if (relationsAdd && i < relationsAdd.length / 3) {
                                set['relationsByType.' + node.type +'.' + node.id] = true;
                                set['relationsById.' + node.id].type = node.type;
                            } else {
                                unset['relationsByType.' + node.type +'.' + node.id] = true;
                            }
                        }
                    });
                }
            })
            .then(() => {
                logger.debug('set:', set);
                logger.debug('unset:', unset);
                const d = when.defer();
                db.update({id: id}, {$set: set, $unset: unset}, {upsert: upsert}, (err, numAffected) => {
                    logger.debug('editNode() result:', err, numAffected);
                    if (err) return d.reject(err);
                    if (numAffected == 0) return d.reject('Node not found');
                    d.resolve(numAffected);
                });
                return d.promise;
            });
        });
    };

    const addToFilterAccessByUser = (filter, userId, userNode) => {
        // logger.debug('addToFilterAccessByUser()', filter, userId, userNode);
        // find Nodes with any kind of access from user, then filter out those without read access
        const rIds = Object.keys(userNode.relationsById || {});
        rIds.push(userId);
        filter.$or = [];
        for (let i = 0; i < rIds.length; i++) {
            const tmp = {};
            tmp['accessRightsById.' + rIds[i]] = {$exists: true};
            filter.$or.push(tmp);
        }
    };

    const hasUserRightOnNode = (userId, userNode, node, rightName) => {
        return accessHas[rightName](calcAccesRights(userId, userNode, node));
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
                    filter['relationsById.' + rId] = {$exists: true};
                }
                if (rValMin != null) {
                    filter['relationsById.' + rId +'.local_value'] = filter['relationsById.' + rId +'.local_value'] || {};
                    filter['relationsById.' + rId +'.local_value'].$gte = parseFloat(rValMin, 10);
                }
                if (rValMax != null) {
                    filter['relationsById.' + rId +'.local_value'] = filter['relationsById.' + rId +'.local_value'] || {};
                    filter['relationsById.' + rId +'.local_value'].$lte = parseFloat(rValMax, 10);
                }
            }
        }
        if (Object.keys(filter).length == 0) return null;
        return filter;
    };

    storage.findNodes = (
        userId, ids, types, titleRegexp, relationsFilterIn, relationsFilterOut
    ) => {
        logger.verbose('findNodes()');
        logger.debug(
            'findNodes() args:', userId, ids, types, titleRegexp, relationsFilterIn, relationsFilterOut
        );
        return getNodes([userId])
        .then((nodes) => {
            const filter = {};
            const userNode = nodes[0];
            addToFilterAccessByUser(filter, userId, userNode);
            try {
                if (ids) {
                    filter.id = {$in: ids};
                }
                if (types) {
                    filter.type = {$in: types};
                }
                if (titleRegexp) {
                    filter.title = {$regex: RegExp(titleRegexp)};
                }
                if (relationsFilterIn) {
                    const addFilter = makeRelationsFilter(relationsFilterIn);
                    if (addFilter) {
                        Object.assign(filter, addFilter);
                    }
                }
                if (relationsFilterOut) {
                    const addFilter = makeRelationsFilter(relationsFilterOut);
                    if (addFilter) {
                        Object.assign(filter, {$not: addFilter});
                    }
                }
            } catch (e) {
                return when.reject(e);
            }
            const d = when.defer();
            logger.debug('db.find()', JSON.stringify(filter, null, '  '));
            db.find(filter, {id: 1, accessRightsById: 1}, (err, docs) => {
                if (err) return d.reject(err);
                const res = [];
                for (let i = 0; i < docs.length; i++) {
                    const node = docs[i];
                    if (!hasUserRightOnNode(userId, userNode, node, 'read')) continue;
                    res.push(node.id);
                }
                logger.debug('findNodes() result:', err, res);
                d.resolve(res);
            });
            return d.promise;
        });
    };

    storage.getNodes = (userId, ids) => {
        logger.verbose('getNodes()');
        logger.debug('getNodes() args:', userId, ids);
        return getNodes([userId])
        .then((nodes) => {
            const filter = {id: {$in: ids}};
            const userNode = nodes[0];
            addToFilterAccessByUser(filter, userId, userNode);
            const d = when.defer();
            logger.debug('db.find()', JSON.stringify(filter, null, '  '));
            db.find(filter, {
                _id: 0,
                id: 1,
                author: 1,
                type: 1,
                title: 1,
                content: 1,
                flags: 1,
                meta: 1,
                relationsById: 1,
                accessRightsById: 1
            }, (err, docs) => {
                if (err) return d.reject(err);
                const res = [];
                for (let i = 0; i < docs.length; i++) {
                    const node = docs[i];
                    if (!hasUserRightOnNode(userId, userNode, node, 'read')) continue;
                    node.relations = [];
                    node.content = (typeof node.content == 'object' && node.content.type == 'Buffer')
                        ?
                        Buffer.from(node.content.data)
                        :
                        node.content;
                    for (const rId in node.relationsById) {
                        node.relations.push(node.relationsById[rId].type);
                        node.relations.push(rId);
                        node.relations.push(node.relationsById[rId].local_title);
                        node.relations.push(node.relationsById[rId].local_value);
                    }
                    delete node.relationsById;
                    delete node.accessRightsById;
                    res.push(node);
                }
                logger.debug('getNodes() result:', err, res);
                d.resolve(res);
            });
            return d.promise;
        });
    };

    return storage;
};
