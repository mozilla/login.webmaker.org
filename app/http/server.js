/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at https://mozilla.org/MPL/2.0/. */

/* jshint node: true */

module.exports = function (env) {
  var express = require("express"),
    helmet = require("helmet"),
    i18n = require("webmaker-i18n"),
    lessMiddleWare = require("less-middleware"),
    WebmakerAuth = require("webmaker-auth"),
    nunjucks = require("nunjucks"),
    morgan = require("morgan"),
    errorHandler = require("errorhandler"),
    path = require("path"),
    route = require("./routes"),
    Models = require("../db")(env).Models;

  var http = express(),
    nunjucksEnv = new nunjucks.Environment([
      new nunjucks.FileSystemLoader(path.join(__dirname, "views")),
      new nunjucks.FileSystemLoader(path.resolve(__dirname, "../../bower_components"))
    ], {
      autoescape: true
    });

  var webmakerAuth = new WebmakerAuth({
    loginURL: env.get("APP_HOSTNAME"),
    authLoginURL: env.get("LOGINAPI"),
    loginHost: env.get("APP_HOSTNAME"),
    secretKey: env.get("SESSION_SECRET"),
    forceSSL: env.get("FORCE_SSL"),
    domain: env.get("COOKIE_DOMAIN"),
    allowCors: env.get("ALLOWED_CORS_DOMAINS") && env.get("ALLOWED_CORS_DOMAINS").split(" ")
  });

  nunjucksEnv.addFilter("instantiate", function (input) {
    var tmpl = new nunjucks.Template(input);
    return tmpl.render(this.getVariables());
  });

  // Express Configuration
  nunjucksEnv.express(http);

  http.disable("x-powered-by");

  if (!env.get("DISABLE_HTTP_LOGGING")) {
    http.use(morgan("combined"));
  }

  http.use(helmet.iexss());
  http.use(helmet.contentTypeOptions());
  http.use(helmet.xframe());

  if (!!env.get("FORCE_SSL")) {
    http.use(helmet.hsts());
    http.enable("trust proxy");
  }

  http.use(express.json());
  http.use(express.urlencoded({
    extended: false
  }));
  http.use(webmakerAuth.cookieParser());
  http.use(webmakerAuth.cookieSession());

  // Setup locales with i18n
  http.use(i18n.middleware({
    supported_languages: env.get("SUPPORTED_LANGS"),
    default_lang: "en-US",
    mappings: require("webmaker-locale-mapping"),
    translation_directory: path.resolve(__dirname, "../../locale")
  }));

  // audience and webmakerorg are duplicated because of i18n
  http.locals.AUDIENCE = env.get("WEBMAKERORG");
  http.locals.WEBMAKERORG = env.get("WEBMAKERORG");
  http.locals.profile = env.get("PROFILE");
  http.locals.bower_path = "bower_components";
  http.locals.personaHostname = env.get("PERSONA_HOSTNAME", "https://login.persona.org");
  http.locals.languages = i18n.getSupportLanguages();

  var optimize = env.get("NODE_ENV") !== "development",
    tmpDir = path.join(require("os").tmpdir(), "mozilla.login.webmaker.org.build");

  // convert requests for ltr- or rtl-specific CSS back to the real filename,
  // as the rtltr-for-less package was a hack that was never meant to hit production.
  http.use(function rtltrRedirect(req, res, next) {
    var path = req.path;
    if (path.match(/css\/\w+\.(ltr|rtl)\.css/)) {
      res.redirect(path.replace(/\.(ltr|rtl)/, ""));
    } else {
      next();
    }
  });

  http.use(lessMiddleWare(path.resolve(__dirname, "public"), {
    once: optimize,
    debug: !optimize,
    dest: tmpDir,
    compress: optimize,
    yuicompress: optimize,
    optimization: optimize ? 0 : 2
  }));

  var optimize = env.get("NODE_ENV") !== "development",
    tmpDir = path.join(require("os").tmpDir(), "mozilla.login.webmaker.org.build");

  // convert requests for ltr- or rtl-specific CSS back to the real filename,
  // as the rtltr-for-less package was a hack that was never meant to hit production.
  http.use(function rtltrRedirect(req, res, next) {
    var path = req.path;
    if (path.match(/css\/\w+\.(ltr|rtl)\.css/)) {
      res.redirect(path.replace(/\.(ltr|rtl)/, ""));
    } else {
      next();
    }
  });

  http.use(express.static(tmpDir));

  if (env.get("NODE_ENV") === "development") {
    http.use(errorHandler());
  }

  route(http, Models, webmakerAuth);

  http.use(express.static(path.join(__dirname, "public")));
  http.use("/bower", express.static(path.join(__dirname, "../../bower_components")));

  return http.listen(env.get("PORT"), function () {
    console.log("HTTP server listening on port " + env.get("PORT") + ".");
  });
};
