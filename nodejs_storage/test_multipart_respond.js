'use strict';
const FormData = require('form-data');
const http = require('http');
const fs = require('fs');
const dalmatian = fs.readFileSync('../examples/dalmatian.jpeg');

http.createServer(function(req, res) {
    //console.log('new request')
    var form = new FormData();
    form.append('part1', 'part 1 data');
    form.append('part2', 'part 2 data');
    form.append('part1', 'part 1 other data');
    //form.append('binary data', dalmatian);
    res.setHeader('x-Content-Type', 'multipart/form-data; boundary='+form._boundary);
    res.setHeader('Content-Type', 'text/plain');
    form.pipe(res);
}).listen(8000, function() {
    console.log('Listening for requests');
});
