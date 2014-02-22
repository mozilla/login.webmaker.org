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
    rtltrForLess = require("rtltr-for-less"),
    nunjucks    = require( "nunjucks" ),
    path        = require( "path" ),
    route       = require( "./routes" ),
    userHandle  = require( "../models/user" )( env ),
    util        = require( "util" );

var http = express(),
    nunjucksEnv = new nunjucks.Environment( new nunjucks.FileSystemLoader( path.join( __dirname, "views" ) ), {
      autoescape: true
    }),
    messina,
    logger;

nunjucksEnv.addFilter("instantiate", function(input) {
    var tmpl = new nunjucks.Template(input);
    return tmpl.render(this.getVariables());
});

// Express Configuration
http.configure(function(){

  nunjucksEnv.express( http );

  http.disable( "x-powered-by" );
  http.use( application.allowCorsRequests );

  if ( !!env.get( "ENABLE_GELF_LOGS" ) ) {
    messina = require( "messina" );
    logger = messina( "login.webmaker.org-" + env.get( "NODE_ENV" ) || "development" );
    logger.init();
    http.use( logger.middleware() );
  } else {
    http.use( express.logger() );
  }


  http.use( helmet.iexss() );
  http.use( helmet.contentTypeOptions() );
  http.use( helmet.xframe() );

  if ( !!env.get( "FORCE_SSL" ) ) {
    http.use( helmet.hsts() );
    http.enable( "trust proxy" );
  }

  // Setup locales with i18n
  http.use( i18n.middleware({
    supported_languages: env.get( "SUPPORTED_LANGS" ),
    default_lang: "en-US",
    mappings: require("webmaker-locale-mapping"),
    translation_directory: path.resolve( __dirname, "../../locale" )
  }));

  http.locals({
    AUDIENCE: env.get("AUDIENCE"),
    profile: env.get("PROFILE"),
    supportedLanguages: i18n.getLanguages(),
    listDropdownLang: i18n.getSupportLanguages()
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
  http.use(lessMiddleWare(rtltrForLess({
    once: optimize,
    debug: !optimize,
    dest: tmpDir,
    src: path.resolve(__dirname, "public"),
    compress: optimize,
    yuicompress: optimize,
    optimization: optimize ? 0 : 2
  })));
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

http.use( express.static( path.join( __dirname, "public" ) ) );
http.use( "/bower", express.static( path.join(__dirname, "../../bower_components" )));

http.listen( env.get( "PORT" ), function() {
  console.log( "HTTP server listening on port " + env.get( "PORT" ) + "." );
});
