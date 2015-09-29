/**
 * Created by penyuan on 15/9/27.
 */
var io = require('socket.io')();
io.on('connection', function(socket){

    console.log('connected!!!!');


});
io.listen(3000);