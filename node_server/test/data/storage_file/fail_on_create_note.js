module.exports = {
    title: 'fails on create',
    steps: [{
        title: 'note without id',
        method: 'editNote',
        params: {
            id: null,
            userId: 'Joe',
            type: 'note',
            operation: parseInt('111110', 2),
            title: 'note without id',
            content: new Buffer('no id = no insert'),
            flags: 2,
            meta: JSON.stringify({}),
            relationsAdd: [],
            relationsRm: [],
        },
        result: {
            error: true
        }
    }, {
        title: 'note without userId',
        method: 'editNote',
        params: {
            id: 'someNoteId',
            userId: null,
            type: 'note',
            operation: parseInt('111110', 2),
            title: 'note without userId',
            content: new Buffer('no userId = no insert'),
            flags: 2,
            meta: JSON.stringify({}),
            relationsAdd: [],
            relationsRm: [],
        },
        result: {
            error: true
        }
    }, {
        title: 'note without operation',
        method: 'editNote',
        params: {
            id: 'someNoteId',
            userId: 'Joe',
            type: 'note',
            operation: null,
            title: 'note without operation',
            content: new Buffer('no operation = no insert'),
            flags: 2,
            meta: JSON.stringify({}),
            relationsAdd: [],
            relationsRm: [],
        },
        result: {
            error: true
        }
    }]
};
