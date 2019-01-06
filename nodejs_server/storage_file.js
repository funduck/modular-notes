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

    const getNotes = (ids) => {
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

    const calcAccesRights = (idA, noteA, noteB) => {
        // logger.debug('calcAccesRights()', 'idA:', idA, 'noteA:', noteA, 'noteB:', noteB);
        if (noteB == null) {
            // logger.debug('noteB not exists');
            return fullAccess;
        }
        // direct rights cover all indirect
        if (noteB.accessRightsById[idA]) {
            return noteB.accessRightsById[idA];
        }
        // summarize indirect rights
        let rights = 0;
        for (const rId in noteA.relationsById) {
            if (noteB.accessRightsById[rId] > 0) {
                rights = (rights & noteB.accessRightsById[rId]);
            }
        }
        return rights;
    };

    const getAccessRights = (idA, idB) => {
        // Note has full access to itself
        if (idA == idB) {
            return when.resolve(fullAccess);
        }
        return getNotes([idA, idB])
        .then((notes) => {
            const noteA = notes[0];
            const noteB = notes[1];
            return calcAccesRights(idA, noteA, noteB);
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
                if (numAffected == 0) return d.reject('Note ' + idB + ' not found');
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

    storage.editNote = (
        userId, id, type, operation, title, content, flags, meta, relationsAdd, relationsRm
    ) => {
        logger.verbose('editNote()');
        logger.debug(
            'editNote() args:', userId, id, type, operation, title, content, flags, meta, relationsAdd, relationsRm
        );
        try {
            assert(userId != null, '"userId" cannot be null');
            assert(id != null, 'note "id" cannot be null');
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
                        logger.debug('editNote() result:', err, numAffected);
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
                            assert(rId != id, '"relations" cant have the note itself');
                            assert(rId != null, '"relations" must have ids');
                            set['relationsById.' + rId] = {
                                loc_title: rTitle,
                                loc_value: rValue
                            };
                            relIds.push(rId);
                        }
                    }
                    if (relationsRm && relationsRm.length > 0) {
                        for (let i = 0; i < relationsRm.length; i++) {
                            const rId = relationsRm[i];
                            assert(rId != id, '"relations" cant have the note itself');
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
                // check that user can 'relate' to notes
                if (relIds.length > 0) {
                    return getNotes(relIds.concat(userId))
                    .then((notes) => {
                        const userNote = notes.pop();
                        for (let i = 0; i < notes.length; i++) {
                            const note = notes[i];
                            assert(note != null, 'relation ' + relIds[i] + ' not found');
                            if (!hasUserRightOnNote(userId, userNote, note, 'relate')) {
                                throw new Error('user ' + userId + ' cant relate to ' + note.id);
                            }
                            // setting "type" for easier search
                            if (relationsAdd && i < relationsAdd.length / 3) {
                                set['relationsByType.' + note.type +'.' + note.id] = true;
                                set['relationsById.' + note.id].type = note.type;
                            } else {
                                unset['relationsByType.' + note.type +'.' + note.id] = true;
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
                    logger.debug('editNote() result:', err, numAffected);
                    if (err) return d.reject(err);
                    if (numAffected == 0) return d.reject('Note not found');
                    d.resolve(numAffected);
                });
                return d.promise;
            });
        });
    };

    const addToFilterAccessByUser = (filter, userId, userNote) => {
        // logger.debug('addToFilterAccessByUser()', filter, userId, userNote);
        // find Notes with any kind of access from user, then filter out those without read access
        const rIds = Object.keys(userNote.relationsById || {});
        rIds.push(userId);
        filter.$or = [];
        for (let i = 0; i < rIds.length; i++) {
            const tmp = {};
            tmp['accessRightsById.' + rIds[i]] = {$exists: true};
            filter.$or.push(tmp);
        }
    };

    const hasUserRightOnNote = (userId, userNote, note, rightName) => {
        return accessHas[rightName](calcAccesRights(userId, userNote, note));
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
                    filter['relationsById.' + rId +'.loc_value'] = filter['relationsById.' + rId +'.loc_value'] || {};
                    filter['relationsById.' + rId +'.loc_value'].$gte = parseFloat(rValMin, 10);
                }
                if (rValMax != null) {
                    filter['relationsById.' + rId +'.loc_value'] = filter['relationsById.' + rId +'.loc_value'] || {};
                    filter['relationsById.' + rId +'.loc_value'].$lte = parseFloat(rValMax, 10);
                }
            }
        }
        if (Object.keys(filter).length == 0) return null;
        return filter;
    };

    storage.getNotesIds = (
        userId, ids, types, titleRegexp, relationsFilterIn, relationsFilterOut
    ) => {
        logger.verbose('getNotesIds()');
        logger.debug(
            'getNotesIds() args:', userId, ids, types, titleRegexp, relationsFilterIn, relationsFilterOut
        );
        return getNotes([userId])
        .then((notes) => {
            const filter = {};
            const userNote = notes[0];
            addToFilterAccessByUser(filter, userId, userNote);
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
                    const note = docs[i];
                    if (!hasUserRightOnNote(userId, userNote, note, 'read')) continue;
                    res.push(note.id);
                }
                logger.debug('getNotesIds() result:', err, res);
                d.resolve(res);
            });
            return d.promise;
        });
    };

    storage.getNotes = (userId, ids) => {
        logger.verbose('getNotes()');
        logger.debug('getNotes() args:', userId, ids);
        return getNotes([userId])
        .then((notes) => {
            const filter = {id: {$in: ids}};
            const userNote = notes[0];
            addToFilterAccessByUser(filter, userId, userNote);
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
                    const note = docs[i];
                    if (!hasUserRightOnNote(userId, userNote, note, 'read')) continue;
                    note.relations = [];
                    note.content = (typeof note.content == 'object' && note.content.type == 'Buffer')
                        ?
                        Buffer.from(note.content.data)
                        :
                        note.content;
                    for (const rId in note.relationsById) {
                        note.relations.push(note.relationsById[rId].type);
                        note.relations.push(rId);
                        note.relations.push(note.relationsById[rId].loc_title);
                        note.relations.push(note.relationsById[rId].loc_value);
                    }
                    delete note.relationsById;
                    delete note.accessRightsById;
                    res.push(note);
                }
                logger.debug('getNotes() result:', err, res);
                d.resolve(res);
            });
            return d.promise;
        });
    };

    return storage;
};
