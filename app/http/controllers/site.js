/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

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
    audience: env.get( "AUDIENCE" )
  });
};

/**
 * Get admin console
 */
exports.console = function( req, res ){
  res.render( 'site/console.html.ejs' );
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
