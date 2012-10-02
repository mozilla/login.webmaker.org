#!/usr/local/bin/node

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

// Module dependencies.
require('../../lib/extensions/number');

const 
express     = require('express'),
logger      = require('../../lib/logger'),
util        = require('util'),
connect     = require('connect'),
RedisStore  = require('connect-redis')(connect),
application = require('./controllers/application'),
persona     = require("express-persona"),
config      = require('../../lib/configuration');

var http = express();

var redisConfig = config.get('redis');
var sessionStore = new RedisStore({
  host: redisConfig.host,
  port: redisConfig.port,
  maxAge: (30).days
});

// Express Configuration
http.configure(function(){
  http.set('views', __dirname + '/views');
  http.set('view engine', 'ejs');

  http.use(express.logger());
  http.use(express.static(__dirname + '/public'));
  http.use(express.cookieParser());
  http.use(express.bodyParser());
  http.use(express.methodOverride());
  //TODO: Load secret from config/env var
  http.use(express.session({
    secret: "I feed lunch meat to my neighbour's \"vegan\" dog.",
    key: 'express.sid',
    store: sessionStore,
    cookie: {maxAge: (365).days()}
  }));

  http.use(function (req, res, next) {
    res.removeHeader("X-Powered-By");
    next();
  });

  http.use(http.router);
});

persona(http, {
  audience: "http://localhost:3000" // Must match your browser's address bar
});

http.configure('development', function(){
  http.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

http.configure('production', function(){
  http.use(express.errorHandler());
});

// HTTP Routes
routes = {
  site: require('./controllers/site')
};

http.get('/', routes.site.index);

process.on('uncaughtException', function(err) {
  logger.error(err);
});

var port = config.get('bind_to').port;
http.listen(config.get('bind_to').port);

logger.info("HTTP server listening on port " + port + ".");
