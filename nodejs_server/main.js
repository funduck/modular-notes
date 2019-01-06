'use strict';
let lastServer;
module.exports = {
    start: function(cfg) {
        const config = cfg || require('./config');
        const logger = config.logger || require('./console_logger');
        const storage = config.storage || require('./storage_file')(config.storage_file);
        const storageAPI = config.storageAPI || require('./storage_api');
        logger.setLevel(config.log_level || 'verbose');
        const jayson = require('jayson');
        const serverMethods = {};
        for (const method in storageAPI) {
            serverMethods[method] = function(args, callback) {
                logger.verbose('server method:', method);
                logger.debug('server method:', method, 'args:', args);
                const ar = [];
                for (let i = 0; i < storageAPI[method].length; i++) {
                    ar.push(args[storageAPI[method][i]]);
                }
                storage[method](...ar)
                .then((res) => {
                    logger.debug('server response', res);
                    callback(null, res);
                })
                .catch((e) => {
                    logger.error('server response', e.stack);
                    callback(e);
                });
            };
        }
        const server = jayson.server(serverMethods);
        server.http().listen(config.server_port);
        logger.info('started on', config.server_port);
        lastServer = server.http();
        return lastServer;
    },
    stop: function(server) {
        (server || lastServer).close();
        (server || lastServer).unref();
    }
};
if (process.argv.indexOf(module.filename) > 0) {
    module.exports.start();
}
