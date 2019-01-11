'use strict';

const http = require('http');

const req = http.request({
    method: 'GET',
    host: '127.0.0.1',
    port: 8001,
    path: '/'
}, (res) => {
    console.log('started response');
    res.setEncoding('utf8');
    res.on('data', (chunk) => {
        console.log('incoming chunk:', chunk.toString())
    });
});

req.on('error', console.log);

req.end();
