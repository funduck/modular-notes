module.exports = {
    title: 'check getNotes',
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
        title: 'create note by Joe',
        method: 'editNote',
        params: {
            id: 'joesNoteId',
            userId: 'Joe',
            type: 'note',
            operation: parseInt('111110', 2),
            title: 'Joe\'s note',
            content: new Buffer('ok'),
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
                0: 'joesNoteId'
            }
        }
    }]
};
