#!/usr/local/bin/node

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

// Module dependencies.
require('../../lib/extensions/number');

var express     = require('express'),
    logger      = require('../../lib/logger'),
    util        = require('util'),
    application = require('./controllers/application'),
    User       = require('../models/user'),
    persona     = require("express-persona"),
    env         = require('../../config/environment'),
    route = require('./routes');

var http = express();

// Express Configuration
http.configure(function(){
  http.set('views', __dirname + '/views');
  http.set('view engine', 'ejs');
  http.disable("x-powered-by");
  http.use(application.allowCorsRequests);
  http.use(express.logger());
  http.use(express.static(__dirname + '/public'));
  http.use(express.cookieParser());
  http.use(express.bodyParser());
  http.use(express.methodOverride());
  http.use(express.cookieSession({
    key: 'express.sid',
    secret: env.get('SESSION_SECRET'),
    cookie: {
      maxAge: 2678400000 // 31 days
    },
    proxy: true
  }));
  http.use(http.router);
});

// Persona-Express Configuration & Webmaker Check
persona(http, {
  audience: env.get('audience'),
  verifyResponse: function(err, req, res, email) {
    var userInfo = {
      status: null,
      reason: null,
      user: null,
      exists: null
    };

    if (err) {
      userInfo.status = "failure";
      userInfo.reason = err;
    } else {
      userInfo.status = "okay";
      userInfo.email = email;
    }

    User.find( { "email" : email }, function (err, User) {
      if (!User.length) {
        userInfo.exists = false;
      } else {
        userInfo.exists = true;
        userInfo.user = User[0];
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
