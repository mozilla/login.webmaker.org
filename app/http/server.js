/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

var newrelic;
if ( process.env.NEW_RELIC_ENABLED ) {
  newrelic = require( "newrelic" );
} else {
  newrelic = {
    getBrowserTimingHeader: function () {
      return "<!-- New Relic RUM disabled -->";
    }
  };
}

// Module dependencies.
require( "../../lib/extensions/number" );

var application = require( "./controllers/application" ),
    env = require( "../../config/environment" );
    express     = require( "express" ),
    helmet      = require( "helmet" ),
    i18n        = require( "webmaker-i18n" ),
    lessMiddleWare = require( "less-middleware" ),
    WebmakerAuth = require( "webmaker-auth" ),
    rtltrForLess = require("rtltr-for-less"),
    nunjucks    = require( "nunjucks" ),
    path        = require( "path" ),
    route       = require( "./routes" ),
    userHandle  = require( "../models/user" )( env ),
    util        = require( "util" );

var http = express(),
    nunjucksEnv = new nunjucks.Environment([
      new nunjucks.FileSystemLoader( path.join( __dirname, "views" ) ),
      new nunjucks.FileSystemLoader( path.resolve( __dirname, "../../bower_components" ) )
    ], {
      autoescape: true
    }),
    messina,
    logger;

var webmakerAuth = new WebmakerAuth({
  loginURL: env.get("LOGINAPI"),
  secretKey: env.get("SESSION_SECRET"),
  forceSSL: env.get("FORCE_SSL"),
  domain: env.get("COOKIE_DOMAIN")
});

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

  var authLocaleJSON = require("../../bower_components/webmaker-auth-client/locale/en_US/create-user-form.json");
  i18n.addLocaleObject({
    "en-US": authLocaleJSON
  }, function (result) {});

  http.locals({
    AUDIENCE: env.get("AUDIENCE"),
    newrelic: newrelic,
    profile: env.get("PROFILE"),
    personaHostname: env.get("PERSONA_HOSTNAME", "https://login.persona.org"),
    languages: i18n.getSupportLanguages()
  });

  http.use( express.json() );
  http.use( express.urlencoded() );
  http.use( express.methodOverride() );
  http.use( webmakerAuth.cookieParser() );
  http.use( webmakerAuth.cookieSession() );
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


http.configure( "development", function(){
  http.use( express.errorHandler({ dumpExceptions: true, showStack: true }) );
});

http.configure( "production", function(){
  http.use( express.errorHandler() );
});

route( http, userHandle, webmakerAuth );

http.use( express.static( path.join( __dirname, "public" ) ) );
http.use( "/bower", express.static( path.join(__dirname, "../../bower_components" )));

http.listen( env.get( "PORT" ), function() {
  console.log( "HTTP server listening on port " + env.get( "PORT" ) + "." );
});
