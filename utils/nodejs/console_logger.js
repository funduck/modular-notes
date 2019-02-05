'use strict';

module.exports = {
    get: (name) => {
        if (name == 'get') {
            throw new Error("it is forbiden to call a logger 'get'");
        }
        if (!module.exports[name]) {
            const logger = {
                level: 0,
                levels: {
                    fatal: 0,
                    error: 1,
                    warn: 2,
                    info: 3,
                    verbose: 4,
                    debug: 5
                },
                setLevel: (lvl) => {
                    if (typeof lvl == 'number') {
                        logger.level = lvl;
                    }
                    if (typeof lvl == 'string') {
                        logger.level = logger.levels[lvl.toLowerCase()];
                    }
                    return logger;
                },
                log: (level, ...args) => {
                    const lvl = logger.levels[level.toLowerCase()];
                    if (lvl <= logger.level) {
                        for (let i = 0; i < args.length; i++) {
                            if (args[i] && args[i].toString) {
                                args[i] = args[i].toString();
                            }
                        }
                        console.log(level.toUpperCase().padEnd(10), name.toUpperCase().padEnd(10), ...args);
                    }
                    return logger;
                },
                fatal: (...args) => {
                    return logger.log('FATAL', ...args);
                },
                error: (...args) => {
                    return logger.log('ERROR', ...args);
                },
                warn: (...args) => {
                    return logger.log('WARN', ...args);
                },
                info: (...args) => {
                    return logger.log('INFO', ...args);
                },
                verbose: (...args) => {
                    return logger.log('VERBOSE', ...args);
                },
                debug: (...args) => {
                    return logger.log('DEBUG', ...args);
                }
            };
            logger.setLevel(process.env['MN_' + name.toUpperCase() + '_LOG_LEVEL'] || 'error');
            module.exports[name] = logger;
        }
        return module.exports[name];
    }
};
