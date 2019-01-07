module.exports = {
    title: 'create node & get node',
    steps: [{
        title: 'create user`',
        method: 'editNode',
        params: {
            userId: 'Joe',
            id: 'Joe',
            type: 'user',
            operation: parseInt('111110', 2),
            title: 'Joe',
            content: 'Joe Andrew Smith',
            flags: 2,
            meta: JSON.stringify({}),
            relationsAdd: [],
            relationsRm: [],
        },
        result: {
            error: false
        }
    }, {
        title: 'insert test node',
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
        title: 'get node',
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
    }]
};
