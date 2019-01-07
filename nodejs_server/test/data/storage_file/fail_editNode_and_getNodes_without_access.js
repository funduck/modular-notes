module.exports = {
    title: 'fail editNode and getNodes witout access',
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
        title: 'insert test node by Joe',
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
        title: 'fail change node by Bill',
        method: 'editNode',
        params: {
            userId: 'Bill',
            id: 'testNodeId',
            operation: parseInt('000010', 2),
            title: 'test node edited'
        },
        result: {
            error: true
        }
    }, {
        title: 'get node by Joe',
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
                    title: 'test node',
                    content: new Buffer('hello world'),
                    flags: 2,
                    meta: JSON.stringify({})
                }
            }
        }
    }, {
        title: 'fail get node by Bill',
        method: 'getNodes',
        params: {
            userId: 'Bill',
            ids: ['testNodeId']
        },
        result: {
            length: 0
        }
    }]
};
