/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this file,
* You can obtain one at http://mozilla.org/MPL/2.0/. */

var env = require("../../../config/environment"),
    metrics = require("../../../lib/metrics")( env );

module.exports = function ( UserHandle ) {
  var controller = {};

  controller.create = function ( req, res ) {
    var userInfo = req.body;
    userInfo._id = userInfo.email;

    UserHandle.createUser( userInfo, function( err, thisUser ) {
      if ( err || !thisUser ) {
        metrics.increment( "user.create.error" );
        res.json( 404, { error: err || "Unknown error!" } );
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
        res.json( 500, { error: err } );
        return;
      }

      if ( !user ) {
        res.json( 404, { error: err || "User not found for ID: " + id } );
        return;
      }

      metrics.increment( "user.get.success" );
      res.json( { user: user } );
    });
  };

  controller.update = function ( req, res ) {
    var userInfo = req.body,
        id = req.params.id;

    UserHandle.updateUser( id, userInfo, function ( err, user ) {
      if ( err || !user ) {
        metrics.increment( "user.update.error" );
        return res.json( 404, { error: err || "User not found for ID: " + id } );
      }      
      
      return res.json( 200, { user: user } );
   });
  };

  controller.del = function ( req, res ) {
    var id = req.params.id;

    UserHandle.deleteUser( id , function ( err, user ) {
      if ( err || !user ) {
        metrics.increment( "user.delete.error" );
        res.json( 404, { error: err || "User not found for ID: " + id } );
        return;
      }

      metrics.increment( "user.delete.success" );
      res.json( 200 );
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
      if ( err || !user ) {
        metrics.increment( "user.isAdmin.error" );
        res.json( 404, { error: err || "User not found for ID: " + req.query.id, isAdmin: false } );
        return;
      }
      metrics.increment( "user.isAdmin.success" );
      res.json( { isAdmin: user.isAdmin } );
    });
  };

  controller.checkUsername = function ( req, res ) {
    var name = req.param( 'name' ),
        badword = require( 'badword' );
    
    UserHandle.checkUsername( name, function ( err, restricted ) {
      if ( err ) {
        // blacklisted
        if ( err === "badword" )  {
          return res.json( 403, "username given in '" + name + "' is blacklisted" );
        }

        return res.json( 500, "Error checking username!" );
      }

      if ( restricted ) {
        return res.json( 200, "username given in '" + name + "' is good and being used" );
      }

      res.json( 404, "username given in '" + name + "' is available" );  
    });
  }; 
  
  controller.userForm = function( req, res ) {
    res.render( "ajax/forms/new_user.html", {
      ssoAudience: env.get('AUDIENCE')
    } );
  };


  /**
  * Access this route from your browser to clear the database of accounts with the emails listed below.
  * e.g. "http://localhost:3000/dev/delete"
  *
  * Obviously this should never go anywhere near production.
  * See bug: https://bugzilla.mozilla.org/show_bug.cgi?id=863781
  */
  controller.devDelete = function( req, res ) {
    var email = [
      'ross@mozillafoundation.org',
      'ross@ross-eats.co.uk',
      'rossbruniges10@yahoo.co.uk',
      'rossbruniges@gmail.com',
      'kieran.sedgwick@gmail.com',
      'pomax@mozillafoundation.org',
      'jon@mozillafoundation.org'
    ];

    email.forEach(function( email ) {
      UserHandle.model.find({ email:email }).remove();
    });

    res.send("DELETED!!!");
  };

  return controller;
}; // END Exports function

