module.exports = {
    title: 'check editNode parameter "operation"',
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
        title: 'insert node',
        method: 'editNode',
        params: {
            userId: 'Joe',
            id: 'testNodeId',
            type: 'note',
            operation: parseInt('111110', 2),
            title: 'test node',
            content: new Buffer('hello world'),
            flags: 2,
            meta: JSON.stringify({}),
            relationsAdd: [],
            relationsRm: [],
        },
        result: {
            error: false
        }
    }, {
        title: 'insert tag node',
        method: 'editNode',
        params: {
            userId: 'Joe',
            id: 'someTagId',
            type: 'note',
            operation: parseInt('111110', 2),
            title: 'some tag',
            content: new Buffer(''),
            flags: 2,
            meta: JSON.stringify({}),
            relationsAdd: [],
            relationsRm: [],
        },
        result: {
            error: false
        }
    }, {
        title: 'insert image node',
        method: 'editNode',
        params: {
            userId: 'Joe',
            id: 'someImageId',
            type: 'note',
            operation: parseInt('111110', 2),
            title: 'some image',
            content: new Buffer(''),
            flags: 2,
            meta: JSON.stringify({}),
            relationsAdd: [],
            relationsRm: [],
        },
        result: {
            error: false
        }
    }, {
        title: 'should change only title',
        method: 'editNode',
        params: {
            userId: 'Joe',
            id: 'testNodeId',
            type: null,
            operation: parseInt('000010', 2),
            title: 'changed title',
            content: new Buffer('changed content'),
            flags: 0,
            meta: JSON.stringify({changed: true}),
            relationsAdd: ['someTagId', 'some tag', 42],
            relationsRm: ['someImageId'],
        },
        result: {
            error: false
        }
    }, {
        title: 'check only title changed',
        method: 'getNodes',
        params: {
            userId: 'Joe',
            ids: ['testNodeId']
        },
        result: {
            length: 1,
            checkArray: {
                0: {
                    id: 'testNodeId',
                    author: 'Joe',
                    type: 'note',
                    title: 'changed title',
                    content: new Buffer('hello world'),
                    flags: 2,
                    meta: JSON.stringify({}),
                    relations: []
                }
            }
        }
    }, {
        title: 'should change only content',
        method: 'editNode',
        params: {
            userId: 'Joe',
            id: 'testNodeId',
            type: null,
            operation: parseInt('000100', 2),
            title: 'changed title 2',
            content: new Buffer('changed content'),
            flags: 0,
            meta: JSON.stringify({changed: true}),
            relationsAdd: ['someTagId', 'some tag', 42],
            relationsRm: ['someImageId'],
        },
        result: {
            error: false
        }
    }, {
        title: 'check only content changed',
        method: 'getNodes',
        params: {
            userId: 'Joe',
            ids: ['testNodeId']
        },
        result: {
            length: 1,
            checkArray: {
                0: {
                    id: 'testNodeId',
                    author: 'Joe',
                    type: 'note',
                    title: 'changed title',
                    content: new Buffer('changed content'),
                    flags: 2,
                    meta: JSON.stringify({}),
                    relations: []
                }
            }
        }
    }, {
        title: 'should change only flags',
        method: 'editNode',
        params: {
            userId: 'Joe',
            id: 'testNodeId',
            type: null,
            operation: parseInt('001000', 2),
            title: 'changed title 2',
            content: new Buffer('changed content 2'),
            flags: 0,
            meta: JSON.stringify({changed: true}),
            relationsAdd: ['someTagId', 'some tag', 42],
            relationsRm: ['someImageId'],
        },
        result: {
            error: false
        }
    }, {
        title: 'check only flags changed',
        method: 'getNodes',
        params: {
            userId: 'Joe',
            ids: ['testNodeId']
        },
        result: {
            length: 1,
            checkArray: {
                0: {
                    id: 'testNodeId',
                    author: 'Joe',
                    type: 'note',
                    title: 'changed title',
                    content: new Buffer('changed content'),
                    flags: 0,
                    meta: JSON.stringify({}),
                    relations: []
                }
            }
        }
    }, {
        title: 'should change only meta',
        method: 'editNode',
        params: {
            userId: 'Joe',
            id: 'testNodeId',
            type: null,
            operation: parseInt('010000', 2),
            title: 'changed title 2',
            content: new Buffer('changed content 2'),
            flags: 2,
            meta: JSON.stringify({changed: true}),
            relationsAdd: ['someTagId', 'some tag', 42],
            relationsRm: ['someImageId'],
        },
        result: {
            error: false
        }
    }, {
        title: 'check only meta changed',
        method: 'getNodes',
        params: {
            userId: 'Joe',
            ids: ['testNodeId']
        },
        result: {
            length: 1,
            checkArray: {
                0: {
                    id: 'testNodeId',
                    author: 'Joe',
                    type: 'note',
                    title: 'changed title',
                    content: new Buffer('changed content'),
                    flags: 0,
                    meta: JSON.stringify({changed: true}),
                    relations: []
                }
            }
        }
    }, {
        title: 'should change only relations',
        method: 'editNode',
        params: {
            userId: 'Joe',
            id: 'testNodeId',
            type: null,
            operation: parseInt('100000', 2),
            title: 'changed title 2',
            content: new Buffer('changed content 2'),
            flags: 2,
            meta: JSON.stringify({changed2: true}),
            relationsAdd: ['someTagId', 'some tag', 42],
            relationsRm: ['someImageId'],
        },
        result: {
            error: false
        }
    }, {
        title: 'check only relations changed',
        method: 'getNodes',
        params: {
            userId: 'Joe',
            ids: ['testNodeId']
        },
        result: {
            length: 1,
            checkArray: {
                0: {
                    id: 'testNodeId',
                    author: 'Joe',
                    type: 'note',
                    title: 'changed title',
                    content: new Buffer('changed content'),
                    flags: 0,
                    meta: JSON.stringify({changed: true}),
                    relations: ['note', 'someTagId', 'some tag', 42]
                }
            }
        }
    }, {
        title: 'delete node',
        method: 'editNode',
        params: {
            userId: 'Joe',
            id: 'testNodeId',
            operation: parseInt('000001', 2)
        },
        result: {
            error: false
        }
    }, {
        title: 'check node is deleted',
        method: 'getNodes',
        params: {
            userId: 'Joe',
            ids: ['testNodeId']
        },
        result: {
            length: 0
        }
    }]
};
