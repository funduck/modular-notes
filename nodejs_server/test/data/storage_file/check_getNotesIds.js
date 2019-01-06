module.exports = {
    title: 'check getNotesIds',
    steps: [{
        title: 'create user Joe',
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
        title: 'check db is clear',
        method: 'getNotesIds',
        params: {
            userId: 'Joe'
        },
        result: {
            length: 1,
            checkArray: {
                0: 'Joe'
            }
        }
    }, {
        title: 'create user Bill',
        method: 'editNote',
        params: {
            userId: 'Bill',
            id: 'Bill',
            type: 'user',
            operation: parseInt('111110', 2),
            title: 'Bill',
            content: new Buffer('Bill Delatour Doutriugh'),
            flags: 2,
            meta: JSON.stringify({}),
            relationsAdd: [],
            relationsRm: [],
        },
        result: {
            error: false
        }
    }, {
        title: 'create note by Joe',
        method: 'editNote',
        params: {
            id: 'joesNote1',
            userId: 'Joe',
            type: 'note',
            operation: parseInt('111110', 2),
            title: 'note 1',
            content: new Buffer('note 1'),
            flags: 2,
            meta: JSON.stringify({}),
            relationsAdd: [],
            relationsRm: [],
        },
        result: {
            error: false,
        }
    }, {
        title: 'not get note\'s id by Bill',
        method: 'getNotesIds',
        params: {
            userId: 'Bill',
            types: ['note']
        },
        result: {
            length: 0
        }
    }, {
        title: 'get note\'s id by Joe',
        method: 'getNotesIds',
        params: {
            userId: 'Joe',
            types: ['note']
        },
        result: {
            length: 1,
            checkArray: {
                0: 'joesNote1'
            }
        }
    }, {
        title: 'create tag T1',
        method: 'editNote',
        params: {
            id: 'T1',
            userId: 'Joe',
            type: 'tag',
            operation: parseInt('111110', 2),
            title: 'T1',
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
        title: 'create tag T2',
        method: 'editNote',
        params: {
            id: 'T2',
            userId: 'Joe',
            type: 'tag',
            operation: parseInt('111110', 2),
            title: 'T2',
            content: new Buffer('Second tag!'),
            flags: 2,
            meta: JSON.stringify({}),
            relationsAdd: [],
            relationsRm: [],
        },
        result: {
            error: false,
        }
    }, {
        title: 'add tag T1',
        method: 'editNote',
        params: {
            id: 'joesNote1',
            userId: 'Joe',
            operation: parseInt('100000', 2),
            relationsAdd: ['T1', 'first tag', null],
        },
        result: {
            error: false,
        }
    }, {
        title: 'create another note by Joe',
        method: 'editNote',
        params: {
            id: 'joesNote2',
            userId: 'Joe',
            type: 'note',
            operation: parseInt('111110', 2),
            title: 'note 2',
            content: new Buffer('note 2'),
            flags: 2,
            meta: JSON.stringify({}),
            relationsAdd: [],
            relationsRm: [],
        },
        result: {
            error: false,
        }
    }, {
        title: 'get 2 note\'s id by "types"',
        method: 'getNotesIds',
        params: {
            userId: 'Joe',
            types: ['note']
        },
        result: {
            length: 2
        }
    }, {
        title: 'get 1 note\'s id by type and "titleRegexp"',
        method: 'getNotesIds',
        params: {
            userId: 'Joe',
            types: ['note'],
            titleRegexp: '.* 1$'
        },
        result: {
            length: 1,
            checkArray: {
                0: 'joesNote1'
            }
        }
    }, {
        title: 'get 1 note\'s id by type and relation type',
        method: 'getNotesIds',
        params: {
            userId: 'Joe',
            types: ['note'],
            relationsFilterIn: ['tag', null, null, null]
        },
        result: {
            length: 1,
            checkArray: {
                0: 'joesNote1'
            }
        }
    }, {
        title: 'get 1 note\'s id by type and exclude relation type',
        method: 'getNotesIds',
        params: {
            userId: 'Joe',
            types: ['note'],
            relationsFilterOut: ['tag', null, null, null]
        },
        result: {
            length: 1,
            checkArray: {
                0: 'joesNote2'
            }
        }
    }, {
        title: 'get 2 note\'s id by type and empty relation',
        method: 'getNotesIds',
        params: {
            userId: 'Joe',
            types: ['note'],
            relationsFilterIn: [null, null, null, null]
        },
        result: {
            length: 2
        }
    }, {
        title: 'get 2 note\'s id by type and exclude empty relation',
        method: 'getNotesIds',
        params: {
            userId: 'Joe',
            types: ['note'],
            relationsFilterOut: [null, null, null, null]
        },
        result: {
            length: 2
        }
    }, {
        title: 'get 1 note\'s id by type and relation id T1',
        method: 'getNotesIds',
        params: {
            userId: 'Joe',
            types: ['note'],
            relationsFilterIn: [null, 'T1', null, null]
        },
        result: {
            length: 1,
            checkArray: {
                0: 'joesNote1'
            }
        }
    }, {
        title: 'get 1 note\'s id by type and exclude relation id T1',
        method: 'getNotesIds',
        params: {
            userId: 'Joe',
            types: ['note'],
            relationsFilterOut: [null, 'T1', null, null]
        },
        result: {
            length: 1,
            checkArray: {
                0: 'joesNote2'
            }
        }
    }, {
        title: 'add tag T2 to note1',
        method: 'editNote',
        params: {
            id: 'joesNote1',
            userId: 'Joe',
            operation: parseInt('100000', 2),
            relationsAdd: ['T2', 'math constant', 3.14],
        },
        result: {
            error: false,
        }
    }, {
        title: 'add tag T2 to note2',
        method: 'editNote',
        params: {
            id: 'joesNote2',
            userId: 'Joe',
            operation: parseInt('100000', 2),
            relationsAdd: ['T2', 'math constant', 2.71],
        },
        result: {
            error: false,
        }
    }, {
        title: 'get 2 note\'s id by type and relation id T2',
        method: 'getNotesIds',
        params: {
            userId: 'Joe',
            types: ['note'],
            relationsFilterIn: [null, 'T2', null, null]
        },
        result: {
            length: 2
        }
    }, {
        title: 'get 2 note\'s id by type, relation id T2 and value > 0',
        method: 'getNotesIds',
        params: {
            userId: 'Joe',
            types: ['note'],
            relationsFilterIn: [null, 'T2', 0, null]
        },
        result: {
            length: 2
        }
    }, {
        title: 'get 0 note\'s id by type, relation id T2 and value < 0',
        method: 'getNotesIds',
        params: {
            userId: 'Joe',
            types: ['note'],
            relationsFilterIn: [null, 'T2', null, 0]
        },
        result: {
            length: 0
        }
    }, {
        title: 'get 1 note\'s id by type, relation id T2 and value < 0 and < 3',
        method: 'getNotesIds',
        params: {
            userId: 'Joe',
            types: ['note'],
            relationsFilterIn: [null, 'T2', 2, 3]
        },
        result: {
            length: 1,
            checkArray: {
                0: 'joesNote2'
            }
        }
    }]
};
