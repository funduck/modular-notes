module.exports = {
    editNote: function(userId, noteId, type, operation, title, content, flags, meta, relationsAdd, relationsRm) {
        throw new Error('not implemented!');
    },

    /*
    all params are of type 'string'
    */
    getNotesIds: function(userId, ids, types, titleRegexp, relationsFilterIn, relationsFilterOut) {
        throw new Error('not implemented!');
    },

    /*
    all params are of type 'string'
    */
    getNotes: function(userId, ids) {
        throw new Error('not implemented!');
    },
};
