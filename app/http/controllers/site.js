/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

var env = require('../../../config/environment');
/**
 * GET home page.
 */
exports.index = function( req, res ){
  res.render('site/index');
};

/**
 * Get account page
 */
exports.account = function( req, res ){
  res.render('site/account', {
    email: req.session.email || "",
    audience: env.get( "AUDIENCE" ),
    csrf: req.session._csrf,
    hostname: env.get("HOSTNAME"),
    ga_account: env.get( "GA_ACCOUNT" ),
    ga_domain: env.get( "GA_DOMAIN" )
  });
};

/**
 * New account page
 */
exports.newaccount = function( req, res ){
  if (req.session.username) {
    return res.redirect("/account");
  }
  res.render('site/newaccount', {
    email: req.session.email || "",
    audience: env.get( "AUDIENCE" ),
    csrf: req.session._csrf,
    hostname: env.get("HOSTNAME"),
    ga_account: env.get( "GA_ACCOUNT" ),
    ga_domain: env.get( "GA_DOMAIN" )
  });
};

/**
 * Sign in with persona
 */
exports.persona = function( req, res ){
  if (req.session.username) {
    return res.redirect("/account");
  }
  res.render('site/persona', {
    email: req.session.email || "",
    audience: env.get( "AUDIENCE" ),
    csrf: req.session._csrf,
    hostname: env.get("HOSTNAME"),
    ga_account: env.get( "GA_ACCOUNT" ),
    ga_domain: env.get( "GA_DOMAIN" )
  });
};

/**
 * Signin page for admin console
 */
exports.signin = function( req, res ){
  res.render( 'site/login.html.ejs', {
    csrf: req.session._csrf,
    login: req.session.email || "",
    sso_include: env.get( "SSO_INCLUDE_URL" ),
    loginServer: env.get("HOSTNAME"),
    audience: env.get("AUDIENCE")
  });
};
/**
 * Get admin console
 */
exports.console = function( req, res ){
  res.render( 'site/console.html.ejs', {
    csrf: req.session._csrf,
    login: req.session.email || "",
    sso_include: env.get( "SSO_INCLUDE_URL" ),
    loginServer: env.get("HOSTNAME"),
    audience: env.get("AUDIENCE")
  });
};


/**
 * Get js files
 */
exports.js = function( filename ) {
  return function( req, res ){
    res.set('Content-Type', 'application/javascript');
    res.render( 'js/' + filename + '.js.ejs', {
      hostname: env.get( "HOSTNAME" ),
      audience: env.get( "AUDIENCE" )
    });
  };
};

/**
 * GET health check for app
 */
exports.healthcheck = function( req, res ){
  res.json({ http: 'okay' });
};
