/**
 * Created by Benson.Liao on 2015/11/20.
 */

var parser = require('./FxParser.js');

/***
 * Custom net socket connection
 * @param socket : net.socket
 * @constructor
 */
var FxSocket = function(socket)
{
    /* Variables */
    this.socket = socket;
    this.isConnect = false;
    socket.name = socket.remoteAddress + "\:" + socket.remotePort;
    this.mode = '';

};

var NSLog = function (type, str) {
    var status = "";
    if (type == 1) status = "INFO::";
    if (type == 2) status = "Debug::";

    console.log(status, str);
};


FxSocket.prototype.handeshake = function (chunk) {
    var readHeaders = parser.headers.readHeaders(chunk);
    var resHeaders = parser.headers.writeHandshake(readHeaders);
    this.socket.write(resHeaders);
};

FxSocket.prototype.write = function (data) {
    if (this.mode === 'ws') {
        this.socket.write(emit_websocket(data));
    }else if (this.mode === 'flashsocket') {
        //emit_flashsocket(data);
    }

};

FxSocket.prototype.read = function (data) {

    if (this.mode === 'flashsocket') return read_flashsocket(data);
    if (this.mode === 'ws') {
        this.protocol = read_websocket(data);

        var opcode = this.protocol.opcode;

        NSLog(1,'ws-opcode: ' + this.protocol.opcode );

        var obj = {opcode:opcode};

        if (opcode === 1){
            obj.msg = this.protocol['msg']
        }else if (opcode === 2){
            obj.msg = this.protocol['msg'].toString('utf8');
        }else if (opcode === 8){
            // 0x8 denotes a connection close
            obj.msg = "close";
        }
        // opcode 0x01 Text
        // opcode 0x02 ByteArray
        // opcode 0x08 frame client destory ws
        // TODO opcode 0x09 frame Pring control frame
        // TODO opcode 0x0A frame Pong control frame

        return obj;
    }
};

FxSocket.prototype.writeByteArray = function(data) {
    //TODO Writed Array Buffer
};
FxSocket.prototype.readByteArray = function(data) {
    //TODO Readed Array Buffer
};

FxSocket.prototype.close = function () {
    this.socket.destroy();
};

function read_flashsocket(data) {
    var _data = data.toString();
    // Socket 字尾終結符號\0過濾
    var trim = _data.substring(0,_data.replace(/\0/g, '').length );
    var evt = JSON.parse(trim);
    return evt;

};

function read_websocket(data) {
    var protocol = parser.protocols.readFraming(data);
    return protocol;
}

/***
 *
 * @param data
 */
function emit_websocket(data) {
    var payload = new Buffer(data);
    var buffer = parser.protocols.writeFraming(true,1,false,payload);
    return Buffer.concat([buffer, payload], buffer.length + payload.length);
};

//FxSocket.prototype = {
//    get name() {
//        return this.socket.name;
//    },
//    set name(val) {
//        if (this.socket != null)
//            this.socket.name = val;
//    }
//};

FxSocket.prototype.__defineGetter__("name", function () {
    return this.socket.name;
});
FxSocket.prototype.__defineSetter__("name", function (name) {
    this.socket.name = name;
});

FxSocket.prototype.__defineGetter__("mode", function () {
    return this.socket.mode;
});
FxSocket.prototype.__defineSetter__("mode", function (mode) {
    this.socket.mode = mode;
});

FxSocket.prototype.__defineGetter__("namespace", function () {
    return this.socket.namespace;
});
FxSocket.prototype.__defineSetter__("namespace", function (namespace) {
    this.socket.namespace = namespace;
});

module.exports = exports = FxSocket;


