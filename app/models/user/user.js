// Custom validation
var mongoose_validator = require('mongoose-validator'),
    badword = require('badword'),
    md5 = require('MD5');

mongoose_validator.extend( 'isBlackListed', function() {
  return !badword(this.str);
}, "Oooooh that's a bad word");

mongoose_validator.extend( 'isUsername', function () {
  var str = this.str;

  return ( "string" === typeof( str ) &&
    ( str.length <= 20 && str.length >= 1 ) &&
      str.search(/^[abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789\-\_]+$/) !== -1
  );
}, "Invalid username. All usernames must be between 1-20 characters, and only include \"-\", \"_\" and alphanumeric characters");

// Exports
module.exports = function ( connection ) {
  var validate = mongoose_validator.validate;

  var schema = new connection.Schema({
    _id: {
      type: String,
      required: true,
      unique: true,
      validate: validate('isEmail')
    },
    email: {
      type: String,
      required: true,
      unique: true,
      validate: validate('isEmail')
    },
    /**
     * username - the lowercased version of 
     * the user's chosen username.  It also
     * serves as the subdomain.
     *
     * unique index
     */
    username: {
      type: String,
      required: true,
      unique: true,
      validate: [validate('isUsername'), validate('isBlackListed')]
    },
    /**
     * fullName - The original-cased version
     * of the username, stored for future use
     */
    fullName: {
      type: String,
      required: false,
      unique: false
    },
    createdAt: {
      type: Date,
      required: true,
      "default": Date.now
    },
    updatedAt: {
      type: Date,
      required: true,
      "default": Date.now
    },
    deletedAt:{
      type: Date,
      required: false
    },
    isAdmin: {
      type: Boolean,
      "default": false
    },
    isSuspended: {
      type: Boolean,
      "default": false
    },
    sendNotifications: {
      type: Boolean,
      "default": false
    },
    sendEngagements: {
      type: Boolean,
      "default": false
    }
    // TODO: Avatar support
  });

  /**
   * Some sugar around the user's display name. We prefer
   * fullName if we have it, but fallback to username.
   */
  schema.virtual( 'displayName' ).get( function() {
    return this.fullName || this.username;
  });

  /**
   * We're using gravatar for avatar display - it requires an email hash to display
   * Not sure if we should store this value in the DB....
   */
  schema.virtual( 'emailHash' ).get( function() {
    return md5( this.email );
  });

  // we need this to make the virtuals availiable in the responses
  schema.set('toJSON', { virtuals: true });

  var model = connection.model( 'User', schema );

  /**
   * Model Access methods
   */  
  return {
    model: model,

    /**
     * getUser( id, callback )
     * -
     * id: username, email or _id
     * callback: function( err, user )
     */      
    getUser: function( id, callback ) {
      var query = {},
          field = "email";

      // Parse out field type
      if ( id.match( /^\d+$/g ) ) {
        field = "_id";
      } else if ( id.match( /^[^@]+$/g ) ) {
        field = "username";
        id = id.toLowerCase();
      } 
      query[ field ] = id;

      model.findOne( query, callback );
    },
    /**
     * createUser( data, callback )
     * -
     * data: JSON object containing user fields
     * callback: function( err, thisUser )
     */      
    createUser: function( data, callback ) {
      var user;

      if ( !data ) {
        return callback( "No data passed!" );
      }

      if ( !data.username ) {
        return callback( "No username passed!" )
      }

      // Copies user input for username verbatim before lowercasing
      data.fullName = data.username;
      data.username = data.username.toLowerCase();

      user = new this.model( data );

      // Delegates all server-side validation to mongoose during this step
      user.save( callback );
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
        if ( err || !user  ) {
          return callback( err || "User not found!" );
        } 

        // Selectively update the user model
        Object.keys( data ).forEach( function ( key ) {
          user[ key ] = data[ key ];
        });

        user.save( callback );
      });
    },

    /**
     * deleteUser( data, callback )
     * -
     * id: _id
     * callback: function( err, thisUser )
     */      
    deleteUser: function ( id, callback ) {
      model.findByIdAndRemove( id , callback );
    },

    /**
     * getAllUsers( callback )
     * -
     * callback: function( err, users )
     */      
    getAllUsers: function ( callback ) {
      model.find( {}, callback );
    },

    /**
     * checkUsername( username, callback )
     * -
     * username: username to be checked
     * callback: function( err, restricted )
     */      
    checkUsername: function( username ) {
      UserHandle.count( { username: username }, function( error, count ){
        // DB error
        if ( error ) {
          return callback( error );
        }

        // Username in use
        if ( count ) {
          return callback( null, true );
        }

        // Username blacklisted
        if ( badword( name ) ) {
          return callback( "badword" );
        }

        // By default, username availiable 
        callback( null, false );
      });
    }
  }
};
