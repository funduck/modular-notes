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
    editNote: [
        'userId', 'id', 'type', 'operation', 'title', 'content', 'flags', 'meta', 'relationsAdd', 'relationsRm'
    ],

    /*
    string userId,
    string[] ids,
    string[] types,
    string titleRegexp,
    string[] relationsFilterIn,
    string[] relationsFilterOut
    */
    getNotesIds: ['userId', 'ids', 'types', 'titleRegexp', 'relationsFilterIn', 'relationsFilterOut'],

    /*
    string userId,
    string[] ids
    */
    getNotes: ['userId', 'ids'],

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
