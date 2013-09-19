module.exports = function ( env ) {
  var sqlHandle = require( "./sqlController" )( env ),
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

        return callback();
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

          callback();
        });
      });

    },

    /**
     * checkUsername( username, callback )
     * -
     * username: username to be checked
     * callback: function( err, unavailable )
     */
    checkUsername: sqlHandle.checkUsername
  };
};
