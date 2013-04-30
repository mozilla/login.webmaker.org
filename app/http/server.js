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
  http.use(express.static( path.join(__dirname, 'public')));
  http.use(express.cookieParser("we shall see"));
  http.use(express.bodyParser());
  http.use(express.methodOverride());
  http.use(express.cookieSession({
    key: 'wm.sid',
    secret: env.get('SESSION_SECRET'),
    cookie: {
      maxAge: 2678400000, // 31 days
      domain: env.get("COOKIE_DOMAIN") 
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

    // Confirm Persona authenticated
    if (err) {
      userInfo.status = "failure";
      userInfo.reason = err;

      return res.send(userInfo);;
    }  
    userInfo.status = "okay";
    userInfo.email = email;

    // Check if user is a webmaker
    User.find( { "email" : email }, function (err, User) {
      if (!User.length) {
        userInfo.exists = false;
      } else {        
        console.log("\n\n\n\n\n\n Anything??? \n\n\n\n\n\n");
        console.log(req.session);
        // Set super-session data
        req.session.auth = {
          _id: User[0]._id
        }
        console.log(req.session);
        
        userInfo.exists = true;
        userInfo.user = User[0];
      }

      res.send(userInfo);
    });
  }, // end verify response
  logoutResponse: function(err, req, res) {
    var out;
    
    // Clear authentication data
    delete req.session;

    // Determine response
    if (err) {
      out = { status: "failure", reason: err };
    } else {
      out = { status: "okay" };
    }
    res.json(out);
  }
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
route( http, User );

var port = env.get('port');
http.listen(port);

logger.info("HTTP server listening on port " + port + ".");
