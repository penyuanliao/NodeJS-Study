/**
 * Created by benson_liao on 2015/8/28.
 */
var io = require('socket.io');
var nsp_chat;
var nsp_chat2;
/** assigning different endpoints or paths. **/
module.exports = function (server) {

    console.log("socket start");

    io = io.listen(server);

    nsp_chat = io.of("/channel1").on("connection", connection);
    nsp_chat2 = io.of("/channel2").on("connection", connection);

    return this;
};


var connection =  function (client_socket) {

    console.log("connected!");

    var disconnect = function (client_socket) {
        console.log("disconnect!");
    };

    //var initialize = function (data) {
    //    console.log("init client socket.{name:"+ data.name);
    //    // 1.JOIN ROOM //
    //    client_socket.join("room1");
    //
    //    // 2.Send Message //
    //    nsp_chat.to("room1").emit('chat message', "room1" + ":hello!!");
    //};

    //var sendMessage = function(msg) {
    //    console.log('[IO] Client message:' + msg);
    //    nsp_chat.to("room1").emit('chat message', msg);
    //};

    var sendMessage1 = function(msg) {
        console.log('[IO] Client message2:' + client_socket.nsp);

        client_socket.nsp.emit('chat message', {
            username:client_socket.username,
            message:msg
        });
        //nsp_chat.sockets.forEach(function(entry){
        //    console.log(entry.id);
        //});
        //console.log(t.elapsed());
    };


    var addUserHandle = function (username) {
        client_socket.username = username;
    };

    client_socket.on('disconnect', disconnect);

    //client_socket.on('init', initialize);

    //client_socket.on('chat message',sendMessage);
    client_socket.on('chat message',sendMessage1);


    client_socket.on('addUser', addUserHandle);

};

