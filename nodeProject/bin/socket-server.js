//------------------------------------------------
var debug = require('debug')('nodeProject:log');
//------------------------------------------------

var express = require('express');
var app = express();
var path = require("path");
var __viewsname = path.normalize(__dirname+"/..");
var httpd = require('http').createServer(app);
//var socket = require('../routes/sockets')(httpd);

//===============================================================//
//                           Socket.io                           //
//===============================================================//
var netConnection = require('../routes/NetConnection'); // 1.require class method
netConnection.listenWithServer(httpd); // register listen server
var chat1 = netConnection.add("/channel1"); // add socket path one
var chat2 = netConnection.add("/channel2"); // add socket path two

netConnection.onConnect(function(client_socket){  });

chat1.on("connection",function(client){ }); // addEventLister

//---------------------------------------------------------------

// only serve static files from
app.use(express.static(__viewsname + '/public/javascripts'));

app.use("/css", express.static(__viewsname + '/public/stylesheets'));

//---------------------------------------------------------------

console.log("socket-server:start");
app.get('/', function(req, res){
    var _file = __viewsname + "/views/channel.html";
    res.sendFile(_file);
});

app.get('/socket/channel1', function(req, res){

    var _file = __viewsname + "/views/channel.html";
    res.sendFile(_file);

});
app.get('/socket/channel2', function(req, res){

    var _file = __viewsname + "/views/channel2.html";
    res.sendFile(_file);

});

// http listen..
httpd.listen(3000, function(){
    console.log('listening on *:'+ 3000);
});
