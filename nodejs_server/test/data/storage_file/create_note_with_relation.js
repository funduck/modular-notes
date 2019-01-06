module.exports = {
    title: 'create note with relation',
    steps: [{
        title: 'create user`',
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
        title: 'create relation first',
        method: 'editNote',
        params: {
            id: 'firstTagId',
            userId: 'Joe',
            type: 'tag prototype',
            operation: parseInt('111110', 2),
            title: 'tag title',
            content: new Buffer('First tag!'),
            flags: 2,
            meta: JSON.stringify({}),
            relationsAdd: [],
            relationsRm: [],
        },
        result: {
            error: false,
        }
    }, {
        title: 'get relation',
        method: 'getNotes',
        params: {
            userId: 'Joe',
            ids: ['firstTagId']
        },
        result: {
            length: 1,
            checkArray: {
                0: {
                    id: 'firstTagId',
                    author: 'Joe',
                    type: 'tag prototype',
                    title: 'tag title',
                    content: new Buffer('First tag!'),
                    flags: 2,
                    meta: JSON.stringify({}),
                    relations: []
                }
            }
        }
    }, {
        title: 'create note with relation',
        method: 'editNote',
        params: {
            id: 'noteWithRel',
            userId: 'Joe',
            type: 'note',
            operation: parseInt('111110', 2),
            title: 'note with relation',
            content: new Buffer('ok'),
            flags: 2,
            meta: JSON.stringify({}),
            relationsAdd: ['firstTagId', 'tag prototype text', null],
            relationsRm: [],
        },
        result: {
            error: false,
        }
    }, {
        title: 'get note',
        method: 'getNotes',
        params: {
            userId: 'Joe',
            ids: ['noteWithRel']
        },
        result: {
            length: 1,
            checkArray: {
                0: {
                    id: 'noteWithRel',
                    author: 'Joe',
                    type: 'note',
                    title: 'note with relation',
                    content: new Buffer('ok'),
                    flags: 2,
                    meta: JSON.stringify({}),
                    relations: ['tag prototype', 'firstTagId', 'tag prototype text', null]
                }
            }
        }
    }, {
        title: 'remove tag',
        method: 'editNote',
        params: {
            id: 'noteWithRel',
            userId: 'Joe',
            type: null,
            operation: parseInt('100000', 2),
            title: null,
            content: null,
            flags: null,
            meta: null,
            relationsAdd: [],
            relationsRm: ['firstTagId'],
        },
        result: {
            error: false,
        }
    }, {
        title: 'get note without tag',
        method: 'getNotes',
        params: {
            userId: 'Joe',
            ids: ['noteWithRel']
        },
        result: {
            length: 1,
            checkArray: {
                0: {
                    id: 'noteWithRel',
                    author: 'Joe',
                    type: 'note',
                    title: 'note with relation',
                    content: new Buffer('ok'),
                    flags: 2,
                    meta: JSON.stringify({}),
                    relations: []
                }
            }
        }
    }, {
        title: 'add tag back',
        method: 'editNote',
        params: {
            id: 'noteWithRel',
            userId: 'Joe',
            operation: parseInt('100000', 2),
            relationsAdd: ['firstTagId', 'first tag back', null],
        },
        result: {
            error: false,
        }
    }, {
        title: 'get note with tag',
        method: 'getNotes',
        params: {
            userId: 'Joe',
            ids: ['noteWithRel']
        },
        result: {
            length: 1,
            checkArray: {
                0: {
                    id: 'noteWithRel',
                    author: 'Joe',
                    type: 'note',
                    title: 'note with relation',
                    content: new Buffer('ok'),
                    flags: 2,
                    meta: JSON.stringify({}),
                    relations: ['tag prototype', 'firstTagId', 'first tag back', null]
                }
            }
        }
    }]
};
