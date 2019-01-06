module.exports = {
    title: 'fail editNote and getNotes witout access',
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
        title: 'get note by Joe',
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
    }, {
        title: 'fail get note by Bill',
        method: 'getNotes',
        params: {
            userId: 'Bill',
            ids: ['testNoteId']
        },
        result: {
            length: 0
        }
    }]
};
