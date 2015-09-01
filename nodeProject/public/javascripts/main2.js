/**
 * Created by benson_liao on 2015/8/31.
 */
$(function() {
    // JS Ready //

    var $url = window.location.href;

    var $usernameInput = $('#usernameInput'); // Input for username
    var $currentInput = $usernameInput.focus();

    var userNameButton = $('#userNameButton');
    userNameButton.click(onStartSocketClickHandler);

    //io(<Namespace>)
    var socket = io.connect('http://localhost:3000/channel2');
//    $('#run').text("test");
    $('form').submit(function(){

        socket.emit('chat message', $('#m').val());

        $('#m').val('');
        return false;
    });



    socket.on('connect', function(_socket){

//        var nickname = socket.handshake.nickname;
        socket.emit('init',{'room': 'room1', 'name': "nickname"});

    });

    socket.on('chat message', function(data){
//        $('#run').text(msg);
        $('#messages').append($('<li>').text(data.username + ":" + data.message));
    });


    /** Send NickName **/
    function onStartSocketClickHandler(event)
    {
        //alert("onClickHandler : " + $usernameInput.val());
        socket.emit('addUser',$usernameInput.val());
        $('.addNameForm').remove();
    };

});