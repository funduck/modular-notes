module.exports = {
    title: 'check findNodes',
    steps: [{
        title: 'create user Joe',
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
        title: 'check db is clear',
        method: 'findNodes',
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
        method: 'editNode',
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
        title: 'create node by Joe',
        method: 'editNode',
        params: {
            id: 'joesNode1',
            userId: 'Joe',
            type: 'note',
            operation: parseInt('111110', 2),
            title: 'node 1',
            content: new Buffer('node 1'),
            flags: 2,
            meta: JSON.stringify({}),
            relationsAdd: [],
            relationsRm: [],
        },
        result: {
            error: false,
        }
    }, {
        title: 'not get node\'s id by Bill',
        method: 'findNodes',
        params: {
            userId: 'Bill',
            types: ['note']
        },
        result: {
            length: 0
        }
    }, {
        title: 'get node\'s id by Joe',
        method: 'findNodes',
        params: {
            userId: 'Joe',
            types: ['note']
        },
        result: {
            length: 1,
            checkArray: {
                0: 'joesNode1'
            }
        }
    }, {
        title: 'create tag T1',
        method: 'editNode',
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
        method: 'editNode',
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
        method: 'editNode',
        params: {
            id: 'joesNode1',
            userId: 'Joe',
            operation: parseInt('100000', 2),
            relationsAdd: ['T1', 'first tag', null],
        },
        result: {
            error: false,
        }
    }, {
        title: 'create another node by Joe',
        method: 'editNode',
        params: {
            id: 'joesNode2',
            userId: 'Joe',
            type: 'note',
            operation: parseInt('111110', 2),
            title: 'node 2',
            content: new Buffer('node 2'),
            flags: 2,
            meta: JSON.stringify({}),
            relationsAdd: [],
            relationsRm: [],
        },
        result: {
            error: false,
        }
    }, {
        title: 'get 2 node\'s id by "types"',
        method: 'findNodes',
        params: {
            userId: 'Joe',
            types: ['note']
        },
        result: {
            length: 2
        }
    }, {
        title: 'get 1 node\'s id by type and "titleRegexp"',
        method: 'findNodes',
        params: {
            userId: 'Joe',
            types: ['note'],
            titleRegexp: '.* 1$'
        },
        result: {
            length: 1,
            checkArray: {
                0: 'joesNode1'
            }
        }
    }, {
        title: 'get 1 node\'s id by type and relation type',
        method: 'findNodes',
        params: {
            userId: 'Joe',
            types: ['note'],
            relationsFilterIn: ['tag', null, null, null]
        },
        result: {
            length: 1,
            checkArray: {
                0: 'joesNode1'
            }
        }
    }, {
        title: 'get 1 node\'s id by type and exclude relation type',
        method: 'findNodes',
        params: {
            userId: 'Joe',
            types: ['note'],
            relationsFilterOut: ['tag', null, null, null]
        },
        result: {
            length: 1,
            checkArray: {
                0: 'joesNode2'
            }
        }
    }, {
        title: 'get 2 node\'s id by type and empty relation',
        method: 'findNodes',
        params: {
            userId: 'Joe',
            types: ['note'],
            relationsFilterIn: [null, null, null, null]
        },
        result: {
            length: 2
        }
    }, {
        title: 'get 2 node\'s id by type and exclude empty relation',
        method: 'findNodes',
        params: {
            userId: 'Joe',
            types: ['note'],
            relationsFilterOut: [null, null, null, null]
        },
        result: {
            length: 2
        }
    }, {
        title: 'get 1 node\'s id by type and relation id T1',
        method: 'findNodes',
        params: {
            userId: 'Joe',
            types: ['note'],
            relationsFilterIn: [null, 'T1', null, null]
        },
        result: {
            length: 1,
            checkArray: {
                0: 'joesNode1'
            }
        }
    }, {
        title: 'get 1 node\'s id by type and exclude relation id T1',
        method: 'findNodes',
        params: {
            userId: 'Joe',
            types: ['note'],
            relationsFilterOut: [null, 'T1', null, null]
        },
        result: {
            length: 1,
            checkArray: {
                0: 'joesNode2'
            }
        }
    }, {
        title: 'add tag T2 to node1',
        method: 'editNode',
        params: {
            id: 'joesNode1',
            userId: 'Joe',
            operation: parseInt('100000', 2),
            relationsAdd: ['T2', 'math constant', 3.14],
        },
        result: {
            error: false,
        }
    }, {
        title: 'add tag T2 to node2',
        method: 'editNode',
        params: {
            id: 'joesNode2',
            userId: 'Joe',
            operation: parseInt('100000', 2),
            relationsAdd: ['T2', 'math constant', 2.71],
        },
        result: {
            error: false,
        }
    }, {
        title: 'get 2 node\'s id by type and relation id T2',
        method: 'findNodes',
        params: {
            userId: 'Joe',
            types: ['note'],
            relationsFilterIn: [null, 'T2', null, null]
        },
        result: {
            length: 2
        }
    }, {
        title: 'get 2 node\'s id by type, relation id T2 and value > 0',
        method: 'findNodes',
        params: {
            userId: 'Joe',
            types: ['note'],
            relationsFilterIn: [null, 'T2', 0, null]
        },
        result: {
            length: 2
        }
    }, {
        title: 'get 0 node\'s id by type, relation id T2 and value < 0',
        method: 'findNodes',
        params: {
            userId: 'Joe',
            types: ['note'],
            relationsFilterIn: [null, 'T2', null, 0]
        },
        result: {
            length: 0
        }
    }, {
        title: 'get 1 node\'s id by type, relation id T2 and value < 0 and < 3',
        method: 'findNodes',
        params: {
            userId: 'Joe',
            types: ['note'],
            relationsFilterIn: [null, 'T2', 2, 3]
        },
        result: {
            length: 1,
            checkArray: {
                0: 'joesNode2'
            }
        }
    }]
};
