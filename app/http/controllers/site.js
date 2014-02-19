/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

var env = require( "../../../config/environment" );
/**
 * GET home page.
 */
exports.index = function( req, res ){
  res.render( "site/index.html" );
};

/**
 * Get account page
 */
exports.account = function( req, res ){
  res.render( "site/account.html", {
    email: req.session.email || "",
    audience: env.get( "AUDIENCE" ),
    csrf: req.csrfToken(),
    ga_account: env.get( "GA_ACCOUNT" ),
    ga_domain: env.get( "GA_DOMAIN" )
  });
};

/**
 * Get js files
 */
exports.js = function( filename ) {
  return function( req, res ){
    res.set( "Content-Type", "application/javascript" );
    res.render( "js/" + filename + ".js", {
      hostname: env.get( "HOSTNAME" ),
      audience: env.get( "AUDIENCE" )
    });
  };
};

/**
 * GET health check for app
 */
 var version = require( "../../../package" ).version;

exports.healthcheck = function( req, res ){
  res.json({
    http: "okay",
    version: version
  });
};
