/**
 * Created by benson_liao on 2015/8/31.
 */
$(function() {

    var nickNameList = ["Robbie","Beauty","Scoops","Cocky","Ban","Stonewall","Bucky","Pud","Jocko"];
    // JS Ready //

    var $url = window.location.href;

    var $usernameInput = $('#usernameInput'); // Input for username
    $usernameInput.val(nickNameList[Math.floor(Math.random()*nickNameList.length)]);
    var $currentInput = $usernameInput.focus();

    var userNameButton = $('#userNameButton');
    userNameButton.click(onStartSocketClickHandler);

    var $divOnline = $('#online');

    //io(<Namespace>)

    //Websocket Connect
    var socket = io.connect('http://localhost:3000/channel1',
        {upgrade:false, transports:['websocket']});
    //Polling Connect
    var socket = io.connect('http://localhost:3000/channel1');
//    $('#run').text("test");
    $('form').submit(function() {

        socket.emit('chat message', $('#m').val());

        $('#m').val('');
        return false;
    });



    socket.on('connect', function(_socket){

//        var nickname = socket.handshake.nickname;
//        socket.emit('init',{'room': 'room1', 'name': "nickname"});
        socket.emit('getClients', null);
    });

    socket.on('chat message', function(data){
//        $('#run').text(msg);
        $('#messages').append($('<li>').text(data.username + ":" + data.message));
    });
    /** get Clients count **/
    socket.on('getClients', function (data) {
        $divOnline.text( data );
    })


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
    $joinRoomBtn.click(onClickJoin);

});