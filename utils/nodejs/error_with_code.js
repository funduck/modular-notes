'use strict';

class ErrorWithCode extends Error {
    constructor (obj, text) {
        text = typeof obj == 'object' ?
            text ? obj.text + ' ' + text : obj.text
            :
            text ? obj + ' ' + text : obj;
        super(text);
        if (typeof obj == 'object') {
            this.code = obj.code;
        }
    }
}

module.exports = ErrorWithCode;
