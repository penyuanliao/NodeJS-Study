/**
 * Created by benson_liao on 2015/11/20.
 */

var crypto = require("crypto");
var tls = require('tls'), // SSL certificate
    fs = require('fs');
var net = require('net');
var util = require('util');
var events = require('events');
var header = require('./Headers.js');
var fxSocket = require('./FxSocket.js');

util.inherits(FxConnection, events.EventEmitter);

FxConnection.sockDidData = function () {

};
FxConnection.sockDidClosed = function () {

};
FxConnection.FxConnectionsockDidEnded = function () {

};
FxConnection.sockDidErrored = function () {

};


function FxConnection(port, option){
    events.EventEmitter.call(this);

    var self = this;
    var app = this.app = net.createServer();

    this.server = this.app.listen(port, function () {
        console.log('Listening on ' + app.address().port);
    });

    this.app.on('connection', function(socket){
        console.log('LOG::SOCKET START');
        var client = new fxSocket(socket);

        self.emit('connection', socket);

        socket.on('data', function (data) {
            sockDidData(client, data, self);
        });
        socket.on('close',  sockDidClosed);
        socket.on('end',    sockDidEnded);
        socket.on('error',  sockDidErrored);

    });

    function sockDidClosed() {
        console.log('LOG::SOCKET CLOSED');
    };

    function sockDidEnded() {
        console.log('LOG::SOCKET ENDED');
    };

    function sockDidErrored() {
        console.log('LOG::SOCKET ERROR');
    };
}
// only accepts secure connections
FxConnection.prototype.FxTLSConnection = function (option){

    var loadKey = fs.readFileSync('keys/skey.pem');
    var loadcert = fs.readFileSync('keys/scert.pem');
    var options = {
        key : loadKey,
        cert: loadcert
    };

    var self = this.self;

    tls.createServer(options, function (socket) {
        console.log('TLS Client connection established.');

        // Set listeners
        socket.on('readable', function () {
            console.log('TRACE :: Readable');

        });

        var client = new fxSocket(socket);
        socket.on('data', function (data) {
            console.log('::TRACE DATA ON STL CLIENT');
            sockDidData(client, data, self);
        });

    }).listen(8081);

}

var sockDidData = function (client, chunk, self) {
    //var socket = this;
    var request_headers = chunk.toString('utf8');
    var lines = request_headers.split("\r\n");
    // lines[0].toString().match(/^GET (.+) HTTP\/\d\.\d$/i)

    // FLASH SOCKET \0
    var unicodeNull = request_headers.match(/\0/g); // check endpoint
    var swfPolicy = request_headers.match("<policy-file-request/>") == null; // Flash Policy
    var iswebsocket = request_headers.match('websocket') != null; // Websocket Protocol

    //console.log('LOG::Data received: ', request_headers);



    if (unicodeNull != null && swfPolicy && client.mode != 'ws') {
        console.log('[SOCKET_NET_CONNECTED]:');
        client.mode = 'flashsocket';

        self.emit('message', client.read(request_headers));

    }else if (iswebsocket) {
        console.log('[WEBSOCKET_CONNECTED]');

        client.mode = 'ws';

        client.handeshake(chunk);

        client.write("-- WELCOME TO BENSON SOCKET SERVER --");
    }
    else if (client.mode === 'ws')
    {
        console.log('[WEBSOCKET_ROGER]');
        // check is a websocket framing


        var str = client.read(chunk);
        console.log("PROTOCOL::", str);
        self.emit('message', str);

    }else
    {
        console.log('[OTHER CONNECTED]');
    }


};

module.exports = exports = FxConnection;


var s = new FxConnection(8080);
s.FxTLSConnection(null);
s.on('connection', function (socket) {
    console.log('clients:',socket.name);
});
s.on('message', function (data) {
    console.log("TRACE",data);
});