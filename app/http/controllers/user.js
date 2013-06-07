/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this file,
* You can obtain one at http://mozilla.org/MPL/2.0/. */

var habitat = require('habitat');
var env = new habitat();    
var metrics = require("../../../lib/metrics")( env );

module.exports = function ( UserHandle ) {
  var controller = {};

  controller.create = function ( req, res ) {
    var userInfo = req.body;
    userInfo._id = userInfo.email;

    var user = new UserHandle( userInfo );

    // Delegates all validation to mongoose during this step
    user.save( function( err, thisUser ) {
      if ( err ) {
        metrics.increment( "user.create.error" );
        res.json( 404, { error: err, user: null } );
        return;
      }

      metrics.increment( "user.create.success" );
      res.json( { error: null, user: thisUser } );
    });
  };

  controller.get = function ( req, res ) {
    var id = req.params.id,
        field,
        query = {};

    // Parse out field type
    if ( id.match(/^\d+$/g) ) {
      field = "_id";
    } else if ( id.match(/^[^@]+$/g) ) {
      field = "username";
    } else {
      field = "email";
    }
    query[field] = id;

    UserHandle.findOne( query, function ( err, user ) {
      if ( err ) {
        metrics.increment( "user.get.error" );
        res.json( 500, { error: err, user: null } );
        return;
      }

      if ( !user ) {
        res.json( 404, { error: err || "User not found for ID: " + id, user: null } );
        return;
      }

      metrics.increment( "user.get.success" );
      res.json( { error: null, user: user } );
    });
  };

  controller.update = function ( req, res ) {
    var userInfo = req.body,
        id = req.params.id;

    UserHandle.findById( id, function ( err, user ) {
      if ( err || !user ) {
        metrics.increment( "user.update.error" );
        res.json( 404, { error: err || "User not found for ID: " + id, user: null } );
        return;
      }      

      // Selectively update the user model
      Object.keys( userInfo ).forEach( function ( key ) {
        user[ key ] = userInfo[ key ];
      });

      user.save( function ( err ) {
        metrics.increment( "user.update.error" );
        res.json( 404, { error: err, user: null } );
      });
      
   });

    UserHandle.findById( id, function ( err, user ) {
      if ( err || !user ) {
        metrics.increment( "user.update.error" );
        res.json( 404, { error: err || "User not found for ID: " + id, user: null } );
        return;
      }      

      metrics.increment( "user.update.success" );
      res.json( { error: null, user: user } );
    });
  };

  controller.del = function ( req, res ) {
    var id = req.params.id;

    UserHandle.findByIdAndRemove( id , function ( err, user ) {
      if ( err || !user ) {
        metrics.increment( "user.delete.error" );
        res.json( 404, { error: err || "User not found for ID: " + id, user: null } );
        return;
      }

      metrics.increment( "user.delete.success" );
      res.json( { error: null, user: user } );
    });
  };

  controller.all = function( req, res ) {
    UserHandle.find( {}, function ( err, users ) {
      if ( err || !users.length ) {
        metrics.increment( "user.all.error" );
        res.json( 404, { error: err || "Users could not be found!", user: null } );
        return;
      }

      metrics.increment( "user.all.success" );
      res.json( { "users": users } );
    });
  };

  controller.userForm = function( req, res ) {
    res.render( "ajax/forms/new_user", {
      ssoAudience: env.get('AUDIENCE')
    } );
  };

  controller.isAdmin = function( req, res ) {
    UserHandle.findById( req.query.id, function( err, user ) {
      if ( err || !user ) {
        metrics.increment( "user.isAdmin.error" );
        res.json( 404, { error: err || "User not found for ID: " + req.query.id, isAdmin: false } );
        return;
      }
      metrics.increment( "user.isAdmin.success" );
      res.json( { error: null, isAdmin: user.isAdmin } );
    });
  };

  controller.checkUsername = function ( req, res ) {

    var name = req.param( 'name' ),
      badword = require( 'badword' );
    
    UserHandle.count({ username: name }, function ( err, count ) {
      if ( err ) {
        res.json( 500, { error: err } );
        return;
      }      
      
      if ( count ) {
        return res.json( 200, "username given in '" +
                              name + "' is good and being used" );
      }

      if ( badword( name ) ) {
        return res.json( 406, "username given in '" +
                     name + "' is blacklisted" );
      }
      res.json( 404, "username given in '" +
                      name + "' is available" );  
    });
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

    email.forEach(function(m) {
      UserHandle.find({ email:m }).remove();
    });

    res.send("DELETED!!!");
  };

  return controller;
}; // END Exports function

