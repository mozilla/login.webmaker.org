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
    userHandle  = require('../models/user')(mongo.conn),
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

    // Persona auth fail
    if (err) {
      return res.json( { status: "failure", reason: err } );
    }

    // Check if user is a webmaker
    User.findOne( { _id : email }, function ( err, User ) {
      if ( err || !User ) {
        return res.json({
          error: err,
          exists: false,
          email: email,
          status: "okay"
        });
      }

      // Set session data
      req.session.auth = {
        _id: email
      };

      res.json({
        exists: true,
        user: User,
        email: email,
        status: "okay"
      });
    });
  },
  middleware: express.csrf(),
  logoutResponse: function(err, req, res) {
    // Clear authentication data
    if ( req.session ) {
      delete req.session;
    }

    // Determine response
    if (err) {
      return res.json( { status: "failure", reason: err } );
    }
    
    res.json( { status: "okay" } );
  }
});

http.configure('development', function(){
  http.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

http.configure('production', function(){
  http.use(express.errorHandler());
});

route( http, userHandle );

http.listen( env.get('PORT'), function() {
  logger.info("HTTP server listening on port " + env.get('PORT') + ".");
});
