'use strict';

const assert = require('assert')
const fs = require('fs')
const main = require('../index')

const tmpDir = '/tmp';

const paramName = {
    name: 'name',
    in: 'query',
    required: true,
    schema: {
        type: 'string'
    }
};
const paramId = {
    name: 'id',
    in: 'query',
    required: true,
    schema: {
        type: 'string'
    }
};
const api1 = {
    paths: {
        '/dog': {
            get: {
                parameters: [{
                    $ref: './param-name.json'
                }]
            }
        },
        '/cat': {
            get: {
                parameters: [{
                    $ref: './param-name.json'
                }]
            }
        }
    }
};
const api2 = {
    $inherits: {
        $ref: './api1.json',
        paths: {
            '/cat': false
        }
    },
    paths: {
        '/dog': {
            get: {
                parameters: [{
                    $ref: './param-id.json'
                }]
            },
            post: {
                parameters: [{
                    $ref: './param-name.json'
                }]
            }
        },
        '/bee': {
            get: {
                parameters: [{
                    $ref: './param-name.json'
                }]
            }
        }
    }
};
const api3 = {
    $inherits: {
        $ref: './api2.json'
    }
}

describe('OpenAPI Compose', function() {
    before(() => {
        fs.writeFileSync(tmpDir + '/param-name.json', main.toJSON(paramName), {encoding: 'utf8'});
        fs.writeFileSync(tmpDir + '/param-id.json', main.toJSON(paramId), {encoding: 'utf8'});
        fs.writeFileSync(tmpDir + '/api1.json', main.toJSON(api1), {encoding: 'utf8'});
        fs.writeFileSync(tmpDir + '/api1.yaml', main.toYAML(api1), {encoding: 'utf8'});
        fs.writeFileSync(tmpDir + '/api2.json', main.toJSON(api2), {encoding: 'utf8'});
    });
    after(() => {
        fs.unlinkSync(tmpDir + '/param-name.json');
        fs.unlinkSync(tmpDir + '/param-id.json');
        fs.unlinkSync(tmpDir + '/api1.json');
        fs.unlinkSync(tmpDir + '/api1.yaml');
        fs.unlinkSync(tmpDir + '/api2.json');
    });

    it('load json and yaml', () => {
        assert.deepEqual(main.load(tmpDir + '/api1.json'), main.load(tmpDir + '/api1.yaml'));
    });

    it('compile with "$inherits"', () => {
        let res = main.compile(api2, tmpDir + '/api2.json');
        //console.log(main.toJSON(res))
        assert.deepEqual(res, {
            paths: {
                '/dog': {
                    get: {
                        parameters: [paramId]
                    },
                    post: {
                        parameters: [paramName]
                    }
                },
                '/bee': {
                    get: {
                        parameters: [paramName]
                    }
                }
            }
        });
    });

    it('compile with double "$inherits"', () => {
        let res = main.compile(api3, tmpDir + '/api3.json');
        //console.log(main.toJSON(res))
        assert.deepEqual(res, {
            paths: {
                '/dog': {
                    get: {
                        parameters: [paramId]
                    },
                    post: {
                        parameters: [paramName]
                    }
                },
                '/bee': {
                    get: {
                        parameters: [paramName]
                    }
                }
            }
        });
    });
})