module.exports = {
    /*
    all params are of type 'string'
    */
    editNote: [
        'userId', 'id', 'type', 'operation', 'title', 'content', 'flags', 'meta', 'relationsAdd', 'relationsRm'
    ],

    /*
    all params are of type 'string'
    */
    getNotesIds: ['userId', 'ids', 'types', 'titleRegexp', 'relationsFilterIn', 'relationsFilterOut'],

    /*
    all params are of type 'string'
    */
    getNotes: ['userId', 'ids']
};
