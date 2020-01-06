'use strict';

/*
    This module can
    * load - load JSON or YAML OpenAPI document
    * compile - eliminate $refs to other files and apply custom operators like '$inherits'
    * toJSON/toYAML - convert to JSON or YAML
    * description - convert to object describing API that can be used in sources of service. It will be smaller and more simple.

    Also module has command line interface
*/

const jybid = require('jybid');
const yaml = require('js-yaml');
const path = require('path');

const toYAML = function (doc) {
    return yaml.safeDump(doc, {
        lineWidth: 120,
        noRefs: true
    });
};

const toJSON = function (doc) {
    return JSON.stringify(doc, null, '  ');
};

/**
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
    @param {object} openapi
    @return {object}
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
//console.error('texts:', texts[i])
                        const reason = texts[i].match(/^([\w ]+):?/)[1];
                        res[method].errors[descr+':'+reason] = {
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
    const filepath = process.argv[3] ? path.resolve(__dirname, process.argv[3]) : null;

    switch (command) {
        case 'compile':
        case 'compile-json':
        case 'compile-yaml':
        case 'to-json':
        case 'to-yaml':
        case 'description': break;
        case '-h':
        case '--help': {
            console.log('Usage: node index.js COMMAND FILE');
            console.log('Commands: compile, compile-yaml, compile-json, description, to-json, to-yaml');
            return;
            break;
        }
    }

    jybid.dereference(filepath, {inherit: true})
    .then((doc) => {
        let res;
        switch (command) {
            case 'description': {
                res = description(doc);
                break;
            }
        }
        if (command.match(/-yaml/) != null) {
            console.log(toYAML(res));
        } else {
            console.log(toJSON(res));
        }
    })
    .catch((e) => {
        console.error(e.stack);
    });
}
