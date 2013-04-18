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
    createdAt: {
        type: Date,
        required: true,
        "default": Date.now
    },
    flags: {
        verifiedEmail: {
            type: Boolean,
            "default": false
        },
        isAdmin: {
            type: Boolean,
            "default": false
        }
    }
});

var User = mongoose.model('User', schema);

module.exports = User;
