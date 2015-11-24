/**
 * Created by benson_liao on 2015/11/20.
 */

var header = require('./Headers.js');

var FxSocket = function(socket)
{
    this.socket = socket;
    socket.name = socket.remoteAddress + "\:" + socket.remotePort;
    this.mode = '';
};

FxSocket.prototype.handeshake = function (chunk) {
    var readHeaders = header.headers.readHeaders(chunk);
    var resHeaders = header.headers.writeHeaders(readHeaders);
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
        return this.protocol['msg'];
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
    var protocol = header.protocols.readFraming(data);
    return protocol;
}

/***
 *
 * @param data
 */
function emit_websocket(data) {
    var payload = new Buffer(data);
    var buffer = header.protocols.writeFraming(true,1,false,payload);
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
module.exports = exports = FxSocket;


