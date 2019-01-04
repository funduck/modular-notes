'use strict';

const assert = require('assert');
const when = require('when');

let storage;

const editNote = [{
    params: {
        id: 'testNoteId',
        author: 'Joe',
        type: 'note',
        title: 'test note',
        content: new Buffer('hello world'),
        flags: 2,
        meta: JSON.stringify({}),
        relations: [],
    },
    result: {
        error: false,
    },
}, {
    params: {
        id: 'firstTagId',
        author: 'Joe',
        type: 'tag',
        title: 'first tag',
        content: new Buffer('First tag!'),
        flags: 2,
        meta: JSON.stringify({}),
        relations: [],
    },
    result: {
        error: false,
    },
}, {
    params: {
        id: 'noteWithTagId',
        author: 'Joe',
        type: 'note',
        title: 'note with tag',
        content: new Buffer('ok, lets try using our #"first tag"'),
        flags: 2,
        meta: JSON.stringify({}),
        relations: ['tag', 'firstTagId', 'first tag', null],
    },
    result: {
        error: false,
    }
}];

const getNotesIds = [{
    params: {
        userId: 'Joe',
        types: ['tag']
    },
    result: {
        length: 1
    }
}];

describe('File based storage', function() {
    it('init storage', () => {
        storage = require('./storage_file')();
    });

    it('insert notes', (done) => {
        when.iterate((i) => i + 1, (i) => i == editNote.length, (i) => {
            const n = editNote[i].params;
            return storage.editNote(
                n.author,
                n.id,
                n.type,
                parseInt('111110', 2),
                n.title,
                n.content,
                n.flags,
                n.meta,
                n.relations,
                []
            )
            .catch((e) => {
                if (!editNote[i].result.error) {
                    throw e;
                }
            });
        }, 0)
        .then(() => {
            done();
        })
        .catch(done);
    });

    it('get notes ids', (done) => {
        when.iterate((i) => i + 1, (i) => i == getNotesIds.length, (i) => {
            const n = getNotesIds[i].params;
            return storage.getNotesIds(
                n.userId,
                n.ids,
                n.types,
                n.titleRegexp,
                n.relationsFilterIn,
                n.relationsFilterOut
            )
            .then((res) => {
                if (getNotesIds[i].result.length) {
                    assert.equal(res.length, getNotesIds[i].result.length, 'case ' + i);
                }
            })
            .catch((e) => {
                if (!getNotesIds[i].result.error) {
                    throw e;
                }
            });
        }, 0)
        .then(() => {
            done();
        })
        .catch(done);
    });

    // TODO Access
});
