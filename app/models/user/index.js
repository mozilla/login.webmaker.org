module.exports = function ( env ) {
  var sqlHandle = require( "./sqlController" )( env ),
      emailer = require( "../../../lib/emailer" );

  function userCallback( err, user, callback ) {
    if ( err ) {
      return callback( err, null );
    }

    if ( user ) {
      return callback( null, user.getValues() );
    }

    return callback();
  }

  /**
   * Model Access methods
   */
  return {
    /**
     * getUserById( id, callback )
     * -
     * id: sql id
     * callback: function( err, user )
     */

    getUserById: function( id, callback ) {
      sqlHandle.getUserById( id, function( err, user ) {
        userCallback( err, user, callback );
      });
    },

    /**
     * getUserByUsername( username, callback )
     * -
     * username: username
     * callback: function( err, user )
     */
    getUserByUsername: function( username, callback ) {
      sqlHandle.getUserByUsername( username, function( err, user ) {
        userCallback( err, user, callback );
      });
    },

    /**
     * getUserByEmail( email, callback )
     * -
     * email: email
     * callback: function( err, user )
     */
    getUserByEmail: function( email, callback ) {
      sqlHandle.getUserByEmail( email, function( err, user ) {
        userCallback( err, user, callback );
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
        }, function( emailErr, msg ) {
          if ( emailErr ) {
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
     * updateUser( email, data, callback )
     * -
     * email: email address
     * data: JSON object containing user fields
     * callback: function( err, user )
     */
    updateUser: function ( email, data, callback ) {
      this.getUserByEmail( email, function( err, user ) {
        var error;

        if ( err ) {
          return callback( err );
        }

        if ( !user  ) {
          return callback( "User not found!" );
        }

        sqlHandle.updateUser( email, data, callback );
      });
    },

    /**
     * deleteUser( email, callback )
     * -
     * email: email address
     * callback: function( err, thisUser )
     */
    deleteUser: function ( email, callback ) {
      // Check user exists (sequelize happily deletes
      // non existant-users)
      this.getUserByEmail( email, function( err, user ) {
        var error;

        if ( err ) {
          return callback( err );
        }

        if ( !user  ) {
          return callback( "User not found!" );
        }

        // Delete user
        sqlHandle.deleteUser( email, function( err ) {
          if ( err ) {
            return callback( err );
          }

          callback();
        });
      });
    },

    /**
     * getAllWithEmails( emails, callback )
     * -
     * emails: Array of Emails
     * callback: function( err, users )
     */
    getAllWithEmails: function ( ids, callback ) {
      sqlHandle.getAllWithEmails( ids, callback );
    }
  };
};
