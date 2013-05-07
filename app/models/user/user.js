var isFriendly, isEmail, isDomain;

function isFriendly (val, callback) {
  var env = require("../../../config/environment"),
      request = require("request");

  request(env.get( "AUDIENCE" ) + "/user/blacklist/" + val + "/", function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var json = JSON.parse(body);
      console.log( !json.found, 'isFriendly' );
      callback( !json.found );
    }
  });
}

function isDomain (val) {

  return ( "string" === typeof( val ) &&
    ( val.length <= 20 && val.length >= 1 ) &&
    val.search(/^[a-zA-Z0-9\-\_]+$/) !== -1
  );
}

function isEmail (val) {
  return val.match(/^(?:[\w\!\#\$\%\&\'\*\+\-\/\=\?\^\`\{\|\}\~]+\.)*[\w\!\#\$\%\&\'\*\+\-\/\=\?\^\`\{\|\}\~]+@(?:(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9\-](?!\.)){0,61}[a-zA-Z0-9]?\.)+[a-zA-Z0-9](?:[a-zA-Z0-9\-](?!$)){0,61}[a-zA-Z0-9]?)|(?:\[(?:(?:[01]?\d{1,2}|2[0-4]\d|25[0-5])\.){3}(?:[01]?\d{1,2}|2[0-4]\d|25[0-5])\]))$/);
}

// Exports
module.exports = function ( connection ) {

  var schema = new connection.Schema({
    _id: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      validate: [isEmail, "Please use a valid email address"]
    },
    /**
     * subdomain - the user's chosen subdomain. This is also
     * the user's shortname/nickname, like Twitter's @name.
     */
    subdomain: {
      type: String,
      required: true,
      unique: true,
      validate: [
        { validator: isDomain, msg: "Invalid subdomain. All subdomains must be between 1-20 characters, and only include \"-\", \"_\" and alphanumeric characters" },
        { validator: isFriendly, msg: "Ooooooh that's a very bad word" }
      ]
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
