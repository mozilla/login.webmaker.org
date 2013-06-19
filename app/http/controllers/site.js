/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

var env = require('../../../config/environment');
/**
 * GET home page - login!
 */
exports.index = function( req, res ){
  res.render('site/index');
};

/**
 * Accounts
 */
exports.account = function( req, res ){
  res.render('site/account');
};
exports.newaccount = function( req, res ){
  res.render('site/newaccount');
};


/**
 * Signin page for admin console
 */
exports.signin = function( req, res ){
  res.render( 'site/login.html.ejs', {
    csrf: req.session._csrf,
    login: req.session.email || ""
  });
};
/**
 * Get admin console
 */
exports.console = function( req, res ){
  res.render( 'site/console.html.ejs', {
    csrf: req.session._csrf,
    login: req.session.email || ""
  });
};


/**
 * Get js files
 */
exports.js = function( filename ) {
  return function( req, res ){
    res.set('Content-Type', 'application/javascript');
    res.render( 'js/' + filename + '.js.ejs' );
  };
};

/**
 * GET health check for app
 */
exports.healthcheck = function( req, res ){
  res.json({ http: 'okay' });
};
