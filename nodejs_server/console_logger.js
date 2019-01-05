module.exports = {
    level: 4,
    levels: {
        fatal: 0,
        error: 1,
        warn: 2,
        info: 3,
        verbose: 4,
        vverbose: 5,
        debug: 6
    },
    setLevel: (lvl) => {
        if (typeof lvl == 'number') {
            module.exports.level = lvl;
        }
        if (typeof lvl == 'string') {
            module.exports.level = module.exports.levels[lvl.toLowerCase()];
        }
    },
    log: (level, ...args) => {
        const lvl = module.exports.levels[level.toLowerCase()];
        if (lvl <= module.exports.level) {
            console.log(level, ...args);
        }
    },
    fatal: (...args) => {
        module.exports.log('FATAL', ...args);
    },
    error: (...args) => {
        module.exports.log('ERROR', ...args);
    },
    warn: (...args) => {
        module.exports.log('WARN', ...args);
    },
    info: (...args) => {
        module.exports.log('INFO', ...args);
    },
    verbose: (...args) => {
        module.exports.log('VERBOSE', ...args);
    },
    vverbose: (...args) => {
        module.exports.log('VVERBOSE', ...args);
    },
    debug: (...args) => {
        module.exports.log('DEBUG', ...args);
    }
};
