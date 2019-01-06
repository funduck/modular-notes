'use strict';
const jayson = require('jayson');
const main = require('../main');
let client;
describe('Http server', function() {
    it('start server', () => {
        main.start({
            'log_level': 'error',
            'storage_file': null,
            'server_port': 9001
        });
    });

    it('create a client', () => {
        client = jayson.client.http({
            port: 9001
        });
    });

    it('create user', (done) => {
        client.request('editNote', {
            userId: 'Joe',
            id: 'Joe',
            type: 'user',
            operation: parseInt('111110', 2),
            title: 'first test user',
            content: 'user\'s Note content',
            flags: 2,
            meta: JSON.stringify({
                created: new Date().toISOString(),
                test: true
            }),
            relationsAdd: []
        }, function(err, response) {
            if (err || response.error) {
                return done(new Error(JSON.stringify(err || response.error)));
            }
            // console.log('response:', response, err);
            done();
        });
    });

    it('get user', (done) => {
        client.request('getNotes', {
            userId: 'Joe',
            ids: ['Joe']
        }, function(err, response) {
            if (err || response.error) {
                return done(new Error(JSON.stringify(err || response.error)));
            }
            // console.log('response:', response, err);
            done();
        });
    });

    it('stop', () => {
        main.stop();
        setTimeout(() => {
            process.exit(0);
        }, 200);
    });
});
