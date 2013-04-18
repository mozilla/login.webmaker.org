/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

var UserHandle    = require("../../models/user")


exports.create = function (req, res) { 
	var userInfo = req.body
	  , code     = 200 
	  , out      = {
	  	error: null,
	  	user: null
	  };

	userInfo._id = userInfo.email || undefined;

	var user = new UserHandle(userInfo);

	// Delegates all validation to mongoose during this step
	user.save( function(err, thisUser) {
		if (err) {
			out.error = err; 
			code = 500;
		}
		else {
			out.user = thisUser;
		}
		res.send(code, out);
	});
};

exports.get = function (req, res) { 
	var id   = req.params.id
	  , code = 200
	  , out  = {
	  	error: null,
	  	user: null
	  };

	UserHandle.findById( id, function (err, user) {
		if (!user.length || err) {
			out.error = err || "User not found for ID: " + id; // TODO: Find approprite error codes
			code = 500;
		}
		else {
			out.data = user[0];
		}
		res.send(code, out);
	})
};

exports.update = function (req, res) {
	var userInfo = req.body
	  , id       = req.params.id
	  , code     = 200
	  , out      = {
	  	user: null,
	  	error: null
	  };

	UserHandle.findByIdAndUpdate(id, userInfo, function (err, user) {
		if (err || !user) {
			out.error = err || "User not found for ID: " + id;
			code = 500;
		} 
		else {
			out.user = user;
		}

		if (userInfo.isSuspended) {
			// Suspension logic here, calls to MakeAPI?
		}

		res.send(code, out); // TODO: Find approprite error codes
	}); 
}

exports.del = function (req, res) {
	var id   = req.params.id
	  , code = 200
	  , out  = {
	  	error: null,
	  	success: true
	  }

	UserHandle.findByIdAndRemove(id , function (err, user) {
		if (!user || !user.length) {
			out.error = err || "User not found for ID: " + id;
			out.success = false; // TODO: Find approprite error codes
			code = 500;
		} else {
			// Cascading content deletion logic here

			// TODO: Investigate cascading purge of user content
		}

		res.send(code, out);
	});
};

exports.userForm = function(req,res) {
	res.render('ajax/forms/new_user');
};

/*
You can post stuff to this like so:
$.ajax({
	type: "POST",
	url: "http://localhost:3000/dev/delete"
});
Obviously this should never go anywhere near production - but it's helpful for now, and at least for me
*/
exports.devDelete = function(req, res) {
	var email = [
		"ross@mozillafoundation.org",
		"ross@ross-eats.co.uk",
		"rossbruniges10@yahoo.co.uk",
		"rossbruniges@gmail.com",
		"kieran.sedgwick@gmail.com"
	],
		Users    = require("../../models/user");

	email.forEach(function(m) {
		Users.find({ email:m }).remove();
	});

	res.send("Deleted!");
};
