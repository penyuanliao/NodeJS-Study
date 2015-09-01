/**
 * Created by benson_liao on 2015/8/28.
 */

var Timer = function () {
    function Timer(init, precision) {
        var start = time = new Date(init || null).valueOf(),
            precision = precision || 100;

        setInterval(function () { time += precision; }, precision);

        this.elapsed = function() { return time - start; };
        this.getDate = function() { return new Date(time); };
    };
};



module.exports = Timer;
