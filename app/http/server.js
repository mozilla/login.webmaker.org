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
    env         = require('../../config/environment'),
    helmet      = require('helmet'),
    mongo       = require('../../lib/mongoose')(env),
    User        = require('../models/user')(mongo.conn),
    persona     = require("express-persona"),
    lessMiddleWare = require('less-middleware'),
    route = require('./routes'),
    path = require('path');

var http = express();

// Express Configuration
http.configure(function(){
  http.set('views', path.join(__dirname, 'views'));
  http.set('view engine', 'ejs');
  http.disable("x-powered-by");
  http.use(mongo.healthCheck);
  http.use(application.allowCorsRequests);
  http.use(express.logger());
  if (!!env.get('FORCE_SSL')) {
    http.use(helmet.hsts());
    http.enable('trust proxy');
  }
  http.use(express.static( path.join(__dirname, 'public')));
  http.use(express.cookieParser());
  http.use(express.bodyParser());
  http.use(express.methodOverride());
  http.use(express.cookieSession({
    key: "login.sid",
    secret: env.get('SESSION_SECRET'),
    cookie: {
      secure: !!env.get('FORCE_SSL'),
      maxAge: 2678400000 // 31 days
    },
    proxy: true
  }));
  http.use(http.router);

  var optimize = env.get("NODE_ENV") !== "development",
      tmpDir = path.join(require( "os" ).tmpDir(), "mozilla.login.webmaker.org.build");
  http.use(lessMiddleWare({
    once: optimize,
    debug: !optimize,
    dest: tmpDir,
    src: path.resolve(__dirname, "public"),
    compress: optimize,
    yuicompress: optimize,
    optimization: optimize ? 0 : 2
  }));
  http.use(express.static(tmpDir));
});

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
    }
    else {
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

route( http, User );

var port = env.get('port');
http.listen( port, function() {
  logger.info("HTTP server listening on port " + port + ".");
});
