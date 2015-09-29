/**
 * Created by benson_liao on 2015/8/31.
 *
 */
$(function() {

    var $url = window.location.href;
    var nickNameList = ["Robbie","Beauty","Scoops","Cocky","Ban","Stonewall","Bucky","Pud","Jocko"];
    // JS Ready //

    var $usernameInput = $('#usernameInput'); // Input for username
    $usernameInput.val(nickNameList[Math.floor(Math.random()*nickNameList.length)]);
    var $currentInput = $usernameInput.focus();

    var userNameButton = $('#userNameButton');
    userNameButton.click(onStartSocketClickHandler);

    var $divOnline = $('#online');

    //io(<Namespace>)

    // ---- Websocket Connect ---- //

    var socket = io.connect('http://127.0.0.1:8080/channel1',
        {upgrade:false, transports:['websocket']});
    // ---- Polling Connect ---- //
    //var socket = io.connect('http://192.168.152.233:3000/channel1');

    $('form').submit(function() {

        socket.emit('chat message', $('#m').val());

        $('#m').val('');
        return false;
    });
    /** client connect **/
    socket.on('connect', function(_socket){

//        var nickname = socket.handshake.nickname;
//        socket.emit('init',{'room': 'room1', 'name': "nickname"});
        socket.emit('getClients', null);
    });

    socket.on('chat message', function(data){
//        $('#run').text(msg);
//        $('#messages').append($('<li>').text(data.username + ":" + data.message));

        /** push message **/
        if ($usernameInput.val() == data.username)
            $('#messages2').append($('<div class="from-me">').append($('<p>').text(data.message)));
        else
            $('#messages2').append($('<div class="from-them">').append($('<p>').text(data.username + ":" + data.message)));

        $('#messages2').append('<div class="clear">');
    });
    /** get Clients count **/
    socket.on('getClients', function (data) {
        $divOnline.text( data );
    });


    /** Send NickName **/
    function onStartSocketClickHandler(event)
    {
        //alert("onClickHandler : " + $usernameInput.val());
        socket.emit('addUser',$usernameInput.val());
        $('.addNameForm').remove();
    };


    /** Join Room **/
    var $joinRoomTxt = $('#roomInput');
    var $joinRoomBtn = $('#joinRoomButton');
    function onClickJoin() {
        socket.emit('joinRoom', $joinRoomTxt.val());
        $joinRoomTxt.prop('disabled', true);
        $joinRoomBtn.text('Leave');
        $joinRoomBtn.unbind("click", onClickJoin);
        $joinRoomBtn.click(onClickLeave);
    };
    function onClickLeave() {
        socket.emit('leaveRoom',$joinRoomTxt.val());
        $joinRoomTxt.prop('disabled', false);
        $joinRoomBtn.text('Join');
        $joinRoomBtn.unbind("click", onClickLeave);
        $joinRoomBtn.click(onClickJoin);
    };

    /** **/
    function initialize() {
        $joinRoomBtn.click(onClickJoin);
    }

    initialize();
});