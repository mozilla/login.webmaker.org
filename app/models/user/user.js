var mongoose = require('../../../lib/mongoose.js'),
validate = require('mongoose-validator').validate;

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
    validate: validate('isAlphanumeric')
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

var User = mongoose.model('User', schema);

module.exports = User;
