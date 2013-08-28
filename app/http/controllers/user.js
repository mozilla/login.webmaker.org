/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this file,
* You can obtain one at http://mozilla.org/MPL/2.0/. */

var env = require( "../../../config/environment" ),
    metrics = require( "../../../lib/metrics" )( env );

module.exports = function ( UserHandle ) {
  var controller = {};

  controller.create = function ( req, res ) {
    var userInfo = req.body;

    UserHandle.createUser( userInfo, function( err, thisUser ) {
      if ( err ) {
        metrics.increment( "user.create.error" );
        res.json( err.code, { error: err.err } );
        return;
      }
      metrics.increment( "user.create.success" );
      res.json( { user: thisUser } );
    });
  };

  controller.get = function ( req, res ) {
    var id = req.params.id;

    UserHandle.getUser( id, function ( err, user ) {
      if ( err ) {
        metrics.increment( "user.get.error" );
        res.json( err.code, { error: err.message } );
        return;
      }

      // If there's no user object, and no error,
      // something weird is going on
      if ( !user ) {
        metrics.increment( "user.get.error" );
        return res.json( 500, { error: "Database helper failure" } );
      }

      metrics.increment( "user.get.success" );
      res.json({ user: user });
    });
  };

  controller.update = function ( req, res ) {
    var userInfo = req.body,
        id = req.params.id;

    UserHandle.updateUser( id, userInfo, function ( err, user ) {
      if ( err ) {
        metrics.increment( "user.update.error" );
        return res.json( err.code, { error: err.message } );
      }

      // If there's no user object, and no error,
      // something weird is going on
      if ( !user ) {
        metrics.increment( "user.update.error" );
        return res.json( 500, { error: "Database helper failure" } );
      }

      metrics.increment( "user.update.success" );
      return res.json( 200, { user: user } );
   });
  };

  controller.del = function ( req, res ) {
    var id = req.params.id;

    // Confirm user exists (Sequelize happily deletes non-existent users)
    UserHandle.getUser( id, function( err, user ) {
      if ( err ) {
        metrics.increment( "user.get.error" );
        return res.json( err.code, { error: err.message } );
      }

      // If there's no user object, and no error,
      // something weird is going on
      if ( !user ) {
        metrics.increment( "user.get.error" );
        return res.json( 500, { error: "Database helper failure" } );
      }
      metrics.increment( "user.get.success" );

      // Delete user
      UserHandle.deleteUser( id , function ( err ) {
        if ( err ) {
          metrics.increment( "user.delete.error" );
          res.json( err.code, { error: err.message } );
          return;
        }

        metrics.increment( "user.delete.success" );
        res.json( 200 );
      });
    });
  };

  controller.all = function( req, res ) {
    UserHandle.getAllUsers( function ( err, users ) {
      if ( err || !users.length ) {
        metrics.increment( "user.all.error" );
        res.json( 404, { error: err || "Users could not be found!" } );
        return;
      }

      metrics.increment( "user.all.success" );
      res.json( { "users": users } );
    });
  };

  controller.isAdmin = function( req, res ) {
    UserHandle.getUser( req.query.id, function( err, user ) {
      if ( err ) {
        metrics.increment( "user.get.error" );
        res.json( err.code, { error: err.message } );
        return;
      }

      // If there's no user object, and no error,
      // something weird is going on
      if ( !user ) {
        metrics.increment( "user.get.error" );
        return res.json( 500, { error: "Database helper failure" } );
      }
      metrics.increment( "user.get.success" );
      metrics.increment( "user.isAdmin.success" );

      res.json({ isAdmin: user.isAdmin });
    });
  };

  controller.checkUsername = function ( req, res ) {
    var name = req.param( "name" ),
        badword = require( "badword" );

    if ( !name ) {
      return res.json( 400, { error: ":name parameter required!" } );
    }

    UserHandle.checkUsername( name, function ( err, isUserUnavailable ) {
      if ( err ) {
        // Blacklisted
        if ( err.code === 403 ) {
          metrics.increment( "user.checkUsername.error" );
          return res.json( 403, { error: "username given in '" + name + "' is blacklisted" });
        }

        // Other error
        metrics.increment( "user.checkUsername.error" );
        return res.json( err.code, { error: err.message });
      }

      if ( isUserUnavailable ) {
        return res.json( 200, { error: "username given in '" + name + "' is valid and being in use" } );
      }

      res.json( 404, { error: "username given in '" + name + "' is available" } );
    });
  };

  controller.userForm = function( req, res ) {
    res.render( "ajax/forms/new_user.html", {
      ssoAudience: env.get( "AUDIENCE" )
    } );
  };

  return controller;
}; // END Exports function

