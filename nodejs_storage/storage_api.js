module.exports = {
    /*
    int id - *Node* id, 0 is passed to create
    int user
    int operation - bits telling what to update `<relations><meta><flags><content><title><delete>`
    string class
    string title
    string ctype
    string content
    int flags
    string meta - JSON string
    string relationsAdd - comma separated numbers and string `<id1>,"<local_title1>",<local_value1>,<id2>, ...` length is multiple of 3
    string relationsRm - comma separated numbers `<id1>,<id2>, ...`
    */
    editNode: [
        'id', 'user', 'operation', 'class', 'title', 'ctype', 'content', 'flags', 'meta', 'relationsAdd', 'relationsRm'
    ],

    /*
    int user
    string id or idIn - comma separated *Node* ids
    string idOut - comma separated *Node* ids
    string idMin - minimum *Node* id
    string idMax - maximum *Node* id
    string classIn - comma separated URI encoded *Node* classes
    string classOut - comma separated URI encoded *Node* classes
    string titleLike - URI encoded string `<engine>:<expression>`, for regex `regex:^cat .*$`, for full text search `fts:cat `
    string contentLike - URI encoded string `<engine>:<expression>`, only if *Node* ctype is 'plain/text'
    string relationsIn - comma separated URI encoded `<class1>,<rel1_id>,<rel1_val_min>,<rel1_val_max>,<class2>, ...` length is multiple of 4
    string relationsOut - comma separated URI encoded `<class1>,<rel1_id>,<rel1_val_min>,<rel1_val_max>,<class2>, ...` length is multiple of 4
    string responseFields - comma separated URI encoded *Node* field names, id is always included in response
    string sort - direction of sorting by id, 'desc' or 'asc'
    int limit
    */
    getNodes: ['user', 'idIn', 'idOut', 'idMin', 'idMax', 'classIn', 'classOut', 'titleLike', 'contentLike',
        'relationsIn', 'relationsOut', 'responseFields', 'sort', 'limit'],

    /*
    int user
    int idA - *Node* with access
    int idB - resource *Node*
    int rights - bits `<create access from><create access to><delete><write><relate><read>`
    */
    editAccess: [
        'user', 'idA', 'idB', 'rights'
    ],

    /*
    int user
    int idA - *Node* with access
    int idB - resource *Node*
    */
    getAccess: ['user', 'idA', 'idB']
};
