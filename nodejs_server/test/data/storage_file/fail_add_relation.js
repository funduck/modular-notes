module.exports = {
    title: 'fail add relation',
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
        title: 'insert node by Joe',
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
        title: 'insert node by Bill',
        method: 'editNode',
        params: {
            userId: 'Bill',
            id: 'privateNodeId',
            type: 'note',
            operation: parseInt('111110', 2),
            title: 'private node',
            content: new Buffer('private node'),
            flags: 2,
            meta: JSON.stringify({}),
            relationsAdd: [],
            relationsRm: [],
        },
        result: {
            error: false
        }
    }, {
        title: 'fail add relation by Joe without access to Bill\'s node',
        method: 'editNode',
        params: {
            id: 'testNodeId',
            userId: 'Joe',
            operation: parseInt('100000', 2),
            relationsAdd: ['privateNodeId', 'Bill\'s node', null],
        },
        result: {
            error: true
        }
    }, {
        title: 'fail add relation by Joe to same node',
        method: 'editNode',
        params: {
            id: 'privateNodeId',
            userId: 'Joe',
            operation: parseInt('100000', 2),
            relationsAdd: ['privateNodeId', 'recursion', null],
        },
        result: {
            error: true
        }
    }]
};
