/**
 * Created by benson_liao on 2015/11/10.
 * Flash XMLSocket to NodeJS Net
 * http://www.entrylevelprogrammer.com/HexDec/DecBinHexOct.php
 * https://tools.ietf.org/html/rfc6455
 * https://github.com/sitegui/nodejs-websocket/blob/master/Connection.js
 * events.EventEmitter.call(this);
 *
 */

var port = process.argv[2];
var gc_enabled = process.argv[3];
var crypto = require("crypto");
var net = require('net');
var util = require('util');
var events = require('events');
var hr = require('./fxNetSocket/lib/FxParser.js');

util.inherits(this, events.EventEmitter);

var app = net.createServer(function (socket) {

    console.log('LOG:: clinet connected. remoteAddress: ', socket.remoteAddress);

    socket.on('data', function (chunk) {
        var request_headers = chunk.toString('utf8');
        //console.log('data received: ' , request_headers);
        var data = request_headers.toString().match("\\0"); //check endpoint
        // check is not flash policy

        if (data != null && request_headers.match("<policy-file-request/>") == null && socket.connectType !== 'ws')  {
            console.log('[SOCKET_NET_CONNECTED]:', chunk);
            cb_call(socket, chunk);
            //emit(socket, JSON.stringify({'serverEvent':'connected.successful','data': 'welcome server net socket.'}));

        } else if (request_headers.match('websocket') != null) {
            console.log('[WEBSOCKET_CONNECTED]');

            var readHeaders = hr.headers.readHeaders(chunk);
            var resHeaders = hr.headers.writeHeaders(readHeaders);

            handeshake(socket, resHeaders);

            emit_websocket(socket, "-- WELCOME TO BENSON SOCKET SERVER --");
            socket.connectType = 'ws';
        }
        else
        {
            console.log('[WEBSOCKET_ROGER]');

            var protocol = hr.protocols.readFraming(chunk);

            console.log("LOG ",protocol);


            var message = chunk;
            var start = 2 ;

            // |        0 1 2 3      |   4  |   5  |   6  |  7   | One-byte
            // |         OP CODE     | RSV3 | RSV2 | RSV1 | FIN  | Base Framing
            // |            4        |   1  |   1  |   1  |  1   | Bit
            // |        1,2,4,8      |  16  |  32  |  64  | 128  | Decimal
            // | 0x01 0x02 0x04 0x08 | 0x10 | 0x20 | 0x40 | 0x80 | Hex

            var FIN = ((message[0] & 0x80) == 0x80 ? 1 : 0);
            var RSV1 = ((message[0] & 0x40) == 0x40 ? 1 : 0);
            var RSV2 = ((message[0] & 0x20) == 0x20 ? 1 : 0);
            var RSV3 = ((message[0] & 0x10) == 0x10 ? 1 : 0);
            var Opcode = message[0] & 0x0F;

            // |   0  |  1  |  2  |  3  |  4  |  5  |  6  |  7   | One-byte
            // |               Payload Len                | MASK | Base Framing
            // |                    7                     |  01  | Bit
            // |             1,2,4,8,16,32,64             | 128  | Decimal
            // |    0x01 0x02 0x04 0x08 0x10 0x20 0x40    | 0x80 | Hex

            var mask = (message[1] & 0x80);
            var length = (message[1] & 0x7F); // 127 = 0x7F

            start = (mask === 1) ? 6 : 2;

            // | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | Two-byte
            // |                    if payload len==126/127                    | Base Framing
            // |                                  16                           | Bit
            // |     1,2,4,6,8,32,64,128,256,512,1024,2048,4096...65536        | Decimal

            if ( length === 0x7E ) //126
            {
                length = message.readUInt16BE(2);
                start += 2;
            }
            if ( length === 0x7F ) //127
            {
                // 3 ~ 6bytes + 7 ~ 10 Byte (1byte = 8bit = 32/8 = Offset + 4 )
                length = message.readUInt32BE(2) * Math.pow(2,32) + message.readUInt32BE(6);
                start += 8; // payload length 8 bytes
            }
            var payload = message.slice(start, start + length);


            var buff = new Buffer(message[0], 'utf8'); //no sure about this
            console.log("FIN:%s ", (message[0] >> 4) );
            console.log("FIN:", FIN,RSV1,RSV2,RSV3,Opcode, mask, length, message[1] % 128);

            return;

            //socket.destroy();
        }
    });


    socket.on('readable', function () {
        console.log('{NET_SOCKET_READABLE}');
    });


});




app.on('connection', function (socket) {
    console.log('Clinet Connection');

    socket.on('data',   sockDidData);
    socket.on('close',  sockDidClosed);
    socket.on('end',    sockDidEnded);
    socket.on('error',  sockDidErrored);
});


function sockDidData(data) {
    var socket = this;
    console.log("DATA::",data);
}


function sockDidClosed() {
    console.log('[DEBUG] Disconnect');
};

function sockDidEnded() {
    var socket = this;
    console.log('LOG:: client disconnected. remoteAddress: ', socket.remoteAddress);
}
function sockDidErrored(e) {
    console.log('ERROR::', e);
}
function emit_xmlSocket(socket, data) {
    socket.write(data);
    socket.write('\0');
}
function emit_socket(socket, data) {
    socket.write(data);
}
function emit_websocket(socket, data) {
    var payload = new Buffer(data);
    var buffer = generateMetaData(true,1,false,payload);
    socket.write(Buffer.concat([buffer, payload], buffer.length + payload.length));
}
function handeshake(socket, data) {
    socket.write(data);
}








function emit(socket, data) {

    socket.write(data);
    socket.write('\0');
}

function cb_call(socket, data) {

    console.log(data);
    var _data = data.toString();
    // Socket 字尾終結符號\0過濾
    var trim = _data.substring(0,_data.replace(/\0/g, '').length );
    var evt = JSON.parse(trim);
    if (evt.cmd == 'getCBTest') {
        cb.get('testcase', function (err, result) {
            console.log(result);
            emit(socket, JSON.stringify({'cmd':'getCBTest','data':result}));
        });
    }else if (evt.cmd == "sysinfo")
    {
        cb.insert((new Date()).toString(), JSON.stringify(evt.data), function (err, result) {
            emit(socket, JSON.stringify({'cmd':'sysinfo','data':'true'}));
        });
    }
}
app.on('error', function (e) {
    if(e.code == 'EADDRINUSE') {
        console.log('Address in use, retrying...');
        app.close();
    }
});
var server = app.listen(normalizePort(), function () {
    console.log('Listening on ' + app.address().port);
});


const handleConversion = {
    'gameLog.testcase' : function () {
        console.log('testcase');
    },
    'gameLog.write' : {

    },
    'GAME_LOG':{
        'send': function () {
            console.log('send');
        },
        'get':function(){
            console.log('get');

        }
    }
};

function normalizePort()
{
    var _port = port == null ? 80 : port;
    return _port;
}
function handleDataStat(data) {
    var dataIndex = 2;
    var secondByte = [1];
    var hasMask = secondByte >= 128;
    secondByte -= hasMask ? 128 : 0;

    var dataLength, maskedData;
    var stat;
    if (secondByte == 126) {
        dataIndex += 2;
        dataLength = data.readUInt16BE(2);
    } else if (secondByte == 127) {
        dataIndex += 8;
        dataLength = data.readUInt32BE(2) + data.readUInt32BE(6);
    } else {
        dataLength = secondByte;
    }

    if (hasMask) {
        maskedData = data.slice(dataIndex, dataIndex + 4);
        dataIndex += 4;
    }
    if (dataLength > 10240) {
        this.send("Warning : data limit 10kb");
    } else {
        //计算到此处时，dataIndex为数据位的起始位置，dataLength为数据长度，maskedData为二进制的解密数据
        stat = {
            index: dataIndex,
            totalLength: dataLength,
            length: dataLength,
            maskedData: maskedData,
            opcode: parseInt(data[0].toString(16).split("")[1], 16) //获取第一个字节的opcode位
        };
    }
    return stat;
}


function generateMetaData(fin, opcode, masked, payload) {
    var len, meta, start, mask, i;

    len = payload.length;

    // Creates the buffer for meta-data
    meta = new Buffer(2 + (len < 126 ? 0 : (len < 65536 ? 2 : 8)) + (masked ? 4 : 0));

    // Sets fin and opcode
    meta[0] = (fin ? 128 : 0) + opcode;

    // Sets the mask and length
    meta[1] = masked ? 128 : 0;
    start = 2;
    if (len < 126) {
        meta[1] += len;
    } else if (len < 65536) {
        meta[1] += 126;
        meta.writeUInt16BE(len, 2);
        start += 2
    } else {
        // Warning: JS doesn't support integers greater than 2^53
        meta[1] += 127;
        meta.writeUInt32BE(Math.floor(len / Math.pow(2, 32)), 2);
        meta.writeUInt32BE(len % Math.pow(2, 32), 6);
        start += 8;
    }

    // Set the mask-key
    if (masked) {
        mask = new Buffer(4);
        for (i = 0; i < 4; i++) {
            meta[start + i] = mask[i] = Math.floor(Math.random() * 256);
        }
        for (i = 0; i < payload.length; i++) {
            payload[i] ^= mask[i % 4];
        }
        start += 4;
    }

    return meta;
}

function writeFrameHeader(protocol) {
    const header_byte = 2;
    var meta, len;
    var index = protocol.start ;
    len = payload.length;
    // bytes 2:65536 3:16777216
    meta = new Buffer(header_byte + (len < 126 ? 0 : (len < 65536 ? 2 : 8)) + (masked ? 4 : 0));

    //fin=1, opcode=1, bytecode=10000001;
    //fin=1, opcode=1, bytecode=20000001;
    meta[0] = protocol.fin ? 128 : 0 + protocol.opcode;

    // byte 2 | payload length (7) | mask (1) |
    meta[1] = protocol.mask ? 128: 0;

    if (len < 126) {
        // 0 ~ 125 bytes
        meta[1] += len;
    } else if (len < 65536) {
        // 126 ~ 65535 bytes
        meta[1] += 126;
        meta.writeUInt16BE(len,2);
        index += 2;
    } else {
        // 會以「111 1111」即「127」表示，並指示下八個 bytes 才載有實際的內容長度
        meta[1] += 127;
        meta.writeUInt32BE(0, 2);
        // js not support integers max 2^53
        //Math.pow(2, 32) = 4294967295 = 2^32
        meta.writeInt32BE(len & 4294967295);
        index += 8;
    }
    // client send need!!!
    if (masked) {
        //mask = new Buffer(4)
        //for (i = 0; i < 4; i++) {
        //    meta[start + i] = mask[i] = Math.floor(Math.random() * 256)
        //}
        //for (i = 0; i < payload.length; i++) {
        //    payload[i] ^= mask[i % 4]
        //}
        //start += 4
    }

    return meta;
}

function getMessage(data){
    var protocol = getProtocol(data);
    var bufLen = data.length - protocol.start;
    protocol.data = data.slice(bufLen);




    var buffer = new Buffer(bufLen);
    for (var i = 6, j = 0, k = 1; i < data.length; i++, j++, k++) {
        buffer[j] = data[i] ^ protocol.mask_key[k % 4];
        console.log(buffer);
    };
    protocol.len = protocol.len - bufLen; // 考虑分配情况，需要减去上次计算的数据长度
    protocol.start = 0; // 后面分片的数据开始未知为0
    protocol.msg += buffer.toString(); // msg的拼接
    console.log(buffer.toString());
    console.log(protocol.msg);
}
function getProtocol(data) {
    var protocol = {start:2, msg:''};
    function getOneBit(data, hex)
    {
        return (data & hex) == hex ? 1 : 0;
    };
    protocol.fin = getOneBit(data[0], 0x80);
    protocol.rsv1 = getOneBit(data[0], 0x40);
    protocol.rsv2 = getOneBit(data[0], 0x20);
    protocol.rsv3 = getOneBit(data[0], 0x10);
    protocol.opcode = data[0] & 0x0f;
    protocol.mask = getOneBit(data[1], 0x80);
    protocol.payload_len = data[1] & 0x7f;
    console.log(protocol);
    if(protocol.payload_len >= 0 && protocol.payload_len <= 125){
        protocol.len = protocol.payload_len; // 就是他自己
    }else if(protocol.payload_len == 126){
        protocol.start += 2;
        protocol.len = (data[2] << 8) + data[3]; // 后16位，2字节
    }else if(protocol.payload_len == 127){
        if(data[2] != 0 || data[3] != 0 || data[4] != 0 || data[5] != 0){ // 头4个字节必须为0
            return false;
        }
        protocol.start += 8;
        protocol.len = data.readUInt32BE(6);  // 后64位，8字节，仅支持后面4字节(4GB已经足够了。。。)
    }else{
        return false;
    }
    if(protocol.mask){
        protocol.mask_key = data.slice(protocol.start, protocol.start + 4);
        protocol.start += 4; // 去除mask key 本身的4字节长度
    }else{ // 必须有mask key
        return false;
    }

    return protocol;
}




function sendError(socket) {
    socket.write("HTTP/1.1 404 Error \n");
    socket.write("Connection: close \n");
    socket.write("\n");
    socket.write("<html> \n");
    socket.write("<body> \n");
    socket.write("<head><title>An Example Page</title></head>\n")
    socket.write("What's going on? \n");
    socket.write("</body> \n");
    socket.write("</html> \n");

    socket.end('');
}







// Print GC events to stdout for one minute.
var v8 = require('v8');
//v8.setFlagsFromString('--print_opt_code');

if (gc_enabled == 1) {
    console.log("compact ",v8.setFlagsFromString('--always_compact'));
    console.log("expose gc ",v8.setFlagsFromString('--expose_gc'));

}
{
    v8.setFlagsFromString("--max_old_space_size=8192");
    //v8.setFlagsFromString('--max_new_space_size=-2048')
}
