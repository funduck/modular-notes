'use strict';

const when = require('when');
const assert = require('assert');
const description = require('../../description');

// require('../../../utils/nodejs/console_logger').get('storage').setLevel('debug');
const logger = require('../../../utils/nodejs/console_logger').get('tester');

const FormData = require('form-data');
const http = require('http');
const Busboy = require('busboy');

const fs = require('fs');
const dataFiles = fs.readdirSync(__dirname + '/../../test/scenarios');
const scenarios = [];
for (const i in dataFiles) {
    scenarios.push(require('../../test/scenarios/' + dataFiles[i]));
}
const main = require('../index');
const PORT = 8001;

describe('Storage main test', function() {
    before(() => {
        main.start({
            port: PORT,
            storage: {file: {}}
        }, {
            storage: 'file'
        });
    });

    after((done) => {
        main.storage.clear()
        .then(() => {
            main.server.close(() => {
                done();
            });
        })
        .catch(done);
    });

    for (let i = 0; i < scenarios.length; i++) {
        const scenario = scenarios[i];
        describe('scenario: ' + scenario.title, function() {
            before((done) => {
                main.storage.clear()
                .then(() => {
                    done();
                })
                .catch(done);
            });
            for (let j = 0; j < scenario.steps.length; j++) {
                const step = scenario.steps[j];
                it('step: ' + step.title, (done) => {
                    const descr = description[step.method];
                    let failed;
                    let path = descr.path;
                    let query = '?';
                    const body = {};
                    const argsNames = descr.arguments;
                    for (let p = 0; p < argsNames.length; p++) {
                        if (argsNames[p].in == 'path') {
                            path += encodeURIComponent(step.params[argsNames[p].name]);
                        }
                        if (argsNames[p].in == 'query' && step.params[argsNames[p].name] != undefined) {
                            query += `${argsNames[p].name}=${encodeURIComponent(step.params[argsNames[p].name])}&`;
                        }
                        if (argsNames[p].in == 'body' && step.params[argsNames[p].name] != null) {
                            body[argsNames[p].name] = step.params[argsNames[p].name];
                        }
                    }

                    logger.verbose(descr.method, path+query);
                    const defer = when.defer();
                    const req = http.request({
                        method: descr.method,
                        host: '127.0.0.1',
                        port: PORT,
                        path: path + query
                    }, (res) => {
                        defer.resolve(res);
                    });
                    req.on('error', (e) => {
                        defer.reject(e);
                    });
                    if (Object.keys(body).length > 0) {
                        logger.verbose(JSON.stringify(body));
                        const form = new FormData();
                        for (const key in body) {
                            form.append(key, body[key]);
                        }
                        req.setHeader('content-type', 'multipart/form-data; boundary='+form._boundary);
                        form.pipe(req);
                    } else {
                        req.setHeader('content-type', 'text/plain');
                        req.end();
                    }
                    defer.promise
                    .then((res) => {
                        const result = {
                            code: res.statusCode,
                            body: null
                        };
                        const defer = when.defer();
                        res.setEncoding('utf8');
                        if (res.headers['content-type'].match(/multipart\/form-data/)) {
                            const busboy = new Busboy({ headers: res.headers });
                            result.body = [];
                            let tmp = {};
                            busboy.on('field', function (field, val, fieldTruncated, valTruncated, encoding, mimetype) {
                                if (tmp[field] == undefined) {
                                    tmp[field] = val;
                                } else {
                                    result.body.push(tmp);
                                    tmp = {};
                                }
                            });
                            busboy.on('finish', function() {
                                if (Object.keys(tmp).length > 0) result.body.push(tmp);
                                defer.resolve(result);
                            });
                            res.pipe(busboy);
                        } else {
                            result.body = '';
                            res.on('data', (chunk) => {
                                result.body += chunk;
                            });
                            res.on('end', function () {
                                defer.resolve(result);
                            });
                        }
                        return defer.promise;
                    })
                    .then((res) => {
                        logger.debug('result:', JSON.stringify(res));
                        // better check code than 'error'
                        if (res.code != 200) {
                            throw new Error('not 200');
                        }
                        if (step.result.value != null) {
                            assert.equal(res.body, step.result.value);
                        }
                        if (step.result.length != null) {
                            assert.equal(res.body.length, step.result.length);
                        }
                        if (step.result.checkArray != null) {
                            for (const k in step.result.checkArray) {
                                for (const key in step.result.checkArray[k]) {
                                    assert.deepEqual(res.body[k][key], step.result.checkArray[k][key]);
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
