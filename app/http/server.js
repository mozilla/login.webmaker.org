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
users       = require('../models/user'),
persona     = require("express-persona"),
env         = require('../../config/environment'),
route = require('./routes');

var http = express();

var redisStoreConfig = env.get('redis');

redisStoreConfig.maxAge = (30).days

var sessionStore = new RedisStore(redisStoreConfig);

// Express Configuration
http.configure(function(){
  http.set('views', __dirname + '/views');
  http.set('view engine', 'ejs');
  http.use(application.allowCorsRequests);
  http.use(express.logger());
  http.use(express.static(__dirname + '/public'));
  http.use(express.cookieParser());
  http.use(express.bodyParser());
  http.use(express.methodOverride());
  

  http.use(express.session({
    secret: env.get('SESSION_SECRET'),
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
  audience: env.get('audience'),
  verifyResponse: function(err, req, res, email) {
    var userInfo = {};

    if (err) {
      userInfo.status = "failure";
      userInfo.reason = "you suck";
    }
    else {
      userInfo.status = "okay";
      userInfo.email = email;
    }

    users.find( { "email" : email }, function (err, users) {
      if (!users.length) {
        userInfo.exists = false;
      }
      else {
        userInfo.exists = true;
        userInfo.data = users[0];
      } 

      res.send(userInfo);
    });

  } // end verify response
});

http.configure('development', function(){
  http.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

http.configure('production', function(){
  http.use(express.errorHandler());
});

process.on('uncaughtException', function(err) {
  logger.error(err);
});

// HTTP Routes
route(http);

var port = env.get('port');
http.listen(port);

logger.info("HTTP server listening on port " + port + ".");
