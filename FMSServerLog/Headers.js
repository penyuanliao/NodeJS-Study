/**
 * Created by benson_liao on 2015/11/17.
 */

var crypto = require("crypto");

function Headers(){
    this.name = 'Headers';

}
/*
 GET ws://127.0.0.1:8080/ HTTP/1.1 \r\n
 Host: 127.0.0.1:8080\r\n
 Connection: Upgrade\r\n
 Pragma: no-cache\r\n
 Cache-Control: no-cache\r\n
 Upgrade: websocket\r\n
 Origin: http://localhost:53044\r\n
 Sec-WebSocket-Version: 13\r\n
 User-Agent: Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/46.0.2490.86\r\n Safari/537.36\r\n
 Accept-Encoding: gzip, deflate, sdch
 Accept-Language: zh-TW,zh;q=0.8,en-US;q=0.6,en;q=0.4,zh-CN;q=0.2\r\n
 Sec-WebSocket-Key: n8mj9pZt/h5Nkyl6Tos2LA==\r\n
 Sec-WebSocket-Extensions: permessage-deflate; client_max_window_bits\r\n
 \r\n\r\n
 */

Headers.prototype.readHeaders = function (chunk) {
    var data = chunk.toString('utf8');
    var lines = data.split("\r\n");
    var headers = {};
    var i = lines.length;

    if (lines.length === 1) return false;

    //Check is GET HTTP 1.1
    var reqMethod = lines[0].toString().match(/^GET (.+) HTTP\/\d\.\d$/i);

    if (lines == null) return false;

    //for (var i = 0; i < lines.length; i++) {
    //    var _value = lines[i].split(": ");
    //    headers[_value[0]] = _value[1];
    //};

    while(--i > 0) {

        if (lines[i] === null | lines[i] === '') continue;

        var  match = lines[i].toString().match(/^([a-z-A-Z-]+): (.+)/i);

        if (match === null) continue;

        headers[match[1].toLowerCase()] = match[2];
    };
    console.log(this.name);
    return headers;
};
Headers.prototype.writeHeaders = function (reqHeaders) {


    var sKey = crypto.createHash("sha1").update(reqHeaders["sec-websocket-key"] + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11").digest("base64");
    var resHeaders = [
        'HTTP/1.1 101 Switching Protocols',
        'Upgrade: websocket',
        'Connection: Upgrade',
        'Sec-WebSocket-Accept: ' + sKey,
        'Sec-WebSocket-Origin: ' + reqHeaders['Origin'],
        'Sec-WebSocket-Location: ' + reqHeaders['Origin']
    ];
    return resHeaders.join("\r\n") + "\r\n\r\n";
};

// ---------------------------------------------------------------------

function Protocols()
{
    this.INT32_MAX_VALUE =  Math.pow(2,32);
}

Protocols.prototype.readFraming = function (buffer) {
    var part = buffer[0],
        header_part,
        hasMask,
        len,i;
    var protocol = { 'start': 2, 'msg': '' };
    header_part = part >> 4; //前四位是opcode |0|0|0|1| = 8
    if(header_part % 8 ) {
        // rsv1, rsv2,rsv3 必須被清除
        return false;
    };

    protocol.fin = (header_part === 8);
    protocol.rsv1   = 0;
    protocol.rsv2   = 0;
    protocol.rsv3   = 0;

    protocol.opcode = part % 16; // opcode max 0xf

    if (protocol.opcode !== 0 && protocol.opcode !== 1 &&
        protocol.opcode !== 2 && protocol.opcode !== 8 &&
        protocol.opcode !== 9 && protocol.opcode !== 10 ) {
        // Invalid opcode
        return false;
    }

    if (protocol.opcode >= 8 && !protocol.fin) {
        // Control frames must not be fragmented
        return false;
    }

    part = buffer[1]; // mask, payload len info
    hasMask = part >> 7;

    len = part % 128; //  if 0-125, that is the payload length

    protocol.start = hasMask ? 6 : 2;


    if (buffer.length < protocol.start + len)
    {
        return;// Not enough data in the buffer
    }

    // Get the actual payload length // 1-7bit = 127
    if (len === 126)  {

        len = buffer.readUInt16BE(2); // a 16-bit unsigned integer
        protocol.start += 2; // If 126, the following 2 bytes interpreted as a 16-bit unsigned integer;
    }else if (len === 127) {
        // Warning: JS can only store up to 2^53 in its number format
        len = buffer.readUInt32BE(2) * this.INT32_MAX_VALUE + buffer.readUInt32BE(6);
        protocol.start += 8; // If 127, the following 8 bytes interpreted as a 64-bit unsigned integer;
    }

    if (buffer.length < protocol.start + len) return;

    // Extract the payload
    protocol.payload = buffer.slice(protocol.start, protocol.start+len);

    if (hasMask) {
        // if mask start is masking-key,but be init set start 6 so need -4
        // frame-masking-key : 4( %x00-FF )
        protocol.mask = buffer.slice(protocol.start - 4, protocol.start);
        for (i = 0; i < protocol.payload.length; i++) {
            // j = i MOD 4 //
            // transformed-octet-i = original-octet-i XOR masking-key-octet-j //
            protocol.payload[i] ^= protocol.mask[i % 4];　// [RFC-6455 Page-32] XOR
        }
    }
    //set final buffer size
    buffer = buffer.slice(protocol.start + len);
    protocol.msg = protocol.payload.toString();
    //console.log(protocol.msg);
    // Proceeds to frame processing
    return protocol;
};

Protocols.prototype.writeFraming = function (fin, opcode, masked, payload) {
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
        meta.writeUInt32BE(Math.floor(len / this.INT32_MAX_VALUE), 2);
        meta.writeUInt32BE(len % this.INT32_MAX_VALUE, 6);
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
};



module.exports = exports = {'headers':new Headers(),'protocols':new Protocols()}