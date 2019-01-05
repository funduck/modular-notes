module.exports = {
    title: 'create tag and note with it',
    steps: [{
        title: 'create tag',
        method: 'editNote',
        params: {
            id: 'firstTagId',
            userId: 'Joe',
            type: 'tag',
            operation: parseInt('111110', 2),
            title: 'first tag',
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
        title: 'create note with tag',
        method: 'editNote',
        params: {
            id: 'noteWithTagId',
            userId: 'Joe',
            type: 'note',
            operation: parseInt('111110', 2),
            title: 'note with tag',
            content: new Buffer('ok, lets try using our #"first tag"'),
            flags: 2,
            meta: JSON.stringify({}),
            relationsAdd: ['tag', 'firstTagId', 'first tag', null],
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
            ids: ['noteWithTagId']
        },
        result: {
            length: 1,
            checkArray: {
                0: {
                    id: 'noteWithTagId',
                    author: 'Joe',
                    type: 'note',
                    title: 'note with tag',
                    content: new Buffer('ok, lets try using our #"first tag"'),
                    flags: 2,
                    meta: JSON.stringify({}),
                    relations: ['tag', 'firstTagId', 'first tag', null]
                }
            }
        }
    }]
};
