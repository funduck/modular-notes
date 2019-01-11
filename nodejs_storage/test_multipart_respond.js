'use strict';
const FormData = require('form-data');
const http = require('http');
const fs = require('fs');
const dalmatian = fs.readFileSync('../examples/dalmatian.jpeg');

http.createServer(function(req, res) {
    //console.log('new request')
    var form = new FormData();
    for (let i = 0; i < 20; i++) {
        form.append('part' + i, 'part ' + i + ' data ' + Math.random()*1000000);
    }
    //form.append('binary data', dalmatian);
    res.setHeader('x-Content-Type', 'multipart/form-data; boundary='+form._boundary);
    res.setHeader('Content-Type', 'text/plain');
    form.pipe(res);
}).listen(8000, function() {
    console.log('Listening for requests on 8000');
});
