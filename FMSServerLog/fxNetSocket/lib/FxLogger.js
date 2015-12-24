/**
 * Created by Benson.Liao on 15/12/21.
 */

var fs = require('fs'),
    util = require('util'),
    exec = require('child_process'),
    log_file = fs.createWriteStream(__dirname + '/'+ formatDate() +'.log',{ flags:'w' });
var logger =  function logger() {

};

logger.prototype.debug = function (d) {
    var time = new Date();
    var st = "[" + time.getFullYear() + "/" + (time.getMonth() + 1) + "/" + time.getDate() + " " + time.getHours() + ":" + time.getMinutes() + "]";
    log_file.write(st + util.format(d) + '\r\n'); // win:\r\n linux:\n mac:\r
    //console.log(st, util.format(d));
};

logger.prototype.pollingWithProcess = function(proc, name, delay) {
    setInterval(function () {

        console.log('loop is running', typeof proc != 'undefined', proc !== null, proc !== "");
        exec.exec('ps -p ' + proc.pid + ' -o rss,pmem,pcpu,vsize,time',function (err, stdout, stderr) {
            err = err || stderr;
            if (!err) {
                logger.instance.debug('[sysInfo] ffmpeg'+ name + '\r\n' + stdout.toString());
                logger.instance.debug('[Nodejs]process.memoryUsage: ' + process.memoryUsage().toString());
            };
        });

        if (typeof proc != 'undefined' && (proc !== null) && proc !== "")
            logger.instance.debug("[Polling] ffmpeg " + name + " process to Working.");
        else
            logger.instance.debug("[Polling] ffmpeg " + name + " process to Shutdown.");
    },delay);
};

function formatDate() {
    var date = new Date();
    return (date.getFullYear() + '_' + (date.getMonth() + 1) + '_' + date.getDate());
};

logger.prototype.logTotalMemoryUsage = function (PIDs) {
    exec.exec("ps -p " + PIDs + " -o pcpu,pmem,vsz,rss | awk '{pcpu += $1; pmem += $2; vsz += $3; rss += $4;} END { print pcpu, pmem, vsz, rss }'", function (err, stdout, stderr) {
        err = err || stderr;
        if (!err) {
            var args = stdout.toString().split(" ");
            console.log("%CPU=" + args[0] + ",%MEM=" + args[1] + ",VSZ=" + args[2] + ",RSS=" + args[3]);
        }
    });
};


/* ************************************************************************
                    SINGLETON CLASS DEFINITION
 ************************************************************************ */

logger.instance = null;

/**
 * Singleton getInstance definition
 * @return singleton class
 */
logger.getInstance = function () {
  if(this.instance === null) {
      this.instance = new logger();
  }
  return this.instance;
};
module.exports = exports = logger.getInstance();