var mongoose = require('../../../lib/mongoose.js'),
validate = require('mongoose-validator').validate;

// Custom validation  
validate.extend( 'isDomain', function () {
  var str = this.str;

  return ( "string" === typeof( str ) 
    && ( str.length <= 20 && str.length >= 1 )
    && str.search(/^[a-zA-Z0-9\-\_]+$/) !== -1
  );
}, "Invalid name.  All names must be between 3-20 characters, and only include \"-\", \"_\" and alphanumeric characters");

var schema = new mongoose.Schema({
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
  name: {
    type: String,
    required: true,
    unique: true,
    validate: validate('isDomain')
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
  verifiedEmail: {
    type: Boolean,
    "default": false
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

var User = mongoose.model('User', schema);

module.exports = User;
