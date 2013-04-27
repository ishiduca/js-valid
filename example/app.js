#!/usr/bin/env node
var path = require('path');
var http = require('http');
var url  = require('url');
var fs   = require('fs');
var schemas   = require(path.join( __dirname, './public/js/schemas'));
var Validator = require(path.join( __dirname, './public/js/js-valid/index')).Validator;

var onError = function (res, pathname) {
    var is404 = {
        error: 404
      , name: 'not found'
      , message: pathname + ' - not found'
    };

    res.writeHead(404, {'content-type': 'application/json'});
    res.end(JSON.stringify(is404));

    console.error(is404);
};
var sendfile = function (res, filepath, pathname) {
    fs.createReadStream(filepath)
    .on('error', function (err) {
        onError(res, pathname || filepath);
        console.log(e);
    })
    .once('data', function () {
        var ext = /.\.js$/.test(filepath) ? 'text/javascript' : 'text/html';
        res.writeHead(200, {'content-type': ext});
    })
    .once('end', function () {
        console.log('sendfile "%s" -> "%s"', pathname, filepath);
    })
    .pipe(res);
};


var r = {
    routes: {
        get: {}
      , post: {}
    }
  , statics: [ '/js/' ]
};

('get post').split(' ').forEach(function (method) {
    r[method] = function (pathname, cb) {
        r.routes[method][pathname] = cb;
    };
});
//r.get = function (pathname, cb) {
//    this.routes.get[pathname] = cb;
//};
//r.post = function (pathname, cb) {
//    this.routes.post[pathname] = cb;
//};
r.route = function (res, method, pathname, data) {
    if (this.statics.some(function (staticDir) {
        return pathname.slice(0, staticDir.length) === staticDir;
    }))
        return sendfile( res
          , path.join(__dirname, 'public', pathname)
          , pathname);

    if ('function' !== typeof this.routes[method][pathname])
        return onError(res, pathname);

    this.routes[method][pathname].apply(res, [ data ]);
};


var valid = new Validator(schemas.user);

r.get('/', function () {
    return sendfile(
        this
      , path.join( __dirname, '/public/index.html')
      , '/');
});
r.post('/signin', function (data) {
    var query;
    try {
        query = valid.parse(data);
    } catch (e) {
        onError(this, data);
    }

    this.writeHead(200, {'content-type': 'application/javascript'});
    this.end(JSON.stringify(query));

    console.log(query);
});


var server = http.createServer(function (req, res) {

    var data = '';
    req.on('data', function (chunk) { data += chunk; });
    req.on('end', function () {
        r.route(res
          , req.method.toLowerCase()
          , url.parse(req.url).pathname
          , data
        );
    });
});

server.listen(8013, function () {
    console.log('server start to listen on port "%d"', 8013);
});




