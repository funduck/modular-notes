'use strict';

const assert = require('assert');
const when = require('when');
const NeDB = require('nedb');
const API = require('./storage_api');

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

    const storage = Object.assign({}, API);

    storage.clear = () => {
        const d = when.defer();
        db.remove({}, (err, numRemoved) => {
            if (err) d.reject(err);
            else d.resolve(numRemoved);
        });
        return d.promise;
    };

    const getNotes = (ids) => {
        const d = when.defer();
        db.find({
            id: {$in: ids}
        }, (err, docs) => {
            if (err) return d.reject(err);
            d.resolve(docs);
        });
        return d.promise;
    };

    const fullAccess = parseInt('11111', 2);
    const accessHas = {
        read: (val) => (val & 1) > 0,
        write: (val) => (val & 2) > 0,
        delete: (val) => (val & 4) > 0,
        create_access_to: (val) => (val & 8) > 0,
        create_access_from: (val) => (val & 16) > 0
    };

    const calcAccesRights = (idA, noteA, noteB) => {
        // logger.debug('calcAccesRights()', 'idA:', idA, 'noteA:', noteA, 'noteB:', noteB);
        if (noteB == null) {
            // logger.debug('noteB not exists');
            return fullAccess;
        }
        // direct rights cover all indirect
        if (noteB.rightsById[idA]) {
            return noteB.rightsById[idA];
        }
        // summarize indirect rights
        let rights = 0;
        for (const rId in noteA.relationsById) {
            if (noteB.rightsById[rId] > 0) {
                rights = (rights & noteB.rightsById[rId]);
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
            const noteA = notes[0].id == idA ? notes[0] : notes[1];
            const noteB = notes[0].id == idA ? notes[1] : notes[0];
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
            set['rightsById.' + idA] = rights;
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

    const operationIs = {
        delete: (val) => (val & 1) > 0,
        title: (val) => (val & 2) > 0,
        content: (val) => (val & 4) > 0,
        flags: (val) => (val & 8) > 0,
        meta: (val) => (val & 16) > 0,
        relations: (val) => (val & 32) > 0,
        create: (val) => (val & 62) == 62,
    };

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
            let isCreate = false;
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
                    assert(content instanceof Buffer, '"content" must be Buffer');
                    set.content = content.toJSON();
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
                        for (let i = 0; i < relationsAdd.length / 4; i++) {
                            const rType = relationsAdd[4*i];
                            const rId = relationsAdd[4*i + 1];
                            const rTitle = relationsAdd[4*i + 2];
                            const rValue = relationsAdd[4*i + 3];
                            set['relationsByType.' + rType +'.' + rId] = true;
                            set['relationsById.' + rId] = {
                                type: rType,
                                loc_title: rTitle,
                                loc_value: rValue
                            };
                        }
                    }
                    if (relationsRm && relationsRm.length > 0) {
                        for (let i = 0; i < relationsRm.length / 2; i++) {
                            const rType = relationsRm[2*i];
                            const rId = relationsRm[2*i + 1];
                            unset['relationsByType.' + rType +'.' + rId] = true;
                            unset['relationsById.' + rId] = true;
                        }
                    }
                }
                if (operationIs.create(operation)) {
                    assert(type != null, '"type" cannot be null');
                    assert.equal(typeof type, 'string', 'typeof "type" must be string');
                    set.author = userId;
                    set.type = type;
                    set.rightsById = {};
                    set.rightsById[userId] = fullAccess;
                    isCreate = true;
                }
            } catch (e) {
                return when.reject(e);
            }
            logger.debug('set:', set);
            logger.debug('unset:', unset);
            const d = when.defer();
            db.update({id: id}, {$set: set, $unset: unset}, {upsert: isCreate}, (err, numAffected) => {
                logger.debug('editNote() result:', err, numAffected);
                if (err) return d.reject(err);
                if (numAffected == 0) return d.reject('Note not found');
                d.resolve(numAffected);
            });
            return d.promise;
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
            tmp['rightsById.' + rIds[i]] = {$exists: true};
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
                if (!rValMin && !rValMax) {
                    filter['relationsById.' + rId] = {$exists: true};
                }
                if (rValMin) {
                    filter['relationsById.' + rId +'.loc_value'] = {$gte: parseFloat(rValMin, 10)};
                }
                if (rValMax) {
                    filter['relationsById.' + rId +'.loc_value'] = {$lte: parseFloat(rValMax, 10)};
                }
            }
        }
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
            const filter = {what: 'Note'};
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
                    filter.title = {$regex: new RegExp(titleRegexp)};
                }
                if (relationsFilterIn) {
                    Object.assign(filter, makeRelationsFilter(relationsFilterIn));
                }
                if (relationsFilterOut) {
                    Object.assign(filter, {$not: makeRelationsFilter(relationsFilterIn)});
                }
            } catch (e) {
                return when.reject(e);
            }
            const d = when.defer();
            logger.debug('db.find()', JSON.stringify(filter, null, '  '));
            db.find(filter, {id: 1, rightsById: 1}, (err, docs) => {
                logger.debug('getNotesIds() result:', err, docs);
                if (err) return d.reject(err);
                const res = [];
                for (let i = 0; i < docs.length; i++) {
                    const note = docs[i];
                    if (!hasUserRightOnNote(userId, userNote, note, 'read')) continue;
                    res.push(note.id);
                }
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
                rightsById: 1
            }, (err, docs) => {
                if (err) return d.reject(err);
                const res = [];
                for (let i = 0; i < docs.length; i++) {
                    const note = docs[i];
                    if (!hasUserRightOnNote(userId, userNote, note, 'read')) continue;
                    note.relations = [];
                    note.content = Buffer.from(note.content.data);
                    for (const rId in note.relationsById) {
                        note.relations.push(note.relationsById[rId].type);
                        note.relations.push(rId);
                        note.relations.push(note.relationsById[rId].loc_title);
                        note.relations.push(note.relationsById[rId].loc_value);
                    }
                    delete note.relationsById;
                    delete note.rightsById;
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
