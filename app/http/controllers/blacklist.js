/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this file,
* You can obtain one at http://mozilla.org/MPL/2.0/. */

var env = require("../../../config/environment");

module.exports = function ( Blacklist ) {
  
  return {
    create: function ( req, res ) {
      var listWord = new Blacklist( req.body );

      // Delegates all validation to mongoose during this step
      listWord.save( function( err, listItem ) {
        if ( err ) {
          res.json( 500, { error: err } );
          return;
        }

        res.send( 200 );
      });
    },
    find: function ( req, res ) {
      var word = req.params.word;

      Blacklist.find({ name:word }, function ( err, word ) {

        if ( err ) {
          res.json( 500, { error: err } );
          return;
        }

        res.json( { found: word.length } );
      });
    }
  };
}; // END Exports function
