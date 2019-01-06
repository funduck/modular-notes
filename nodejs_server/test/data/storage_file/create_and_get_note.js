module.exports = {
    title: 'create note & get note',
    steps: [{
        title: 'create user`',
        method: 'editNote',
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
        title: 'insert test note',
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
        title: 'get note',
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
                    title: 'test note',
                    content: new Buffer('hello world'),
                    flags: 2,
                    meta: JSON.stringify({})
                }
            }
        }
    }]
};
