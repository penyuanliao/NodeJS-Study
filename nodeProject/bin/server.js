//------------------------------------------------
var debug = require('debug')('nodePorject:log');

// or extend node.js with this new type
require('enum').register();
//------------------------------------------------

var express = require('express');
var app = express();
var path = require("path");
var __viewsname = path.normalize(__dirname+"/..");
var httpd = require('http').createServer(app);

// socket
var io = require('socket.io')(httpd);

var SOCKET_STATE = new Enum(['connection','disconnect']);
const PORT = 8080;

//HTTP Routing
app.get('/:name/:key', function(req, res){
    //res.send('<h1>Hello World</h1>');
    //res.send(req.params.name+":"+req.params.key);
    var _file = __viewsname + "/views/index.html";

    log("[GET] name:"+req.params.name+",key:"+req.params.key);
    res.sendFile(_file);


});
app.post('/post', function(req, res){

    log("post:", req.query.id);

});
//------------------------------------
// 所有Sockets連線
//------------------------------------
io.sockets.on("connection",function() {

    log("sockets.connection");

});
//io.of("/chat_com").clients(function(error,clients){});

const SOCKET_ROOM = "room1";


// socket.io connection...
var chat = io.of('/chat_com').on('connection', function(client_socket) {


    log('[IO] <chat_com> One user '+ SOCKET_STATE.connection.key);

    client_socket.on('init', function (req) {
        log("init client socket.");
        // 1.JOIN ROOM //
        client_socket.join(SOCKET_ROOM);
        // 2.Send Message //
        chat.to(SOCKET_ROOM).emit('chat message', SOCKET_ROOM + ":hello!!");
    });

    client_socket.emit('chat message',"hello!!");
    //
    client_socket.on('disconnect', function() {
        log('[IO] User on disconnect.');
    });

    client_socket.on('chat message', function(msg){
        log('[IO] Client message:' + msg);
        io.emit('chat message', msg);
    });
    setTimeout(function (){

        log('broadcsted to socket that have join the given room.');

        //_socket.broadcast.emit('chat message',"HI!!");


    }, 5000);
});

io.of('/chat_room2').on('connection', function (_socket) {
    log('[IO] <chat_room2> One user '+ SOCKET_STATE.connection.key);
});

// http listen..
httpd.listen(PORT, function(){
   log('listening on *:'+ PORT);
});



function log(args)
{
    //debug.log = console.info.bind(console);
    debug(args);
}