module.exports = {
    title: 'fail editNode with incorrect parameters',
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
        title: 'node without id',
        method: 'editNode',
        params: {
            id: null,
            userId: 'Joe',
            type: 'note',
            operation: parseInt('111110', 2),
            title: 'node without id',
            content: new Buffer('no id'),
            flags: 2,
            meta: JSON.stringify({}),
            relationsAdd: [],
            relationsRm: [],
        },
        result: {
            error: true
        }
    }, {
        title: 'node without userId',
        method: 'editNode',
        params: {
            id: 'someNodeId',
            userId: null,
            type: 'note',
            operation: parseInt('111110', 2),
            title: 'node without userId',
            content: new Buffer('no userId'),
            flags: 2,
            meta: JSON.stringify({}),
            relationsAdd: [],
            relationsRm: [],
        },
        result: {
            error: true
        }
    }, {
        title: 'node without operation',
        method: 'editNode',
        params: {
            id: 'someNodeId',
            userId: 'Joe',
            type: 'note',
            operation: null,
            title: 'node without operation',
            content: new Buffer('no operation'),
            flags: 2,
            meta: JSON.stringify({}),
            relationsAdd: [],
            relationsRm: [],
        },
        result: {
            error: true
        }
    }, {
        title: 'node without type',
        method: 'editNode',
        params: {
            id: 'someNodeId',
            userId: 'Joe',
            type: null,
            operation: parseInt('111110', 2),
            title: 'node without type',
            content: new Buffer('no type'),
            flags: 2,
            meta: JSON.stringify({}),
            relationsAdd: [],
            relationsRm: [],
        },
        result: {
            error: true
        }
    }, {
        title: 'node without title',
        method: 'editNode',
        params: {
            id: 'someNodeId',
            userId: 'Joe',
            type: 'note',
            operation: parseInt('000010', 2),
            title: null,
            content: new Buffer('no title'),
            flags: 2,
            meta: JSON.stringify({}),
            relationsAdd: [],
            relationsRm: [],
        },
        result: {
            error: true
        }
    }, {
        title: 'node without content',
        method: 'editNode',
        params: {
            id: 'someNodeId',
            userId: 'Joe',
            type: 'note',
            operation: parseInt('000100', 2),
            title: 'node without content',
            content: null,
            flags: 2,
            meta: JSON.stringify({}),
            relationsAdd: [],
            relationsRm: [],
        },
        result: {
            error: true
        }
    }, {
        title: 'node without flags',
        method: 'editNode',
        params: {
            id: 'someNodeId',
            userId: 'Joe',
            type: 'note',
            operation: parseInt('001000', 2),
            title: 'node without content',
            content: new Buffer('no flags'),
            flags: null,
            meta: JSON.stringify({}),
            relationsAdd: [],
            relationsRm: [],
        },
        result: {
            error: true
        }
    }, {
        title: 'node without meta',
        method: 'editNode',
        params: {
            id: 'someNodeId',
            userId: 'Joe',
            type: 'note',
            operation: parseInt('010000', 2),
            title: 'node without meta',
            content: new Buffer('no meta'),
            flags: 2,
            meta: null,
            relationsAdd: [],
            relationsRm: [],
        },
        result: {
            error: true
        }
    }, {
        title: 'node without meta',
        method: 'editNode',
        params: {
            id: 'someNodeId',
            userId: 'Joe',
            type: 'note',
            operation: parseInt('100000', 2),
            title: 'node without relations',
            content: new Buffer('no relations'),
            flags: 2,
            meta: JSON.stringify({}),
            relationsAdd: null,
            relationsRm: null
        },
        result: {
            error: true
        }
    }]
};
