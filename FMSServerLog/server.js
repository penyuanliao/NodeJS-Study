/**
 * Created by benson_liao on 2015/11/10.
 * Flash XMLSocket to NodeJS Net
 */

var port = process.argv[2];

var net = require('net');
var ns = require('./NSServer.js');
var cb = new ns();
var bucket = cb.connect({'path': 'couchbase://127.0.0.1','bucketName': 'default'});

var app = net.createServer(function (socket) {

    socket.setEncoding('utf8');
    console.log('clinet connected. remoteAddress: ', socket.remoteAddress);
    socket.on('end', function () {
        console.log('client disconnected. remoteAddress: ', socket.remoteAddress);
    });
    socket.on('close', function () {
        console.log('close event fired');
    });

    socket.on('data', function (chunk) {

        var data = chunk.toString().match("\\0"); //check endpoint

        console.log(data);
        // check is not flash policy
        if (data != null && chunk.match("<policy-file-request/>") == null)  {
            cb_call(socket, chunk);
            //emit(socket, JSON.stringify({'serverEvent':'connected.successful','data': 'welcome server net socket.'}));
        }else
        {
            socket.end('');
            socket.destroy();
        }
    });

    socket.on('upgrade', function (req, socket, upgradeHead){});

});

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
    }
}
app.on('error', function (e) {
    if(e.code == 'EADDRINUSE') {
        console.log('Address in use, retrying...');
        app.close();
    }
});
app.listen(normalizePort(), function () {
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

console.log(handleConversion.GAME_LOG.get());


function normalizePort()
{
    var _port = port == null ? 80 : port;
    return _port;
}



