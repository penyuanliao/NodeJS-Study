/**
 * Created by benson_liao on 2015/9/8.
 */
var WebSocketServer = require('ws').Server
    , wss = new WebSocketServer({ port: 8080 });

wss.on('connection', function connection(ws) {
    ws.on('message', function incoming(message) {
        console.log('received: %s %s', message, timer.elapsed());
    });
    console.log('server connect :%d',wss.clients.length);
    ws.send('something');
});
var timer;timer = require('../routes/Timer');
// --------------------------------------------------- //
// ---------------------- Client --------------------- //
// --------------------------------------------------- //
var i = 0;
var connect = 0;

var cb = function(){
    connect++;
    if (i < 10) {
        i++;
        start(cb);
    }
}

console.log(cc);
start(cb);
function start(callback){
    setTimeout(function(){
        var _websocket = require('ws');
        var _ws = new _websocket('ws://127.0.0.1:8080/path',{
            protocolVersion: 8,
            origin: 'http://127.0.0.1'
        });
        _ws.on('open', function open() {


            //_ws.send(Date.now().toString(), {mask: true});
        });
        callback();
    },100);
}
//
//var server = require('http').createServer();
//var url = require('url');
//var websocketserver = require('ws').Server;
//var ws = new websocketserver({server:server});
//var experss = require('express');
//var app = experss();
//var port = 8000;
//app.use(function (req, res) {
//    res.send({msg:'hello'});
//});
//
//ws.on('connection', function connection(ws) {
//   var location = url.parse(ws.upgradeReq.uri, true);
//    ws.on('message', function incoming(msg) {
//        console.log('received: %s', msg);
//    });
//    ws.send('something.');
//});
//server.on('request', app);
//server.listen(port, function () {
//    console.log('Listening on ' + server.address().port);
//});