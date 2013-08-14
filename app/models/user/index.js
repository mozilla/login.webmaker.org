/**
 * User Model
 * ---------------
 * This file acts as a controller, co-ordinating between two
 * database backends: MongoDB (through Mongoose) and MySQL
 * (through Sequelize).
 *
 * All non-create calls will run through MySQL first, and if
 * a record cannot be found, data will be checked against the
 * contents of the MongoDB.
 *
 * Anytime a record for a user is accessed in MongoDB, it will
 * be immediately copied into MySQL, which will return the
 * data to the client.
 *
 * TODOs:
 *  1) Add logging to all calls on success/error
 *     - https://bugzilla.mozilla.org/show_bug.cgi?id=882970
 *  2) Healthcheck
 *     - https://bugzilla.mozilla.org/show_bug.cgi?id=867328
 */

module.exports = function ( env ) {
  var mongoose = require( "../../../lib/mongoose" )( env ),
      sqlHandle = require( "./sqlController" )( env ),
      mongoHandle = require( "./mongoController" )( mongoose.conn ),
      emailer = require( "../../../lib/emailer" );

  /**
   * Model Access methods
   */
  return {
    /**
     * getUser( id, callback )
     * -
     * id: username, email or sql id
     * callback: function( err, user )
     */
    getUser: function( id, callback ) {
      // First, check the MySQL db
      sqlHandle.getUser( id, function( err, user ){
        if ( err ) {
          return callback( err, null );
        }

        if ( user ) {
          return callback( null, user.getValues() );
        }

        // No user, check mongo
        mongoHandle.getUser( id, function( err, user ){
          if ( err ) {
            return callback( err, null );
          }

          // No user at all?
          if ( !user ) {
            return callback();
          }

          sqlHandle.createUser( user, function( err, thisUser ){
            if ( err ) {
              return callback( err );
            }

            return callback( null, thisUser.getValues() );
          });
        });
      });
    },
    /**
     * createUser( data, callback )
     * -
     * data: JSON object containing user fields
     * callback: function( err, thisUser )
     */
    createUser: function( data, callback ) {
      sqlHandle.createUser( data, function( sqlErr, user ) {
        if ( sqlErr ) {
          return callback( sqlErr );
        }

        emailer.sendWelcomeEmail({
          to: user.email,
          fullName: user.fullName
        }, function( emailEerr, msg ) {
          if ( emailEerr ) {
            // non-fatal error
            console.error( emailErr );
          }
          if ( msg ) {
            console.log( "Sent welcome email with id %s", msg.MessageId) ;
          }

          callback( null, user );
        });
      });
    },

    /**
     * updateUser( id, data, callback )
     * -
     * id: username, email or _id
     * data: JSON object containing user fields
     * callback: function( err, user )
     */
    updateUser: function ( id, data, callback ) {
      this.getUser( id, function( err, user ) {
        var error;

        if ( err ) {
          return callback( err );
        }

        if ( !user  ) {
          return callback( "User not found!" );
        }

        sqlHandle.updateUser( user.id, data, callback );
      });
    },

    /**
     * deleteUser( data, callback )
     * -
     * id: _id
     * callback: function( err, thisUser )
     */
    deleteUser: function ( id, callback ) {
      // Check user exists (sequelize happily deletes
      // non existant-users)
      this.getUser( id, function( err, user ) {
        var error;

        if ( err ) {
          return callback( err );
        }

        if ( !user  ) {
          return callback( "User not found!" );
        }

        // Delete user
        sqlHandle.deleteUser( id, function( err ) {
          if ( err ) {
            return callback( err );
          }

          mongoHandle.deleteUser( user.email, function( err ) {
            return callback();
          });
        });
      });

    },

    /**
     * getAllUsers( callback )
     * -
     * callback: function( err, users )
     */
    getAllUsers: function ( callback ) {
      sqlHandle.getAllUsers( callback );
    },

    /**
     * checkUsername( username, callback )
     * -
     * username: username to be checked
     * callback: function( err, unavailable )
     */
    checkUsername: function( username, callback ) {
      sqlHandle.checkUsername( username, function( err, unavailable ){
        if ( err ) {
          return callback( err );
        }

        if ( unavailable ) {
          return callback( null, true );
        }

        mongoHandle.checkUsername( username, callback );
      });
    }
  };
};
