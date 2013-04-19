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
        validate: validate('isEmail')
    },
    displayName: {
        type: String,
        required: true,
        validate: validate('isAlphanumeric')
    },
    subdomain: {
        type: String,
        required: true
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
    }
    // TODO: Avatar support

});

var User = mongoose.model('User', schema);

module.exports = User;



