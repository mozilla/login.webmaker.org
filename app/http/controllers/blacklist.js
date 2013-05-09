/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this file,
* You can obtain one at http://mozilla.org/MPL/2.0/. */

var blacklist = require("../../../lib/blacklist")(blacklist);

module.exports = {
  create: function ( req, res ) {
    blacklist.add( req.body, function( err ) {
      if ( err ) {
        res.json( 500, { error: err } );
        return;
      }
      res.send( 200 );
    });
  },
  find: function ( req, res ) {
    blacklist.find( req.params.word, function( err, found ) {
      if ( err ) {
        res.json( 500, { error: err } );
        return;
      }
      res.send( found ? 200 : 404 );
    });
  }
};
