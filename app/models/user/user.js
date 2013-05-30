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
    str.search(/^[a-zA-Z0-9\-\_]+$/) !== -1
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
     * username - the user's chosen username, like Twitter's @name.
     * This is also the user's subdomain.
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
     * fullName - the user's [optional] real name
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
      "default": true
    },
    sendEngagements: {
      type: Boolean,
      "default": true
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

  return connection.model( 'User', schema );
};
