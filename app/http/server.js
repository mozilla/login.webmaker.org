#!/usr/local/bin/node

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

// Module dependencies.
require( "../../lib/extensions/number" );

var express     = require( "express" ),
    logger      = require( "../../lib/logger" ),
    util        = require( "util" ),
    application = require( "./controllers/application" ),
    env         = require( "../../config/environment" ),
    helmet      = require( "helmet" ),
    i18n        = require( "i18n-abide" ),
    nunjucks    = require( "nunjucks" ),
    userHandle  = require( "../models/user" )( env ),
    lessMiddleWare = require( "less-middleware" ),
    route = require( "./routes" ),
    path = require( "path" );

var http = express(),
    nunjucksEnv = new nunjucks.Environment( new nunjucks.FileSystemLoader( path.join( __dirname, "views" ) ) );

// Express Configuration
http.configure(function(){

  nunjucksEnv.express( http );

  http.disable( "x-powered-by" );
  http.use( application.allowCorsRequests );
  http.use( express.logger() );
  if ( !!env.get( "FORCE_SSL" ) ) {
    http.use( helmet.hsts() );
    http.enable( "trust proxy" );
  }

  http.use( express.static( path.join( __dirname, "public" ) ) );

  // Setup locales with i18n
  http.use( i18n.abide({
    supported_languages: [
      "en-US"
    ],
    default_lang: "en_US",
    translation_type: "key-value-json",
    translation_directory: "locale",
    locale_on_url: true
  }));

  http.use( express.cookieParser() );
  http.use( express.bodyParser() );
  http.use( express.methodOverride() );
  http.use( express.cookieSession({
    key: "login.sid",
    secret: env.get( "SESSION_SECRET" ),
    cookie: {
      secure: !!env.get( "FORCE_SSL" ),
      maxAge: 2678400000 // 31 days
    },
    proxy: true
  }));
  http.use( http.router );

  var optimize = env.get( "NODE_ENV" ) !== "development",
      tmpDir = path.join( require( "os" ).tmpDir(), "mozilla.login.webmaker.org.build" );
  http.use(lessMiddleWare({
    once: optimize,
    debug: !optimize,
    dest: tmpDir,
    src: path.resolve(__dirname, "public"),
    compress: optimize,
    yuicompress: optimize,
    optimization: optimize ? 0 : 2
  }));
  http.use( express.static( tmpDir ) );
});

require( "webmaker-loginapi" )(http, {
  loginURL: env.get( "LOGINAPI" ),
  audience: env.get( "audience" ),
  middleware: express.csrf()
});

http.configure( "development", function(){
  http.use( express.errorHandler({ dumpExceptions: true, showStack: true }) );
});

http.configure( "production", function(){
  http.use( express.errorHandler() );
});

route( http, userHandle );

http.listen( env.get( "PORT" ), function() {
  logger.info( "HTTP server listening on port " + env.get( "PORT" ) + "." );
});
