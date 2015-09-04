/**
 * Created by benson_liao on 2015/8/28.
 * Socket against RFC 6455
 * 1. Client�e�XRequest�ARequest Header�̭��|��handshake�ݭn����T�C�p�G��T���Ҧ����D�AServer�N�|���_�s�u
 * 2. Server����Request��A�|�e�X�@��Response Header�A��Client�ھڸ̭�����T������
 * 3. Client����OK�A����N�~��s�u�AClient�i�H�z�L�o�ӳs�u�e��Ƶ�Server�AServer�]�i�H�z�L�o�ӳs�u�e��Ƶ�Client�A����@�賣�i�H�z�L�o�ӳs�u�e���
 * 4. Client���Ҧ����A�N���_�s�u
 */
var io = require('socket.io');
var _server;
var eventEmitter = require('events').EventEmitter;

var emitter = new eventEmitter(); // �ۭq�ƥ�
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

/** �s�u���� **/
function NetConnection() {
    console.log("netConnection start");
};
/** ��ť�s�u **/
NetConnection.prototype.listenWithServer = function(server) {
    _server = server;
    io = io.listen(server);

    //io.set('transports', ['websocket']);
    // [xhr-multipart] latest version is disabled.
    //websocket, flashsocket, htmlfile, xhr-polling, jsonp-polling, polling
};
/** �s�W�s�WPath(endPoint) **/
NetConnection.prototype.add = function (path) {
    console.log("add" + path);
    if(_nsp[path] != null) return;
    _nsp[path] = io.of(path).on("connection", connection);

    return _nsp[path];
};
/** �T�{�O�_�s�u���A **/
NetConnection.prototype.onConnect = function (callback) {
    emitter.on(SocketEvent.CONNECT, callback); // addEventlistener
    //emitter.addListener(SocketEvent.CONNECT, callback);
    //emitter.removeListener(SocketEvent.CONNECT,callback);
    return this;
};
/** �T�{�O�_���s�u���A **/
NetConnection.prototype.onDisconnect = function (callback) {
    emitter.on(SocketEvent.DISCONNECT, callback);
};
/** ���\�إ߳s�u **/
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
