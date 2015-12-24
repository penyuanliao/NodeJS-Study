/**
 * Created by penyuan on 15/12/9.
 */

var fxNetSocket = require('./fxNetSocket');
var FxConnection = fxNetSocket.netConnection;
var outputStream = fxNetSocket.stdoutStream;
var parser = fxNetSocket.parser;
var utilities = fxNetSocket.utilities;
var logger = fxNetSocket.logger;
var fs = require('fs');
require('events');
var configure = appParames();
/** 所有視訊stream物件 **/
var liveStreams = {};

/** createLiveStreams **/
createLiveStreams(configure.fileName);
utilities.autoReleaseGC(); //** 手動 1 sec gc
var srv = new FxConnection(configure.port);
srv.on('connection', function (socket) {
    console.log('clients:',socket.name);
    //console.log(s.getClients());

});

srv.on('message', function (data) {
    console.log('message :',data);
});
srv.on('disconnect', function (socket) {
    console.log('disconnect_fxconnect_client.');
    //socket.removeListener('connection', callback);
});

srv.on('httpUpgrade', function (req, client, head) {

    console.log('## upgrade ##');

    var _get = head[0].split(" ");

    var socket = client.socket;

    if (_get[1] === "/") {

        fs.readFile('public/views/broadwayPlayer.html', function (err, data) {
            successfulHeader(200, socket, "html");
            socket.write(data);

            client.close();
        });
    }
    else if (_get[1] === "/favicon.ico") {
        failureHeader(404, socket, "ico");
        client.close();
    }
    else
    {
        successfulHeader(200, socket, "js");
        var fsstream = fs.createReadStream("public" + _get[1], {bufferSize: 1024 * 300, end:false});
        var fileLength = 0;
        fsstream.pipe(socket);

        fsstream.on('data', function (chunk) {
            fileLength += chunk.length;
        });
        fsstream.on('end', function () {
            //var file = Buffer.concat(list).toString();
            console.log("%s file size : %d kb",_get[1],fileLength/1024);
            //socket.write("content-length:%d\r\n", fileLength);

            //client.close();

        });
        fsstream.on('error', function (err) {
            console.log('fsStream error:', err);
        });

    }

});

function successfulHeader(code, socket, type) {

    var contentType = type === 'js' ? "application/javascript" : "text/html";

    var headers = parser.headers.responseHeader(code, {
        "Host": srv.app.address().address,
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Connection": "Keep-Alive",
        "Keep-Alive": "timeout=3, max=10",
        "Access-Control-Allow-Origin": "*",
        "Content-Type": contentType
    });

    //socket.write("Content-Security-Policy: default-src 'self'; img-src *;object-src 'self' http://127.0.0.1; script-src 'self' http://127.0.0.1;\n");
    socket.write(headers);
};
function failureHeader(code, socket) {

    var headers = parser.headers.responseHeader(code, {
        "Connection": "close" });
    socket.write(headers);

}

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

function createLiveStreams() {
    var sn = configure.fileName;
    var spawned,_name;
    for (var i = 0; i < sn.length; i++) {
        // schema 2, domain 3, port 5, path 6,last path 7, file 8, querystring 9, hash 12
        _name = sn[i].toString().match(/^((rtmp[s]?):\/)?\/?([^:\/\s]+)(:([^\/]*))?((\/\w+)*\/)([\w\-\.]+[^#?\s]+)(\?([^#]*))?(#(.*))?$/i);
        if (typeof  _name[7] != 'undefined') {
            spawned = liveStreams[_name[7]] = new outputStream(sn[i]);
            spawned.name = _name[7];
            spawned.on('streamData', swpanedUpdate);
            spawned = null;
        }else {
            throw "create Live Stream path error." + sn[i];
        }

    };


    setInterval(observerTotoalUseMem,10000); // testing code
};
// 重啟stream
function rebootStream(streamName) {
    if (spawned.running == false) {
        spawned = new outputStream(streamName);
        spawned.on('streamData', swpanedUpdate);
    }
}
// ffmpeg stream pull the data of a base64
function swpanedUpdate(base64) {

    var swpanName = this.name;

    var clients = srv.getClients();
    var keys = Object.keys(clients);
    if (keys.length == 0) return;

    for (var i = 0 ; i < keys.length; i++) {
        var socket = clients[keys[i]];
        if (socket.isConnect == true) {
            if (socket.namespace === swpanName)
                socket.write(JSON.stringify({"NetStreamEvent":"NetStreamData",data:base64}));
        }

    }

    keys = null;
}
/** 觀察記憶體使用狀況 **/
function observerTotoalUseMem() {

    var keys = Object.keys(liveStreams);
    var pids = [];
    keys.asyncEach(function(element, resume) {
        resume();
        pids.push(liveStreams[element].ffmpeg.pid);
    }, function() {
        console.log('complete');
        logger.logTotalMemoryUsage(pids);
    });

}

process.on('uncaughtException', function (err) {
    console.error(err.stack);
});

function appParames(){
    var args = {};
    process.argv.forEach(function(element, index, arr) {
        // Processing

        if (element === "-p") {
            var port = parseInt(process.argv[index + 1]);

            args["port"] = !isNaN(port) ? port : 8080;
        }else if (element === "-f") {
            var fileName = process.argv[index + 1];
            if (!fileName && typeof fileName != "undefined" && fileName !=0) {
                fileName = "";
                throw "fileName no definition.";
            }
            args["fileName"] = fileName.split(" ");
        }

    });

    return args;
}


//


