'use strict';

const assert = require('assert');
const API = require('../storage_api');

let storage;

const scenarios = [{
    title: 'create note & get note',
    steps: [{
        title: 'insert test note',
        method: 'editNote',
        params: {
            userId: 'Joe',
            id: 'testNoteId',
            type: 'note',
            operation: parseInt('111110', 2),
            title: 'test note',
            content: new Buffer('hello world'),
            flags: 2,
            meta: JSON.stringify({}),
            relationsAdd: [],
            relationsRm: [],
        },
        result: {
            error: false
        }
    }, {
        title: 'get note',
        method: 'getNotes',
        params: {
            userId: 'Joe',
            ids: ['testNoteId']
        },
        result: {
            length: 1
        }
    }]
}, {
    title: 'fails on create',
    steps: [{
        title: 'note without id',
        method: 'editNote',
        params: {
            id: null,
            userId: 'Joe',
            type: 'note',
            operation: parseInt('111110', 2),
            title: 'note without id',
            content: new Buffer('no id = no insert'),
            flags: 2,
            meta: JSON.stringify({}),
            relationsAdd: [],
            relationsRm: [],
        },
        result: {
            error: true
        }
    }]
}, {
    title: 'create tag and note with it',
    steps: [{
        title: 'create tag',
        method: 'editNote',
        params: {
            id: 'firstTagId',
            userId: 'Joe',
            type: 'tag',
            operation: parseInt('111110', 2),
            title: 'first tag',
            content: new Buffer('First tag!'),
            flags: 2,
            meta: JSON.stringify({}),
            relationsAdd: [],
            relationsRm: [],
        },
        result: {
            error: false,
        }
    }, {
        title: 'create note with tag',
        method: 'editNote',
        params: {
            id: 'noteWithTagId',
            userId: 'Joe',
            type: 'note',
            operation: parseInt('111110', 2),
            title: 'note with tag',
            content: new Buffer('ok, lets try using our #"first tag"'),
            flags: 2,
            meta: JSON.stringify({}),
            relationsAdd: ['tag', 'firstTagId', 'first tag', null],
            relationsRm: [],
        },
        result: {
            error: false,
        }
    }]
}, {
    title: 'TODO',
    steps: []
}];

describe('File based storage', function() {
    it('init storage', () => {
        storage = require('../storage_file')();
    });

    for (let i = 0; i < scenarios.length; i++) {
        const scenario = scenarios[i];
        describe('scenario: ' + scenario.title, function() {
            for (let j = 0; j < scenario.steps.length; j++) {
                const step = scenario.steps[j];
                it('step: ' + step.title, (done) => {
                    const ar = [];
                    for (let p = 0; p < API[step.method].length; p++) {
                        ar.push(step.params[API[step.method][p]]);
                    }

                    //console.log(step.method, 'params:', ...ar);

                    storage[step.method](...ar)
                    .then((res) => {

                    //    console.log(step.method, 'result:', res);

                        if (step.result.length != null) {
                            assert.equal(res.length, step.result.length);
                        }
                    })
                    .catch((e) => {
                        if (!step.result.error) {
                            throw e;
                        }
                    })
                    .then(() => {
                        done();
                    })
                    .catch(done);
                });
            }
        });
    }

    // TODO Access
});
