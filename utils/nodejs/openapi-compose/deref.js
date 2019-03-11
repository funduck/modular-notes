'use strict';

/*
    This module resolves references in object: local $ref: '#...' and external ref$: '...'
*/

/**
    Walks all object and resolves all external '$ref' recursively
    @param {object} object - object bundling
    @param {function} loadRef - callback to load reference
*/
function _recursiveBundle(object, loadRef, refStack) {
    if (typeof object != 'object') return object;
    refStack = refStack || [];
    for (const attr in object) {
        if (typeof object[attr] == 'object' && object[attr] != null) {
            if (object[attr].$ref &&
                object[attr].$ref[0] != '#' // not local ref
            ) {
                // for drilldown walk we must keep refs in stack
                refStack.push(object[attr].$ref);
                object[attr] = loadRef(refStack);
                _recursiveBundle(object[attr], loadRef, refStack);
                refStack.pop();
            } else {
                _recursiveBundle(object[attr], loadRef, refStack);
            }
        }
    }
    return object;
}

/**
    Walks all object and resolves all local '$ref' recursively
    @param {object} root - start point
    @param {object} object - currently walking point
*/
function _recursiveDeref(root, object) {
    if (typeof object != 'object') return object;
    for (const attr in object) {
        if (typeof object[attr] == 'object') {
            if (object[attr].$ref &&
                object[attr].$ref[0] == '#' // local refs
            ) {
                const way = object[attr].$ref.split(/\//);
                let tmp = root;
                for (let i = 1; i < way.length; i++) {
                    if (tmp[way[i]] == null) {
                        throw new Error('bad reference: ' + object[attr].$ref);
                    }
                    tmp = tmp[way[i]];
                }
                object[attr] = tmp;
            } else {
                _recursiveDeref(root, object[attr]);
            }
        }
    }
    return root;
}

module.exports = {
    bundle: function (object, loadRef) {
        return _recursiveBundle(object, loadRef);
    },
    dereference: function (object) {
        return _recursiveDeref(object, object);
    }
};
