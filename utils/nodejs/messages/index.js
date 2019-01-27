'use strict';

/*
    Keeps key-value pairs
    has toString() so can be used for logging
    has clone() so can be nested in subroutines
    can be used as "context" since keys starting with "_" are not stringified in toString()
*/
class Message extends Map {
    constructor (...args) {
        // new(otherMessage) -- clone or raw init
        if (args[0] instanceof Map || args[0] instanceof Message || Array.isArray(args[0])) {
            super(...args);
        } else {
            super();
        }

        // new('key1', 'val1', 'key2', val2', ...)
        if (args.length > 1) {
            this.setm(...args);
        }

        // message universal id
        if (!this.get('muid')) {
            this.set('muid', Messages._getNextMUID());
        }

        if (Messages._rmuid && !this.get('rmuid')) {
            this.set('rmuid', Messages._getNextRMUID());
        }
    }

    /*
    Set multiple key-value pairs, for example: setm('a', 1, 'b', 2, 'c', 3)
    */
    setm (...args) {
        if (args.length == 0) return this;

        if (args.length % 2 == 0) {
            for (let i = 0; i < args.length/2; i++) {
                this.set(args[2*i], args[2*i + 1]);
            }
        } else {
            throw new Error('number of arguments must be multiple of 2')
        }

        return this;
    }

    /*
    @return {string} made using all keys except starting with "_", uses Messages._format
    */
    toString () {
        let key;
        let val;
        let len;
        let s = '';
        let free = 0;
        let spaceBefore;
        const fields = Messages._format.fields;
        for (let i = 0; i < fields.length; i++) {
            key = fields[i].field;
            val = String(this.get(key) || '');
            if (Messages._format.elastic) {
                len = fields[i].len;
                if (val.length < len) {
                    spaceBefore = ''.padEnd(free, ' ');
                    free = len - val.length;
                } else {
                    if (i > 0) {
                        spaceBefore = ' '.padEnd(free - val.length + len);
                    } else {
                        spaceBefore = '';
                    }
                    free = 0;
                }
                s += spaceBefore + val;
            } else {
                s += val + '\t';
            }
        }
        if (free) {
            s += ''.padEnd(free, ' ');
        }
        for (let [key, val] of this) {
            if ((!key.match || !key.match(/^_/)) && // keys like "_somePrivate" wont be serialized
                key != 'muid' && // muid is positional
                key != 'rmuid' && // rmuid is positional
                !Messages._format.keys.get(key) &&
                val != null &&
                val != undefined
            ) {
                s += ' ' + key + '=' + JSON.stringify(val);
            }
        }
        return s;
    }

    clone (...args) {
        const clone = new Message(this);
        if (args.length > 0) {
            clone.setm(...args);
        }
        return clone;
    };
};

const Messages = {
    Message: Message,

    _rmuid: false,

    _getNextMUID: function () {
        return  'muid' + new Date().getTime() % 1000000;
    },

    _getNextRMUID: function () {
        return  'rmuid' + new Date().getTime();
    },

    _format: {
        fields: [{
            field: 'where',
            len: 15
        }, {
            field: 'what',
            len: 23
        }],
        keys: new Map([['where', true], ['what', true]]),
        elastic: true
    },

    // TODO if needed _hiddenFields: new Map(),

    setFormat: function (format) {
        const _f = {
            fields: format.fields,
            keys: new Map(),
            elastic: format.elastic != null ? format.elastic : true
        };
        for (let i = 0; i < format.fields.length; i++) {
            _f.keys.set(format.fields[i].field, true);
            if (format.fields[i].field == 'muid' && (format.fields[i].len || 0) < 12) {
                format.fields[i].len = 12;
            }
            if (format.fields[i].len == null) {
                format.fields[i].len = 10;
            }
        }
        Messages._format = _f;

        Messages._rmuid = false;
        if (Messages._format.keys.get('rmuid')) {
            Messages._rmuid = true;
        }
    },

    /*
    TODO if needed
    hide: function (fields) {

    },

    show: function (fields) {

    }
    */
};

// setting default format
Messages.setFormat({
    fields: [{
        field: 'muid',
        len: 12
    }, {
        field: 'where',
        len: 15
    }, {
        field: 'what',
        len: 23
    }],
    elastic: true
});

module.exports = Messages;
