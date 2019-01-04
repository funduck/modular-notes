'use strict';

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

    const storage = Object.assign({}, API);

    storage.editNote = function(
        userId, noteId, type, operation, title, content, flags, meta, relationsAdd, relationsRm
    ) {
        const d = when.defer();
        // TODO use operation and calculate all fields
        // TODO use relationsRm
        // TODO access
        db.update({id: noteId}, {$set: {
            type: type,
            title: title,
            content: content,
            flags: flags,
            meta: meta,
            relations: relationsAdd
        }}, {upsert: true}, (err, numAffected) => {
            if (err) d.reject(err);
            else d.resolve(numAffected);
        });
        return d.promise;
    };

    storage.getNotesIds = function(
        userId, ids, types, titleRegexp, relationsFilterIn, relationsFilterOut
    ) {
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
                    const rType = relationsFilterIn[i];
                    const rId = relationsFilterIn[i + 1];
                    const rValMin = relationsFilterIn[i + 2];
                    const rValMax = relationsFilterIn[i + 3];
                    if (rType && !rId) {
                        filter.relationsByType = filter.relationsByType || {};
                        filter.relationsByType[rType] = {$exists: true};
                    }
                    if (rId) {
                        filter.relationsById = filter.relationsById || {};
                        filter.relationsById[rId] = filter.relationsById[rId] || {};
                        if (!rValMin && !rValMax) {
                            filter.relationsById[rId] = {$exists: true};
                        }
                        if (rValMin) {
                            filter.relationsById[rId].$gte = parseFloat(rValMin, 10);
                        }
                        if (rValMax) {
                            filter.relationsById[rId].$lte = parseFloat(rValMax, 10);
                        }
                    }
                }
            }
            if (relationsFilterOut) {
                for (let i = 0; i < relationsFilterOut.length / 4; i++) {
                    const rType = relationsFilterOut[i];
                    const rId = relationsFilterOut[i + 1];
                    const rValMin = relationsFilterOut[i + 2];
                    const rValMax = relationsFilterOut[i + 3];
                    if (rType && !rId) {
                        filter.relationsByType = filter.relationsByType || {};
                        filter.relationsByType[rType] = {$exists: false};
                    }
                    if (rId) {
                        filter.relationsById = filter.relationsById || {};
                        filter.relationsById[rId] = filter.relationsById[rId] || {};
                        if (!rValMin && !rValMax) {
                            filter.relationsById[rId] = {$exists: false};
                        }
                        if (rValMin) {
                            filter.relationsById[rId].$or = filter.relationsById[rId].$or || [];
                            filter.relationsById[rId].$or.push({$lte: parseFloat(rValMin, 10)});
                        }
                        if (rValMax) {
                            filter.relationsById[rId].$or = filter.relationsById[rId].$or || [];
                            filter.relationsById[rId].$or.push({$gte: parseFloat(rValMax, 10)});
                        }
                    }
                }
            }
        } catch (e) {
            return when.reject(e);
        }
        const d = when.defer();
        db.find(filter, {id: 1}, (err, docs) => {
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
        // TODO access
        const d = when.defer();
        db.find({id: {$in: ids}}, {
            id: 1,
            author: 1,
            type: 1,
            title: 1,
            content: 1,
            flags: 1,
            meta: 1,
            relations: 1,
        }, (err, docs) => {
            if (err) d.reject(err);
            else d.resolve(docs);
        });
        return d.promise;
    };

    return storage;
};
