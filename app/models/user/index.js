module.exports = function ( env ) {
  var hatchet = require("hatchet");
  var sqlHandle = require( "./sqlController" )( env );

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
      sqlHandle.getUserById( id, callback );
    },

    /**
     * getUserByUsername( username, callback )
     * -
     * username: username
     * callback: function( err, user )
     */
    getUserByUsername: function( username, callback ) {
      sqlHandle.getUserByUsername( username, callback );
    },

    /**
     * getUserByEmail( email, callback )
     * -
     * email: email
     * callback: function( err, user )
     */
    getUserByEmail: function( email, callback ) {
      sqlHandle.getUserByEmail( email, callback );
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

        hatchet.send( "create_user", {
          userId: user.getDataValue("id"),
          username: user.getDataValue("username"),
          email: user.getDataValue("email"),
          subscribeToWebmakerList: user.getDataValue("subscribeToWebmakerList")
        });

        callback( null, user );
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

          hatchet.send( "delete_user", {
            userId: user.getDataValue("id"),
            username: user.getDataValue("username"),
            email: user.getDataValue("email"),
          });

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
