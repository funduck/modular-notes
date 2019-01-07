module.exports = {
    /*
    string userId,
    string id,
    string type,
    int operation,
    string title,
    Buffer content,
    int flags,
    string meta,
    string[] relationsAdd,
    string[] relationsRm
    */
    editNode: [
        'userId', 'id', 'type', 'operation', 'title', 'content', 'flags', 'meta', 'relationsAdd', 'relationsRm'
    ],

    /*
    string userId,
    string[] types,
    string titleRegexp,
    string[] relationsFilterIn,
    string[] relationsFilterOut
    */
    findNodes: ['userId', 'types', 'titleRegexp', 'relationsFilterIn', 'relationsFilterOut'],

    /*
    string userId,
    string[] ids
    */
    getNodes: ['userId', 'ids'],

    /*
    string userId,
    string idA,
    string idB,
    int rights
    */
    editAccess: [
        'userId', 'idA', 'idB', 'rights'
    ],

    /*
    string userId,
    string idA,
    string idB
    */
    getAccess: ['userId', 'idA', 'idB']
};
