module.exports = {
    title: 'create node & get node',
    steps: [{
        title: 'create user`',
        method: 'editNode',
        params: {
            user: null,
            id: null,
            class: 'user',
            operation: parseInt('111110', 2),
            title: 'Joe',
            ctype: 'text/plain',
            content: 'Joe Andrew Smith',
            flags: 0,
            meta: JSON.stringify({}),
            relationsAdd: '',
            relationsRm: '',
        },
        result: {
            error: false,
            value: 1
        }
    }, {
        title: 'insert test node',
        method: 'editNode',
        params: {
            user: 1,
            id: null,
            class: 'note',
            operation: parseInt('111110', 2),
            title: 'test node',
            ctype: 'text/plain',
            content: 'hello world',
            flags: 0,
            meta: JSON.stringify({}),
            relationsAdd: '',
            relationsRm: '',
        },
        result: {
            error: false,
            value: 2
        }
    }, {
        title: 'get node',
        method: 'getNodes',
        params: {
            user: '1',
            idIn: '2',
            responseFields: 'id,author,class,title,content,flags,meta',
            contentLike: 'regex:.*'
        },
        result: {
            length: 2,
            checkArray: {
                0: {
                    id: 2,
                    author: 1,
                    class: 'note',
                    title: 'test node',
                    content: 'hello world',
                    flags: 0,
                    meta: JSON.stringify({})
                },
                1: {
                    ignoredParameters: 'contentLike'
                }
            }
        }
    }]
};
