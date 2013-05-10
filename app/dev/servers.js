#!/usr/local/bin/node

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

var express = require( "express" ),
    env = require( "../../config/environment" );

var app1 = express();
var app2 = express();
 
// Configuration
function configure( app ){
  app.configure( function(){
    app.set( "views", __dirname + "/views" );
    app.set( "view engine", "ejs" );
    app.use( app.router );
    app.use( express.errorHandler( { dumpExceptions: true, showStack: true } ) );
  });
  app.get( "/", function( req, res ) {
    res.render( "index", {
        audience: env.get( "AUDIENCE" ),
        allowed_domains: env.get( "ALLOWED_DOMAINS" ).split( " " )
    });
  });
}

configure( app1 );
configure( app2 );

app1.listen( 3001 );
app2.listen( 3002 );
