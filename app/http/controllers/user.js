/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this file,
* You can obtain one at http://mozilla.org/MPL/2.0/. */

var env = require( "../../../config/environment" ),
    metrics = require( "../../../lib/metrics" )( env );

module.exports = function ( UserHandle ) {

  function userCallback( err, user, query, res ) {
    if ( err ) {
      metrics.increment( "user.get.error" );
      res.json( 500, { error: err } );
      return;
    }

    if ( !user ) {
      res.json( 404, { error: err || "User not found for ID: " + query } );
      return;
    }

    metrics.increment( "user.get.success" );
    res.json( { user: user } );
  }

  return {
    create: function ( req, res ) {
      var userInfo = req.body;

      UserHandle.createUser( userInfo, function( err, thisUser ) {
        if ( err || !thisUser ) {
          metrics.increment( "user.create.error" );
          res.json( 404, { error: err || "Unknown error!" } );
          return;
        }
        metrics.increment( "user.create.success" );
        res.json( { user: thisUser } );
      });
    },

    get: function ( req, res ) {
      var id = req.params[ 0 ];
      UserHandle.getUser( id, function( err, user ) {
        userCallback( err, user, id, res );
      });
    },

    getById: function ( req, res ) {
      var id = req.params[ 0 ];
      UserHandle.getUserById( id, function( err, user ) {
        userCallback( err, user, id, res );
      });
    },

    getByUsername: function ( req, res ) {
      var username = req.params[ 0 ];
      UserHandle.getUserByUsername( username, function( err, user ) {
        userCallback( err, user, username, res );
      });
    },

    getByEmail: function ( req, res ) {
      var email = req.params[ 0 ];
      UserHandle.getUserByEmail( email, function( err, user ) {
        userCallback( err, user, email, res );
      });
    },

    update: function ( req, res ) {
      var userInfo = req.body,
          id = req.params[ 0 ];

      UserHandle.updateUser( id, userInfo, function ( err, user ) {
        if ( err || !user ) {
          metrics.increment( "user.update.error" );
          return res.json( 404, { error: err || "User not found for ID: " + id } );
        }

        return res.json( 200, { user: user } );
     });
    },

    del: function ( req, res ) {
      var id = req.params[ 0 ];

      // Confirm user exists (Sequelize happily deletes non-existent users)
      UserHandle.getUser( id, function( err, user ) {
        if ( err || !user ) {
          metrics.increment( "user.get.error" );
          return res.json( 404, { error: err || "User not found for ID: " + id } );
        }

        // Delete user
        UserHandle.deleteUser( id , function ( err ) {
          if ( err ) {
            metrics.increment( "user.delete.error" );
            res.json( 500, { error: err } );
            return;
          }

          metrics.increment( "user.delete.success" );
          res.json( 200 );
        });
      });
    },

    all: function( req, res ) {
      UserHandle.getAllUsers( function ( err, users ) {
        if ( err || !users.length ) {
          metrics.increment( "user.all.error" );
          res.json( 404, { error: err || "Users could not be found!" } );
          return;
        }

        metrics.increment( "user.all.success" );
        res.json( { "users": users } );
      });
    },

    userForm: function( req, res ) {
      res.render( "ajax/forms/new_user.html", {
        ssoAudience: env.get( "AUDIENCE" )
      } );
    }
  };
}; // END Exports function

