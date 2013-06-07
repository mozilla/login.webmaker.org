/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

var habitat = require('habitat');
var env = new habitat();
/**
 * GET home page.
 */
exports.index = function(req, res){
  res.render('site/index');
};

/**
 * Get admin console
 */
exports.console = function( req, res ){
  res.render( 'site/console.html.ejs' );
};

/**
 * Get admin console
 */
exports.consolejs = function( req, res ){
  res.set('Content-Type', 'application/javascript');
  res.render( 'js/console.js.ejs', {
    loginUri: env.get( "HOSTNAME" )
  });
};

/**
 * GET sign-in link.
 */
exports.sso = function(req,res) {
	res.set('Content-Type', 'application/javascript');
	res.render('js/sso-ux', {
    hostname: env.get('HOSTNAME')
  });
};

/**
 * GET health check for app
 */
exports.healthcheck = function(req, res){
  res.json({ http: 'okay' });
};
