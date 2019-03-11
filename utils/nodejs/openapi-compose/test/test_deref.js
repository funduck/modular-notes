'use strict';

const assert = require('assert')
const deref = require('../deref');

describe('Deref', function() {
    it('bundle', () => {
        const a = {
            a: 1,
            b: {
                $ref: '#/component/b'
            },
            c: {
                $ref: 'external/c'
            },
            component: {
                b: 2
            }
        };
        const res = deref.bundle(a, (paths) => {
            if (paths[0] == 'external/c') {
                return 3;
            }
            return 4;
        });

        assert.deepEqual(res, {
            a:1,
            b:{
                $ref: '#/component/b'
            },
            c:3,
            component: {
                b: 2
            }
        });
    });

    it('dereference', () => {
        const a = {
            a: 1,
            b: {
                $ref: '#/component/b'
            },
            c: {
                $ref: 'external/c'
            },
            component: {
                b: 2
            }
        };
        const res = deref.dereference(a);

        assert.deepEqual(res, {
            a: 1,
            b: 2,
            c: {
                $ref: 'external/c'
            },
            component: {
                b: 2
            }
        });
    });

    it('bundle + dereference', () => {
        const a = {
            a: 1,
            b: {
                $ref: '#/component/b'
            },
            c: {
                $ref: 'external/c'
            },
            component: {
                b: 2
            }
        };
        const res = deref.dereference(deref.bundle(a, (paths) => {
            if (paths[0] == 'external/c') {
                return 3;
            }
            return 4;
        }));

        assert.deepEqual(res, {
            a: 1,
            b: 2,
            c: 3,
            component: {
                b: 2
            }
        });
    });
})