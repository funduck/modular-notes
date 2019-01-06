module.exports = {
    title: 'fail add relation',
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
        title: 'insert note by Joe',
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
        title: 'insert note by Bill',
        method: 'editNote',
        params: {
            userId: 'Bill',
            id: 'privateNoteId',
            type: 'note',
            operation: parseInt('111110', 2),
            title: 'private note',
            content: new Buffer('private note'),
            flags: 2,
            meta: JSON.stringify({}),
            relationsAdd: [],
            relationsRm: [],
        },
        result: {
            error: false
        }
    }, {
        title: 'fail add relation by Joe without access to Bill\'s note',
        method: 'editNote',
        params: {
            id: 'testNoteId',
            userId: 'Joe',
            operation: parseInt('100000', 2),
            relationsAdd: ['privateNoteId', 'Bill\'s note', null],
        },
        result: {
            error: true
        }
    }, {
        title: 'fail add relation by Joe to same note',
        method: 'editNote',
        params: {
            id: 'privateNoteId',
            userId: 'Joe',
            operation: parseInt('100000', 2),
            relationsAdd: ['privateNoteId', 'recursion', null],
        },
        result: {
            error: true
        }
    }]
};
