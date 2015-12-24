/**
 * Created by Benson.Liao on 2015/11/20.
 */
"use strict";
var crypto = require("crypto");
var tls = require('tls'), // SSL certificate
    fs = require('fs');
var net = require('net');
var util = require('util');
var events = require('events');

var fxSocket = require('./FxSocket.js');

var logger = require('./FxLogger.js');

var clients = []; // 紀錄使用者

util.inherits(FxConnection, events.EventEmitter);

var fxStatus = {
    "http":         "http",
    "websocket":    "ws",
    "flashSocket":  "flashsocket",
    "socket":       "socket"
};

/**
 * initialize net.socket
 * @param port
 * @param option
 * @constructor
 */
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
        // First one, do check connected.
        socket.once('data', function (data) {
            var mode = findOutSocketConnected(client, data, self);
            logger.debug("[Connection] Client through Server for mode " + mode);

            if (mode != fxStatus.http)
            {
                client.isConnect = true;
                addUpdateData(mode);
                console.log("[INFO] Add client mode:",client.mode);
                clients[client.name] = client;
            } else {

                //var http = data.toString('utf8');
                //client.close();
            }

        });
        /**
         * 確定連線後連線資料事件並傳出data事件
         * @param mode 型態(fxStatus)
         */
        function addUpdateData(mode) {

            socket.on('data', function (chunk) {

                var data = chunk;

                if (mode === fxStatus.websocket) {
                    data = client.read(chunk);
                }

                self.emit("message", data);
            });

        };

        socket.on('close',  sockDidClosed);
        socket.on('end',    sockDidEnded);
        socket.on('error',  sockDidErrored);

    });

    function sockDidClosed() {
        console.log('LOG::SOCKET CLOSED');

        var socket = this;
        var index = clients.indexOf(socket.name);
        var removeItem;
        if (index > -1) removeItem = index.splice(index, 1);
        delete clients[socket.name];

        self.emit('disconnect', removeItem);

    };

    function sockDidEnded() {
        console.log('LOG::SOCKET ENDED');
        var socket = this;
        socket.end();
    };

    function sockDidErrored(e) {
        console.log('LOG::SOCKET ERROR');
        self.emit('error', e);
    };
}
/***
 * only accepts secure connections
 * @param option : {"key":"public key", "cert": "public cert"}
 * @constructor
 */
FxConnection.prototype.FxTLSConnection = function (option){
    //https server only deff need a certificate file.
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
/***
 * once connection data check socket st
 * @param client
 * @param chunk
 * @param self
 * @returns {*}
 */
var findOutSocketConnected = function (client, chunk, self) {
    //var socket = this;
    var request_headers = chunk.toString('utf8');
    var lines = request_headers.split("\r\n");
    // [?=\/] 結尾不包含
    var httpTag = lines[0].toString().match(/^GET (.+)[?=\/] HTTP\/\d\.\d$/i);

    // FLASH SOCKET \0
    var unicodeNull = request_headers.match(/\0/g); // check endpoint
    var swfPolicy = request_headers.match("<policy-file-request/>") == null; // Flash Policy
    var iswebsocket = request_headers.match('websocket') != null; // Websocket Protocol

    //console.log('LOG::Data received: ');

    if (unicodeNull != null && swfPolicy && client.mode != 'ws') {
        console.log('[SOCKET_NET_CONNECTED]:');
        client.mode = fxStatus.flashSocket;

        self.emit('message', client.read(request_headers));

    }else if (iswebsocket) {
        console.log('[WEBSOCKET_CONNECTED]');

        client.mode = 'ws';

        if (typeof httpTag[0] != "undefined") client.namespace = httpTag[1]; // GET stream namespace

        self.emit('connection', client); //

        client.handeshake(chunk);
        // -- WELCOME TO BENSON WEBSOCKET SOCKET SERVER -- //
        client.write(JSON.stringify({"NetStatusEvent": "NetConnect.Success"}));

        return fxStatus.websocket;
    }
    else if (client.mode === fxStatus.websocket)
    {
        console.log('[WEBSOCKET_ROGER]');
        // check is a websocket framing

        var str = client.read(chunk);
        var opcode = client.protocol.opcode;

        console.log("PROTOCOL::", opcode);
    }else
    {
        console.log('[OTHER CONNECTED]');

        if (httpTag.length != 0 && iswebsocket == false)
        {
            client.mode = fxStatus.http;

            self.emit("httpUpgrade", request_headers, client, lines);

            return fxStatus.http;
        }
    }

};

/***
 * 計算使用者數量
 * @returns {*}
 */
FxConnection.prototype.clientsCount = function () {
    if (clients === null) return 0;

    var keys = Object.keys(clients);

    return keys.length;
};

FxConnection.prototype.getClients = function () {
    return clients;
};

module.exports = FxConnection;

// unit test //

//var s = new FxConnection(8080);
//s.FxTLSConnection(null);
//s.on('connection', function (socket) {
//    console.log('clients:',socket.name);
//    console.log(s.clientsCount());
//});
//s.on('message', function (data) {
//    console.log("TRACE",data);
//});
//s.on('disconnect', function (socket) {
//    console.log('disconnect_fxconnect_client.')
//});

