/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this file,
* You can obtain one at http://mozilla.org/MPL/2.0/. */

var env = require("../../../config/environment");

module.exports = function ( Blacklist ) {
  
  return {
    create: function ( req, res ) {
      var entry = new Blacklist( req.body );

      // Delegates all validation to mongoose during this step
      entry.save( function( err, entry ) {
        if ( err ) {
          res.json( 500, { error: err } );
          return;
        }

        res.send( 200 );
      });
    },
    find: function ( req, res ) {
      Blacklist.findOne({ word: req.params.word }, function ( err, word ) {

        if ( err ) {
          res.json( 500, { error: err } );
          return;
        }

          res.send( !!word ? 200 : 404 );
      });
    }
  };
}; // END Exports function
