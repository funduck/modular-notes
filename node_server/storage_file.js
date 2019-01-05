'use strict';

const assert = require('assert');
const when = require('when');
const NeDB = require('nedb');
const API = require('./storage_api');

module.exports = function(config) {
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

    storage.clear = function() {
        const d = when.defer();
        db.remove({}, (err, numRemoved) => {
            if (err) d.reject(err);
            else d.resolve(numRemoved);
        });
        return d.promise;
    };

    storage.editNote = function(
        userId, id, type, operation, title, content, flags, meta, relationsAdd, relationsRm
    ) {
        logger.verbose('editNote()');
        logger.debug(
            'editNote() args:', userId, id, type, operation, title, content, flags, meta, relationsAdd, relationsRm
        );

        // TODO use operation and calculate all fields
        // TODO access

        try {
            assert(userId != null, '"userId" cannot be null');
            assert(id != null, 'note "id" cannot be null');
            assert(operation != null, '"operation" cannot be null');
        } catch (e) {
            return when.reject(e);
        }

        const set = {};
        const unset = {};
        let upsert = false;

        if (operation & 1) {
            const d = when.defer();
            db.remove({id: id}, (err, numAffected) => {
                logger.debug('editNote() result:', err, numAffected);
                if (err) d.reject(err);
                else d.resolve(numAffected);
            });
            return d.promise;
        }

        try {
            if (operation & 2) {
                assert(title != null, '"title" cannot be null');
                assert.equal(typeof title, 'string', 'typeof "title" must be string');
                set.title = title;
            }
            if (operation & 4) {
                assert(content != null, '"content" cannot be null');
                assert(content instanceof Buffer, '"content" must be Buffer');
                set.content = content.toJSON();
            }
            if (operation & 8) {
                assert(flags != null, '"flags" cannot be null');
                assert.equal(typeof flags, 'number', 'typeof "flags" must be number');
                set.flags = flags;
            }
            if (operation & 16) {
                assert(meta != null, '"meta" cannot be null');
                JSON.parse(meta);
                set.meta = meta;
            }
            if (operation & 32) {
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
            if (operation & 62 == 62) {
                assert(type != null, '"type" cannot be null');
                assert.equal(typeof type, 'string', 'typeof "type" must be string');
                upsert = true;
                set.author = userId;
                set.type = type;
            }
        } catch (e) {
            return when.reject(e);
        }

        const d = when.defer();
        db.update({id: id}, {$set: set, $unset: unset}, {upsert: upsert}, (err, numAffected) => {
            logger.debug('editNote() result:', err, numAffected);
            if (err) d.reject(err);
            else d.resolve(numAffected);
        });
        return d.promise;
    };

    storage.getNotesIds = function(
        userId, ids, types, titleRegexp, relationsFilterIn, relationsFilterOut
    ) {
        logger.verbose('getNotesIds()');
        logger.debug(
            'getNotesIds() args:', userId, ids, types, titleRegexp, relationsFilterIn, relationsFilterOut
        );

        const filter = {};
        try {
            // TODO access
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
                for (let i = 0; i < relationsFilterIn.length / 4; i++) {
                    const rType = relationsFilterIn[4*i];
                    const rId = relationsFilterIn[4*i + 1];
                    const rValMin = relationsFilterIn[4*i + 2];
                    const rValMax = relationsFilterIn[4*i + 3];
                    if (rType && !rId) {
                        filter.relationsByType = filter.relationsByType || {};
                        filter.relationsByType[rType] = {$and: [{$exists: true}, {$ne: {}}]};
                    }
                    if (rId) {
                        filter.relationsById = filter.relationsById || {};
                        filter.relationsById[rId] = filter.relationsById[rId] || {};
                        if (!rValMin && !rValMax) {
                            filter.relationsById[rId] = {$exists: true};
                        }
                        if (rValMin) {
                            filter.relationsById[rId].loc_value = filter.relationsById[rId].loc_value || {};
                            filter.relationsById[rId].loc_value.$gte = parseFloat(rValMin, 10);
                        }
                        if (rValMax) {
                            filter.relationsById[rId].loc_value = filter.relationsById[rId].loc_value || {};
                            filter.relationsById[rId].loc_value.$lte = parseFloat(rValMax, 10);
                        }
                    }
                }
            }
            if (relationsFilterOut) {
                for (let i = 0; i < relationsFilterOut.length / 4; i++) {
                    const rType = relationsFilterOut[4*i];
                    const rId = relationsFilterOut[4*i + 1];
                    const rValMin = relationsFilterOut[4*i + 2];
                    const rValMax = relationsFilterOut[4*i + 3];
                    if (rType && !rId) {
                        filter.relationsByType = filter.relationsByType || {};
                        filter.relationsByType[rType] = {$or: [{$exists: false}, {$eq: {}}]};
                    }
                    if (rId) {
                        filter.relationsById = filter.relationsById || {};
                        filter.relationsById[rId] = filter.relationsById[rId] || {};
                        if (!rValMin && !rValMax) {
                            filter.relationsById[rId] = {$exists: false};
                        }
                        if (rValMin) {
                            filter.relationsById[rId].loc_value = filter.relationsById[rId].loc_value || {};
                            filter.relationsById[rId].loc_value.$or = filter.relationsById[rId].loc_value.$or || [];
                            filter.relationsById[rId].loc_value.$or.push({$lte: parseFloat(rValMin, 10)});
                        }
                        if (rValMax) {
                            filter.relationsById[rId].loc_value = filter.relationsById[rId].loc_value || {};
                            filter.relationsById[rId].loc_value.$or = filter.relationsById[rId].loc_value.$or || [];
                            filter.relationsById[rId].loc_value.$or.push({$gte: parseFloat(rValMax, 10)});
                        }
                    }
                }
            }
        } catch (e) {
            return when.reject(e);
        }
        const d = when.defer();
        db.find(filter, {id: 1}, (err, docs) => {
            logger.debug('getNotesIds() result:', err, docs);
            if (err) d.reject(err);
            else d.resolve(docs);
        });
        return d.promise.then((docs) => {
            const res = [];
            for (let i = 0; i < docs.length; i++) {
                res.push(docs[i].id);
            }
            return res;
        });
    };

    storage.getNotes = function(userId, ids) {
        logger.verbose('getNotes()');
        logger.debug('getNotes() args:', userId, ids);

        // TODO access
        const d = when.defer();
        db.find({id: {$in: ids}}, {
            _id: 0,
            id: 1,
            author: 1,
            type: 1,
            title: 1,
            content: 1,
            flags: 1,
            meta: 1,
            relationsById: 1,
        }, (err, docs) => {
            if (err) d.reject(err);
            for (let i = 0; i < docs.length; i++) {
                docs[i].relations = [];
                docs[i].content = Buffer.from(docs[i].content.data);
                for (const rId in docs[i].relationsById) {
                    docs[i].relations.push(docs[i].relationsById[rId].type);
                    docs[i].relations.push(rId);
                    docs[i].relations.push(docs[i].relationsById[rId].loc_title);
                    docs[i].relations.push(docs[i].relationsById[rId].loc_value);
                }
                delete docs[i].relationsById;
            }
            logger.debug('getNotes() result:', err, docs);
            d.resolve(docs);
        });
        return d.promise;
    };

    return storage;
};
