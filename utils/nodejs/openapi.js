'use strict';

/*
    This module applies custom operators to OpenAPI document and returns valid standart
*/

const yaml = require('js-yaml');
const fs = require('fs');
const lodash = require('lodash');

const loadYaml = function (filename) {
    return yaml.safeLoad(fs.readFileSync(filename, 'utf8'));
};

const toYaml = function (doc) {
    return yaml.safeDump(doc, {
        lineWidth: 120,
        noRefs: true
    });
};

/*
    Applies custom 'rules' to openapi doc
    Returns standart OpenAPI
*/
const compile = function (openapi, filepath) {
    if (openapi.inherits) {
        if (openapi.inherits.$ref) {
            let ref;
            filepath = require('path').dirname(filepath) + '/' + openapi.inherits.$ref;
            try {
                ref = require(filepath);
            } catch (e) {    
                ref = loadYaml(filepath);
            }
            if (!ref) {
                throw new Error('failed to load $ref: ' + openapi.inherits.$ref);
            }
            for (const key in openapi.inherits) {
                if (key == '$ref') continue;
                if (openapi.inherits[key] == true) {
                    openapi[key] = lodash.merge(ref[key], openapi[key]);
                } else {
                    openapi[key] = openapi[key] || {};
                    for (const k in openapi.inherits[key]) {
                        openapi[key][k] = lodash.merge(ref[key][k], openapi[key][k]);
                    }
                }
            }
        }
        delete openapi.inherits;
    }
    return openapi;
};

/*
    Following procedure builds a 'description' from OpenAPI document.

    We describe API in OpenAPI document and that is good format to share with others.
    But we want more and there are some rules must be applied to OpenAPI doc:
    * We describe arguments of a function handling a request:
        1 query parameters are first and their order in call is the same as in OpenAPI doc.
        2 parameters in body MUST have 'description' starting with number to provide order of all arguments for a function.
            They always follow query parameters.
            Examples:
              description: 1 blah blah
              description: "2"
    * We connect errors in sources and http responses:
        3 error description and prefix of error text are used in sources as error unique identifier
            Example:
                404:
                  description: not found
                  content:
                    text/plain:
                      schema:
                        type: string
                        enum:
                          - 'dog: not found or not exists'
                          - 'cat: not found or not exists'
              error identifiers will be 'not found:dog' and 'not found:cat'
    * We need constants to be used in sources and understood by users, so there is a 'x-method-constants' in OpenAPI doc.

    'Description' is a document to be used in sources, looks like this:
    {
        method1: {
            path: '/method1',
            method: 'post',
            arguments: ['arg1', 'arg2', ...], // array of method1 arguments names
            constants: { // constants used in method1
                operations: ...,
                ...
            },
            errors: { // errors thrown in method1
                'access denied:read': {
                    text: 'read: user has no right to read node',
                    code: 422
                },
                'access denied:write',
                ...
            }
        }
    }
*/
const description = function (openapi) {
    const res = {};
    for (const p in openapi.paths) {
        for (const m in openapi.paths[p]) {
            const operation = openapi.paths[p][m];
            const method = operation.operationId;
            res[method] = {
                path: p.match(/^([^:{]*)/)[1],
                method: m,
                arguments: [],
                constants: {},
                errors: {}
            };
            if (operation.parameters) {
                for (let i = 0; i < operation.parameters.length; i++) {
                    res[method].arguments.push({in:operation.parameters[i].in, name: operation.parameters[i].name});
                }
            }
            if (operation.requestBody &&
                operation.requestBody.content['multipart/form-data'] &&
                operation.requestBody.content['multipart/form-data'].schema.properties
            ) {
                const bodyArgs = Object.entries(
                    operation.requestBody.content['multipart/form-data'].schema.properties
                ).sort((a,b) => {
                    return parseInt(a[1].description.match(/^(\d+)/)[1], 10) -
                        parseInt(b[1].description.match(/^(\d+)/)[1], 10);
                });
                for (let i = 0; i < bodyArgs.length; i++) {
                    res[method].arguments.push({in:'body', name: bodyArgs[i][0]});
                }
            }
            for (const code in operation.responses) {
                if (operation.responses[code].description &&
                    operation.responses[code].content['text/plain'] &&
                    operation.responses[code].content['text/plain'].schema.enum
                ) {
                    const texts = operation.responses[code].content['text/plain'].schema.enum;
                    const descr = operation.responses[code].description;
                    for (let i = 0; i < texts.length; i++) {
//                        console.log(texts[i])
                        res[method].errors[descr+':'+texts[i].match(/^([\w ]+):/)[1]] = {
                            text: texts[i],
                            code: code
                        }
                    }
                }
            }
        }
    }
    for (const m in openapi['x-method-constants']) {
        res[m].constants = openapi['x-method-constants'][m];
    }
    return res;
};

if (process.argv[1] == module.filename) {
    const command  = process.argv[2];
    const filepath = process.argv[3];
    let _openapi;
    let yaml = command.match(/-yaml/) != null;
    try {
        _openapi = require(filepath);
    } catch (e) {    
        _openapi = loadYaml(filepath);
    }
    if (!_openapi) {
        throw new Error('failed to load api: ' + name);
    }
    let res;
    switch (command) {
        case 'compile-yaml':
        case 'compile-json':
        case 'compile': {
            res = compile(_openapi, filepath);
            break;
        }
        case 'description': {
            res = description(_openapi);
            break;
        }
    }
    if (yaml) {
        console.log(toYaml(res));    
    } else {
        console.log(JSON.stringify(res, null, '  '));    
    }
}