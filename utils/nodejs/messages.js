'use strict';

const Messages = {
    // to get configuration and iterate
    _format: [{
        field: 'where',
        len: 15
    }, {
        field: 'what',
        len: 20
    }],

    // to fast check fields
    __format: new Map([['where', true], ['what', true]]),

    new: (...args) => {
        let m;
        // new(otherMessage) -- clone or raw init
        if (args[0] instanceof Map || Array.isArray(args[0])) {
            m = new Map(...args);
        }
        if (!m) {
            m = new Map();
        }
        // new('key1', 'val1', 'key2', val2', ...)
        if (args.length > 1 && args.length % 2 == 0) {
            for (let i = 0; i < args.length/2; i++) {
                m.set(args[2*i], args[2*i + 1]);
            }
        }
        m.toString = () => {
            let s = '';
            for (let i = 0; i < Messages._format.length; i++) {
                s += (m.get(Messages._format[i].field) || '').padEnd(Messages._format[i].len, ' ');
            }
            for (let [key, val] of m) {
                if (!Messages.__format.get(key)) {
                    s += ' ' + key + '=' + JSON.stringify(val);
                }
            }
            return s;
        };
        m.clone = () => {
            return Messages.new(m);
        };
        return m;
    },

    setFormat: (format) => {
        throw new Error('not implemented');
    }
};

module.exports = Messages;
