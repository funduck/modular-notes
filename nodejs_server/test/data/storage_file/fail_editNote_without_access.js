module.exports = {
    title: 'fail editNote witout access',
    steps: [{
        title: 'insert test note by Joe',
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
        title: 'fail change note by Bill',
        method: 'editNote',
        params: {
            userId: 'Bill',
            id: 'testNoteId',
            operation: parseInt('000010', 2),
            title: 'test note edited'
        },
        result: {
            error: true
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
