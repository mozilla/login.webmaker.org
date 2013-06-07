#!/usr/local/bin/node

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

var express = require( "express" ),
    habitat     = require('habitat'),
    env = new habitat(),
    persona = require( "express-persona" ),
    // module is real, username/pass are hardcoded here
    // but obviously in your own app,/ should not be.
    loginAPI = require( "webmaker-loginapi" )( "http://testapp:testpass@localhost:3000" );

// THESE VALUES SHOULD COME FROM .ENV, BUT COME IN WRONG
var HOST_PORT = 3000;

// Start up as many instances as we have dev ports:
env.get("DEV_PORTS").split(/\s+/).forEach(function(APP_PORT) {

  // Configuration
  var app = express();
  app.configure( function(){
    app.set( "views", __dirname + "/views" );
    app.set( "view engine", "ejs" );
    app.use( express.errorHandler( { dumpExceptions: true, showStack: true } ) );
    app.use( express.cookieParser() );
    app.use( express.bodyParser() );
    app.use( express.methodOverride() );
    app.use( express.cookieSession({
      key: 'wm.sid',
      secret: env.get('SESSION_SECRET'),
      cookie: {
        maxAge: 2678400000 // 31 days
      },
      proxy: true
    }));
    app.use( app.router );
  });

  // set up persona handling
  persona(app, {
    audience: env.get( "AUDIENCE" ),
    verifyResponse: function(err, req, res, email) {
      if (err) {
        return res.json({status: "failure", reason: err});
      }
      req.session.email = email;
      res.json({status: "okay", email: email});
    }
  });

  // main page route
  app.get( "/", function( req, res ) {
    res.render( "index", {
      email: req.session.email ? req.session.email : '',
       // for some reason, env.get("PORT") is 3100 at this point.
      login: env.get("LOGIN") + ":" + HOST_PORT,
      apphost: env.get("HOSTNAME") + ":" + APP_PORT,
      audience: env.get( "AUDIENCE" ),
      app_domains: env.get( "ALLOWED_DOMAINS" ).split( " " )
    });
  });

  app.get( "/user/:userid", function( req, res ) {
    loginAPI.getUser(req.session.email, function(err, user) {
      if(err || !user) {
        return res.json({
          status: "failed",
          reason: (err || "user not defined")
        });
      }

      // Bind the username for this user in the cookie.
      // Note that doing so means your operations need
      // to make sure that email and username are set.
      // Simply checking username is not secure.
      req.session.username = user.username;

      // respond with the found user domain
      res.json({
        status: "okay",
        user: user
      });
    });
  });

  // start up
  app.listen( APP_PORT );
});
