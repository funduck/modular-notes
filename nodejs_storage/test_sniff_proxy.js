const http = require('http');

const dest = process.argv[2] || 8000;

const server = http.createServer((req, res) => {
    console.log('request:', req.method, req.url, req.headers)

    proxy = http.request({
        method: req.method,
        host: 'localhost',
        port: dest,
        path: req.url,
        headers: req.headers
    }, (_res) => {
        console.log('response:', _res.statusCode, _res.statusMessage, _res.headers);
        res.writeHead(_res.statusCode, _res.statusMessage, _res.headers);

        _res.pipe(res);

        _res.on('data', (chunk) => {
            console.log('<- response chunk:', chunk);
        })
    });

    req.pipe(proxy);

    req.on('data', (chunk) => {
        console.log('-> request chunk:', chunk);
    })
});

server.listen(8001);
server.on('listening', () => {
    console.log('sniff proxy for ' + dest + ' started on 8001')
});
