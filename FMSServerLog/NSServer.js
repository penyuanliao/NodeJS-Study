/**
 * Created by benson_liao on 2015/10/26.
 */
// Adobe FMS communication NodeJS //
// 1. Net.Socket
// 2. HTTP GET/POST

var ns = require('couchbase');

function NSServer() {
    console.log('running ns server.');
}

NSServer.prototype.connect = function (config) {
    cluster = new ns.Cluster(config.path);

    if (cluster == null) {
        console.log( 'cluster is shutdown.' );
    } else {
        console.log('Connect to Couchbase Server');
    }
    console.log(config.bucketName);
    bucket = cluster.openBucket(config.bucketName);
};

NSServer.prototype.get = function (key, block) {
    bucket.get(key, block);
};

NSServer.prototype.insert = function (key, data, block) {
    bucket.upsert(key, data, block);
};

NSServer.prototype.update = function (key, data, block) {
    bucket.replace(key, data, block);
};

NSServer.prototype.delete = function (key, block) {
    bucket.remove(key, block);
};

NSServer.prototype.query = function (views, routes, block) {
    var ViewQuery = ns.ViewQuery;
    var query = ViewQuery.from(views, routes);
    bucket.query(query, block);
}

NSServer.prototype.__defineSetter__('cluster',function(arg){
    cluster = arg;
});
NSServer.prototype.__defineGetter__('cluster', function () {
   return cluster;
});

NSServer.prototype.__defineSetter__('bucket',function(arg){
    bucket = arg;
});
NSServer.prototype.__defineGetter__('bucket', function () {
    return bucket;
});


module.exports = exports = NSServer;