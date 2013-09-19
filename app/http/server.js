#!/usr/local/bin/node

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

// Module dependencies.
require( "../../lib/extensions/number" );

var application = require( "./controllers/application" ),
    env = require( "../../config/environment" );
    express     = require( "express" ),
    helmet      = require( "helmet" ),
    i18n        = require( "webmaker-i18n" ),
    lessMiddleWare = require( "less-middleware" ),
    logger      = require( "../../lib/logger" ),
    nunjucks    = require( "nunjucks" ),
    path        = require( "path" ),
    route       = require( "./routes" ),
    userHandle  = require( "../models/user" )( env ),
    util        = require( "util" );

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
  http.use( "/bower", express.static( path.join(__dirname, "../../bower_components" )));

  // List of supported languages - Please add them here in an alphabetical order
  var supportedLanguages = [ "en-US" ];

  // Setup locales with i18n
  http.use( i18n.middleware({
    supported_languages: supportedLanguages,
    default_lang: "en-US",
    translation_directory: path.resolve( __dirname, "../../locale" )
  }));

  http.locals({
    supportedLanguages: supportedLanguages
  });

  http.use( express.cookieParser() );
  http.use( express.json() );
  http.use( express.urlencoded() );
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
