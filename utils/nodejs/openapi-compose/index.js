'use strict';

/*
    This module can
    * load - load JSON or YAML OpenAPI document
    * compile - eliminate $refs to other files and apply custom operators like '$inherits'
    * toJSON/toYAML - convert to JSON or YAML
    * description - convert to object describing API that can be used in sources of service. It will be smaller and more simple.

    Also module has command line interface
*/

const yaml = require('js-yaml');
const lodash = require('lodash');
const fs = require('fs');
const path = require('path');
const deref = require('./deref');

const _loadYaml = function (filepath, options) {
    return yaml.safeLoad(fs.readFileSync(filepath, {encoding: (options ? options.encoding : null) || 'utf8'}));
};

/**
    @param {string} filepath
    @param {object} options
    @param {string} options.encoding
    @return {object}
    @throws
*/
const load = function (filepath, options) {
    let doc;
    let ext = filepath.match(/\.([a-z0-9]+)$/);
    if (ext) ext = ext[1];
    switch (ext) {
        case 'js':
        case 'json':
            doc = require(filepath);
            break;
        case 'yml':
        case 'yaml':
            doc = _loadYaml(filepath, options);
            break;
        default: {
            try {
                doc = require(filepath);
            } catch (e) {
                try {
                    doc = _loadYaml(filepath + '.yaml', options);
                } catch (e) {
                    doc = _loadYaml(filepath + '.yml', options);
                }
            }
        }
    }
    if (!doc) {
        throw new Error('failed to load file: ' + filepath);
    }
    return doc;
};

const toYAML = function (doc) {
    return yaml.safeDump(doc, {
        lineWidth: 120,
        noRefs: true
    });
};

const toJSON = function (doc) {
    return JSON.stringify(doc, null, '  ');
};

const inherit = function (parent, child, limitations) {
    for (const key in parent) {
        if (key == '$ref') continue;
        if (limitations && limitations[key] == false) continue;
        if (limitations && typeof limitations[key] == 'object') {
            inherit(parent[key], child[key], limitations[key]);
        } else {
            if (parent[key] != null && child[key] != null) {
                if (typeof parent[key] == 'object' && typeof child[key] == 'object') {
                    child[key] = lodash.merge(lodash.clone(parent[key]), child[key]);
                }
            } else {
                child[key] = child[key] || parent[key];
            }
        }
    }
    return child;
};

/**
    Bundles
    Applies custom operators to openapi doc
    Returns standart OpenAPI
    @param {object} openapi - document
    @param {string} filepath - to be able to resolve $refs
    @return {object}
*/
const compile = function (openapi, filepath) {
    const inherits = Object.assign({}, openapi.$inherits);
    if (inherits.$ref) {
        inherits.$ref = path.normalize(path.dirname(filepath) + '/' + inherits.$ref);
        openapi.$inherits = compile(load(inherits.$ref), inherits.$ref);
        delete inherits.$ref;
    }
    deref.bundle(openapi, (refs) => {
        const p = [path.dirname(filepath)];
        for (let i = 0; i < refs.length - 1; i++) {
            p.push(path.dirname(refs[i]));
        }
        p.push(refs[refs.length - 1]);
        return load(path.resolve(...p));
    });
    /*
        '$inherits' must have a $ref to super object.
        Other members must be booleans or object with booleans (i.e. we can manage inheritance on root, 1st and 2nd levels)
        To omit property from super object corresponding property in 'inherits' must be set to false
        For example, to make from {a: 1, b: {c: 2, d: 3}, e:4} just {a:1, b:{c:2}} we need
            {inherits: {$ref:'ref to "a"', b: {d: false}, e: false}}
        To override other properties used lodash.merge
    */
    if (openapi.$inherits) {
        inherit(openapi.$inherits, openapi, inherits);
        delete openapi.$inherits;
    }
    return openapi;
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
    const filepath = process.argv[3] ? path.resolve(__dirname, process.argv[3]) : null;
    let doc = filepath ? load(filepath) : null;
    let res;
    switch (command) {
        case 'to-json':
        case 'to-yaml': {
            res = doc;
            break;
        }
        case 'compile-yaml':
        case 'compile-json':
        case 'compile': {
            res = compile(doc, filepath);
            break;
        }
        case 'description': {
            res = description(compile(doc, filepath));
            break;
        }
        case '-h':
        case '--help':
        default: {
            console.log('Usage: node index.js COMMAND FILE');
            console.log('Commands: compile, compile-yaml, compile-json, description, to-json, to-yaml');
            return;
            break;
        }
    }
    if (command.match(/-yaml/) != null) {
        console.log(toYAML(res));
    } else {
        console.log(toJSON(res));
    }
}

module.exports = {
    load: load,
    compile: compile,
    description: description,
    toYAML: toYAML,
    toJSON: toJSON
}
