module.exports = {
    title: 'create node with relation',
    steps: [{
        title: 'create user`',
        method: 'editNode',
        params: {
            userId: 'Joe',
            id: 'Joe',
            type: 'user',
            operation: parseInt('111110', 2),
            title: 'Joe',
            content: new Buffer('Joe Andrew Smith'),
            flags: 2,
            meta: JSON.stringify({}),
            relationsAdd: [],
            relationsRm: [],
        },
        result: {
            error: false
        }
    }, {
        title: 'create relation first',
        method: 'editNode',
        params: {
            id: 'firstTagId',
            userId: 'Joe',
            type: 'tag prototype',
            operation: parseInt('111110', 2),
            title: 'tag title',
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
        title: 'get relation',
        method: 'getNodes',
        params: {
            userId: 'Joe',
            ids: ['firstTagId']
        },
        result: {
            length: 1,
            checkArray: {
                0: {
                    id: 'firstTagId',
                    author: 'Joe',
                    type: 'tag prototype',
                    title: 'tag title',
                    content: new Buffer('First tag!'),
                    flags: 2,
                    meta: JSON.stringify({}),
                    relations: []
                }
            }
        }
    }, {
        title: 'create node with relation',
        method: 'editNode',
        params: {
            id: 'nodeWithRel',
            userId: 'Joe',
            type: 'note',
            operation: parseInt('111110', 2),
            title: 'node with relation',
            content: new Buffer('ok'),
            flags: 2,
            meta: JSON.stringify({}),
            relationsAdd: ['firstTagId', 'tag prototype text', null],
            relationsRm: [],
        },
        result: {
            error: false,
        }
    }, {
        title: 'get node',
        method: 'getNodes',
        params: {
            userId: 'Joe',
            ids: ['nodeWithRel']
        },
        result: {
            length: 1,
            checkArray: {
                0: {
                    id: 'nodeWithRel',
                    author: 'Joe',
                    type: 'note',
                    title: 'node with relation',
                    content: new Buffer('ok'),
                    flags: 2,
                    meta: JSON.stringify({}),
                    relations: ['tag prototype', 'firstTagId', 'tag prototype text', null]
                }
            }
        }
    }, {
        title: 'remove tag',
        method: 'editNode',
        params: {
            id: 'nodeWithRel',
            userId: 'Joe',
            type: null,
            operation: parseInt('100000', 2),
            title: null,
            content: null,
            flags: null,
            meta: null,
            relationsAdd: [],
            relationsRm: ['firstTagId'],
        },
        result: {
            error: false,
        }
    }, {
        title: 'get node without tag',
        method: 'getNodes',
        params: {
            userId: 'Joe',
            ids: ['nodeWithRel']
        },
        result: {
            length: 1,
            checkArray: {
                0: {
                    id: 'nodeWithRel',
                    author: 'Joe',
                    type: 'note',
                    title: 'node with relation',
                    content: new Buffer('ok'),
                    flags: 2,
                    meta: JSON.stringify({}),
                    relations: []
                }
            }
        }
    }, {
        title: 'add tag back',
        method: 'editNode',
        params: {
            id: 'nodeWithRel',
            userId: 'Joe',
            operation: parseInt('100000', 2),
            relationsAdd: ['firstTagId', 'first tag back', null],
        },
        result: {
            error: false,
        }
    }, {
        title: 'get node with tag',
        method: 'getNodes',
        params: {
            userId: 'Joe',
            ids: ['nodeWithRel']
        },
        result: {
            length: 1,
            checkArray: {
                0: {
                    id: 'nodeWithRel',
                    author: 'Joe',
                    type: 'note',
                    title: 'node with relation',
                    content: new Buffer('ok'),
                    flags: 2,
                    meta: JSON.stringify({}),
                    relations: ['tag prototype', 'firstTagId', 'first tag back', null]
                }
            }
        }
    }]
};
