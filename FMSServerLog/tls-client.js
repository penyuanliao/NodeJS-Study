/**
 * Created by penyuan on 15/11/24.
 */
/*
* openssl genrsa -out skey.pem 1024
* openssl req -new -key  skey.pem -out  scsr.csr
* openssl x509 -req -days 30  -in scsr.csr -signkey skey.pem -out scert.pem
* */
var https = require('https');
var fs = require('fs');

var pkey = fs.readFileSync('keys/skey.pem');
var pcert = fs.readFileSync('keys/scert.pem');
var opt = {
    key : pkey,
    cert : pcert
};
var srv = https.createServer(opt, function (req, res) {
    console.log('conn');
    res.writeHead(200, {'Content-Type': 'text/html'});
    fs.readFile('ws-tls-client.html', function (err, html) {
        res.write(html);
        res.end();
    });
})
srv.listen(9000, function () {
    console.log('8080');
});
