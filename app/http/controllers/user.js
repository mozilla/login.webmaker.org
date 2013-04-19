/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

var UserHandle    = require("../../models/user");

exports.create = function (req, res) { 
    var userInfo = req.body;

	userInfo._id = userInfo.email || null;

	var user = new UserHandle(userInfo);

	// Delegates all validation to mongoose during this step
	user.save( function(err, thisUser) {
		if (err) {
            res.JSON( 500, { error: err, user: null } );
            return;
		}

		res.JSON( 200, { error: null, user: thisUser } );
	});
};

exports.get = function (req, res) { 
	var id = req.params.id;

	UserHandle.findById( id, function (err, user) {
		if (!user.length || err) {
            res.JSON( 500, { error: err || "User not found for ID: " + id, user: null} );
            return;
		}

        res.JSON( 200, { error: null, user: user } );
	});
};

exports.update = function (req, res) {
	var userInfo = req.body,
        id       = req.params.id;
  
	UserHandle.findByIdAndUpdate(id, userInfo, function (err, user) {
		if (err || !user) {
            res.JSON( 500, { error: err || "User not found for ID: " + id, user: null} );
            return;
		} 

		if (userInfo.isSuspended) {
			// Suspension logic here, calls to MakeAPI?
		}

        res.JSON(200, { error: null, user: user } );
	}); 
};

exports.del = function (req, res) {
	var id   = req.params.id;

	UserHandle.findByIdAndRemove(id , function (err, user) {
		if (!user || !user.length) {
            res.JSON( 500, { error: err || "User not found for ID: " + id, user: null} );
            return;
		}
        else {
			// Cascading content deletion logic here

			// TODO: Investigate cascading purge of user content
		}

		res.JSON(200, { error: null, user: user });
	});
};

exports.userForm = function(req,res) {
	res.render('ajax/forms/new_user');
};

/**
 * You can post stuff to this like so:
 * $.ajax({
 *   type: "POST",
 *   url: "http://localhost:3000/dev/delete"
 * });
 * Obviously this should never go anywhere near production - but it's helpful for now, and at least for me
 */
exports.devDelete = function(req, res) {
	var email = [
		"ross@mozillafoundation.org",
		"ross@ross-eats.co.uk",
		"rossbruniges10@yahoo.co.uk",
		"rossbruniges@gmail.com",
		"kieran.sedgwick@gmail.com"
	],
		User = require('../../models/user');

	email.forEach(function(m) {
		User.find({ email:m }).remove();
	});

	res.send("Deleted!");
};
