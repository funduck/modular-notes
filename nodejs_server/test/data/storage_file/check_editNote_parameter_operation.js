module.exports = {
    title: 'check editNote parameter "operation"',
    steps: [{
        title: 'create user`',
        method: 'editNote',
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
        title: 'insert note',
        method: 'editNote',
        params: {
            userId: 'Joe',
            id: 'testNoteId',
            type: 'note',
            operation: parseInt('111110', 2),
            title: 'test note',
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
        title: 'insert tag note',
        method: 'editNote',
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
        title: 'insert image note',
        method: 'editNote',
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
        method: 'editNote',
        params: {
            userId: 'Joe',
            id: 'testNoteId',
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
        method: 'getNotes',
        params: {
            userId: 'Joe',
            ids: ['testNoteId']
        },
        result: {
            length: 1,
            checkArray: {
                0: {
                    id: 'testNoteId',
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
        method: 'editNote',
        params: {
            userId: 'Joe',
            id: 'testNoteId',
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
        method: 'getNotes',
        params: {
            userId: 'Joe',
            ids: ['testNoteId']
        },
        result: {
            length: 1,
            checkArray: {
                0: {
                    id: 'testNoteId',
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
        method: 'editNote',
        params: {
            userId: 'Joe',
            id: 'testNoteId',
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
        method: 'getNotes',
        params: {
            userId: 'Joe',
            ids: ['testNoteId']
        },
        result: {
            length: 1,
            checkArray: {
                0: {
                    id: 'testNoteId',
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
        method: 'editNote',
        params: {
            userId: 'Joe',
            id: 'testNoteId',
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
        method: 'getNotes',
        params: {
            userId: 'Joe',
            ids: ['testNoteId']
        },
        result: {
            length: 1,
            checkArray: {
                0: {
                    id: 'testNoteId',
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
        method: 'editNote',
        params: {
            userId: 'Joe',
            id: 'testNoteId',
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
        method: 'getNotes',
        params: {
            userId: 'Joe',
            ids: ['testNoteId']
        },
        result: {
            length: 1,
            checkArray: {
                0: {
                    id: 'testNoteId',
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
        title: 'delete note',
        method: 'editNote',
        params: {
            userId: 'Joe',
            id: 'testNoteId',
            operation: parseInt('000001', 2)
        },
        result: {
            error: false
        }
    }, {
        title: 'check note is deleted',
        method: 'getNotes',
        params: {
            userId: 'Joe',
            ids: ['testNoteId']
        },
        result: {
            length: 0
        }
    }]
};
