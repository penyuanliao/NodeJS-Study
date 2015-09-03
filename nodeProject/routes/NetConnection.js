/**
 * Created by benson_liao on 2015/8/28.
 * Socket against RFC 6455
 * 1. Client送出Request，Request Header裡面會有handshake需要的資訊。如果資訊驗證有問題，Server就會中斷連線
 * 2. Server收到Request後，會送出一個Response Header，讓Client根據裡面的資訊做驗證
 * 3. Client驗證OK，之後就繼續連線，Client可以透過這個連線送資料給Server，Server也可以透過這個連線送資料給Client，任何一方都可以透過這個連線送資料
 * 4. Client驗證有錯，就中斷連線
 */
var io = require('socket.io');
var _server;
var eventEmitter = require('events').EventEmitter;

var emitter = new eventEmitter(); // 自訂事件
var _nsp = [];
// ----------------------------------------------- //
//             Constant Variables                  //
// ----------------------------------------------- //
const SocketEvent = {
    CONNECT: "connection",
    DISCONNECT: "disconnect"
};
NetConnection.prototype.SocketEvent = SocketEvent;
// ----------------------------------------------- //
//                 Model Module                    //
// ----------------------------------------------- //
module.exports = exports = new NetConnection();

/** 連線機制 **/
function NetConnection() {

    console.log("netConnection start");
};
/** 監聽連線 **/
NetConnection.prototype.listenWithServer = function(server) {
    _server = server;
    io = io.listen(server);

    //io.set('transports', ['websocket']);
};
/** 新增新增Path(endPoint) **/
NetConnection.prototype.add = function (path) {
    console.log("add" + path);
    if(_nsp[path] != null) return;
    _nsp[path] = io.of(path).on("connection", connection);

    return _nsp[path];
};
/** 確認是否連線狀態 **/
NetConnection.prototype.onConnect = function (callback) {
    emitter.on(SocketEvent.CONNECT, callback); // addEventlistener
    //emitter.addListener(SocketEvent.CONNECT, callback);
    //emitter.removeListener(SocketEvent.CONNECT,callback);
    return this;
};
/** 確認是否離連線狀態 **/
NetConnection.prototype.onDisconnect = function (callback) {
    emitter.on(SocketEvent.DISCONNECT, callback);
};
/** 成功建立連線 **/
var connection =  function (client_socket) {

    console.log("[Status] NetConnection connected!");

    emitter.emit(SocketEvent.CONNECT, client_socket); // dispatchEvent

    var disconnect = function (client_socket) {
        console.log("[Status] disconnect!");
        getOnlieUsers();
    };
    /** send not add room messages **/
    var sendMessage1 = function(msg) {
        console.info('[Status] Client : %s' , client_socket.username);

        client_socket.nsp.emit('chat message', {
            username:client_socket.username,
            message:msg
        });
    };
    /** add User nickname **/
    var addUserHandle = function (username) {
        client_socket.username = username;
    };
    /** get online clients **/
    var getOnlieUsers = function () {
        console.log("online:" + client_socket.nsp.sockets.length);

        client_socket.nsp.emit('getClients', client_socket.nsp.sockets.length);

    };

    /** Join Room **/
    var joinRoom = function (room) {
        client_socket.join(room);
        client_socket.room = room;
        console.log(client_socket.room);
        client_socket.removeListener('chat message',sendMessage1);
        client_socket.on('chat message',roomSendMessage);
    };

    /** Leave Room **/
    var leaveRoom = function (room) {
        client_socket.leave(room);
        client_socket.room = null;
        client_socket.removeListener('chat message',roomSendMessage);
        client_socket.on('chat message',sendMessage1);
    }

    /** Send Message **/
    var roomSendMessage = function (msg) {
        console.log('[Info]['+ client_socket.room +'] Client message:' + msg);

        client_socket.nsp.to(client_socket.room).emit('chat message', {
            username:client_socket.username,
            message:msg
        });
    };
    //client_socket.nsp.to("room1").emit('chat message', "room1" + ":hello!!");




    client_socket.on('disconnect', disconnect);

    client_socket.on('chat message',sendMessage1);

    client_socket.on('addUser', addUserHandle);

    client_socket.on('joinRoom', joinRoom);

    client_socket.on('leaveRoom', leaveRoom);

    client_socket.on('getClients', getOnlieUsers);

};

