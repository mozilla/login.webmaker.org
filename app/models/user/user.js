// Custom validation
var mongoose_validator = require('mongoose-validator'),
    badword = require('badword');

mongoose_validator.extend( 'isBlackListed', function() {
  return !badword(this.str);
}, "Oooooh that's a bad word");

mongoose_validator.extend( 'isDomain', function () {
  var str = this.str;

  return ( "string" === typeof( str ) &&
    ( str.length <= 20 && str.length >= 1 ) &&
    str.search(/^[a-zA-Z0-9\-\_]+$/) !== -1
  );
}, "Invalid subdomain. All subdomains must be between 1-20 characters, and only include \"-\", \"_\" and alphanumeric characters");

// Exports
module.exports = function ( connection ) {
  var validate = mongoose_validator.validate;

  var schema = new connection.Schema({
    _id: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      validate: validate('isEmail')
    },
    /**
     * subdomain - the user's chosen subdomain. This is also
     * the user's shortname/nickname, like Twitter's @name.
     */
    subdomain: {
      type: String,
      required: true,
      unique: true,
      validate: [validate('isDomain'), validate('isBlackListed')]
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
   * fullName if we have it, but fallback to subdomain.
   */
  schema.virtual( 'displayName' ).get( function() {
    return this.fullName || this.subdomain;
  });

  return connection.model( 'User', schema );
};
