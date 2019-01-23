'use strict';

const assert = require('assert');
const storageAPI = require('../storage_api');

require('../console_logger').setLevel('debug');

let storage;

const fs = require('fs');
const dataFiles = fs.readdirSync(__dirname + '/data/storage_file');
const scenarios = [];
for (const i in dataFiles) {
    scenarios.push(require('./data/storage_file/' + dataFiles[i]));
}

describe('File based storage', function() {
    before(() => {
        storage = require('../storage_file')();
    });

    after((done) => {
        storage.clear()
        .then(() => {
            done();
        })
        .catch(done);
    });

    for (let i = 0; i < scenarios.length; i++) {
        const scenario = scenarios[i];
        describe('scenario: ' + scenario.title, function() {
            before((done) => {
                storage.clear()
                .then(() => {
                    done();
                })
                .catch(done);
            });
            for (let j = 0; j < scenario.steps.length; j++) {
                const step = scenario.steps[j];
                it('step: ' + step.title, (done) => {
                    let failed;
                    const ar = [];
                    for (let p = 0; p < storageAPI[step.method].length; p++) {
                        ar.push(step.params[storageAPI[step.method][p]]);
                    }

                    storage[step.method](...ar)
                    .then((res) => {
                        if (step.result.value != null) {
                            assert.equal(res, step.result.value , 'other value expected');
                        }
                        if (step.result.length != null) {
                            assert.equal(res.length, step.result.length, 'num of results');
                        }
                        if (step.result.checkArray != null) {
                            for (const k in step.result.checkArray) {
                                for (const key in step.result.checkArray[k]) {
                                    assert.deepEqual(res[k][key], step.result.checkArray[k][key]);
                                }
                            }
                        }
                    })
                    .catch((e) => {
                        failed = true;
                        if (!step.result.error) {
                            throw e;
                        }
                    })
                    .then(() => {
                        if (step.result.error && !failed) {
                            throw new Error('should have failed');
                        }
                        done();
                    })
                    .catch(done);
                });
            }
        });
    }
});
