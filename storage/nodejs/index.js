'use strict';

const when = require('when');
const Busboy = require('busboy');

let mainConfig = {};
const logger = require('../../utils/nodejs/console_logger').get('storage');
const Messages = require('../../utils/nodejs/messages');
const Message = Messages.Message;
const description = require('../description');

module.exports = {
    start: null,
    server: null,
    storage: null
};

const start = function (config, options) {
    config = Object.assign({}, mainConfig, config);
    options = Object.assign({storage: 'file'}, options);
    const storage = require('./storage_' + options.storage)(config.storage[options.storage]);
    module.exports.storage = storage;

    const FormData = require('form-data');
    const express = require('express');
    const bodyParser = require('body-parser');
    const app = express();

    app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
    
    const port = config.port;

    const callback = function (method) {
        const methodParams = description[method].arguments;
        return (req, res) => {
            const msg = new Message('where', 'server', 'what', req.method);
            logger.info(msg);
            logger.verbose(msg.clone('query', req.query));
            logger.debug(msg.clone('headers', req.headers));
            when().then(() => {
                if (req.headers['content-type'] && 
                    req.headers['content-type'].match(/multipart\/form-data/)
                ) {
                    const defer = when.defer();
                    const busboy = new Busboy({ headers: req.headers });
                    busboy.on('field', function (field, val, fieldTruncated, valTruncated, encoding, mimetype) {
                        req.body[field] = val;
                    });
                    busboy.on('finish', function() {
                        logger.debug(msg.clone('body', req.body));
                        defer.resolve();
                    });
                    req.pipe(busboy);
                    return defer.promise;
                }
            })
            .then(() => {
                const params = Object.assign({}, req.params, req.query, req.body);
                const ar = [];
                for (let p = 0; p < methodParams.length; p++) {
                    ar.push(params[methodParams[p].name] == undefined ? null : params[methodParams[p].name]);
                }
                logger.debug(msg.clone('what', 'call storage', 'args', ar));
                return storage[method](...ar);
            })
            .then((result) => {
                let isMultipart = false;
                let form;
                const startMultipart = () => {
                    if (!isMultipart) {
                        form = new FormData();
                        isMultipart = true;
                    }
                };
                const toBody = (_result) => {
                    startMultipart();
                    if (Array.isArray(_result)) {
                        for (let i = 0; i < _result.length; i++) {
                            form.append('rownum', i);
                            toBody(_result[i]);
                        }
                        return;
                    }
                    let key;
                    let val;
                    if (typeof _result == 'object') {
                        for ([key, val] of Object.entries(_result)) {
                            form.append(key, val);
                        }
                    } else {
                        form.append('result', _result);
                    }
                };
                res.status(200);
                logger.info(msg.clone('code', 200));
                logger.debug(msg.clone('result', result));
                if (typeof result == 'object') {
                    toBody(result);
                } else {
                    res.set('Content-Type', 'text/plain; charset=utf-8');
                    res.write(typeof result != 'string' ? JSON.stringify(result) : result);
                }
                if (isMultipart) {
                    res.set('Content-Type', 'multipart/form-data; charset=utf-8; boundary=' + form._boundary);
                    form.pipe(res);
                } else {
                    res.end();
                }
                logger.debug(msg.clone('headers', res.getHeaders()));
            })
            .catch((e) => {
                const error = description[method].errors[e.message];
                if (error) {
                    res.status(error.code).send(error.text);
                } else {
                    logger.error(e.stack);
                    res.status(500).send('unexpected error: ' + e.mesage);
                }
            });
        }
    };
    app.get('/nodes', callback('getNodes'));
    app.get('/access', callback('getAccess'));
    app.post('/node/:id', callback('editNode'));
    app.post('/access', callback('editAccess'));
    
    app.delete('/nodes', (req, res) => {
        if (!config.test) {
            return res.status(403).send('forbidden');
        }
        module.exports.storage.clear()
        .then((num) => {
            res.status(200).send(String(num));
        })
        .catch((e) => {
            logger.error(e.stack);
            res.status(500).send('unexpected error: ' + e.mesage);
        }); 
    });

    module.exports.server = app.listen(port, () => {
        logger.info(new Message('where', 'server', 'what', 'listening', 'port', port));
    });

    process.once('SIGINT', () => {
        logger.info(new Message('where', 'server', 'what', 'unref'));
        module.exports.server.unref();
        logger.info(new Message('where', 'server', 'what', 'close'));
        module.exports.server.close();
    });
};

module.exports.start = start;

if (process.argv[1] == __filename) {
    mainConfig = require('../config');
    let i = 2;
    while (i < process.argv.length) {
        switch (process.argv[i]) {
            case '--test': {
                mainConfig = require('../test/config');
            }
        }
        i++;
    }
    start();
}
