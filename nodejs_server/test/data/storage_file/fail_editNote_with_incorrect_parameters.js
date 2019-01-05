module.exports = {
    title: 'fail editNote with incorrect parameters',
    steps: [{
        title: 'note without id',
        method: 'editNote',
        params: {
            id: null,
            userId: 'Joe',
            type: 'note',
            operation: parseInt('111110', 2),
            title: 'note without id',
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
        title: 'note without userId',
        method: 'editNote',
        params: {
            id: 'someNoteId',
            userId: null,
            type: 'note',
            operation: parseInt('111110', 2),
            title: 'note without userId',
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
        title: 'note without operation',
        method: 'editNote',
        params: {
            id: 'someNoteId',
            userId: 'Joe',
            type: 'note',
            operation: null,
            title: 'note without operation',
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
        title: 'note without type',
        method: 'editNote',
        params: {
            id: 'someNoteId',
            userId: 'Joe',
            type: null,
            operation: parseInt('111110', 2),
            title: 'note without type',
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
        title: 'note without title',
        method: 'editNote',
        params: {
            id: 'someNoteId',
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
        title: 'note without content',
        method: 'editNote',
        params: {
            id: 'someNoteId',
            userId: 'Joe',
            type: 'note',
            operation: parseInt('000100', 2),
            title: 'note without content',
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
        title: 'note without flags',
        method: 'editNote',
        params: {
            id: 'someNoteId',
            userId: 'Joe',
            type: 'note',
            operation: parseInt('001000', 2),
            title: 'note without content',
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
        title: 'note without meta',
        method: 'editNote',
        params: {
            id: 'someNoteId',
            userId: 'Joe',
            type: 'note',
            operation: parseInt('010000', 2),
            title: 'note without meta',
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
        title: 'note without meta',
        method: 'editNote',
        params: {
            id: 'someNoteId',
            userId: 'Joe',
            type: 'note',
            operation: parseInt('100000', 2),
            title: 'note without relations',
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
