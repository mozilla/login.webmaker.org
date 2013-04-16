/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

var UserHandle    = require("../../models/user")


exports.create = function (req, res) { 
	var userInfo = req.body
	  , out      = {
	  	error: null,
	  	displayName: null
	  };

	userInfo._id = userInfo.email;

	var user = new UserHandle(userInfo);

	console.log("UserInfo: ", userInfo);

	user.save( function(err, thisUser) {
		if (err) {
			out.error = err;
		}
		else {
			out.displayName = thisUser.displayName;
		}
		res.send(out);
	});
};

exports.get = function (req, res) { 
	var id   = req.params.id
	  , out  = {};

	UserHandle.find( { _id : id }, function (err, user) {
		if (!user.length || err) {
			out.error = err || "User not found for ID: " + id;
		}
		else {
			out.data = user[0];
		}
		res.send(out);
	})
};

exports.update = function (req, res) {
	// Overwrites all information, and thus expects all information
	// Also, this call acts to suspend an accounthttp://mongoosejs.com/docs/api.html#model_Model.findOneAndUpdate 


	// TODO: Examine client-side implications of this approach,
	//       including nested return information (see [out] var definition 
    //       below)

	var userInfo = req.body
	  , id       = req.params.id
	  , out      = {
	  	user: userInfo,
	  	error: null
	  };

	UserHandle.update( { _id : id }, userInfo, function (err, num, raw) {
		if (err || !num) {
			out.error = err || "User not found for ID: " + id;
		}

		req.send(out);
	}); 
}

exports.del = function (req, res) {
	var id = req.params.id
	  , out = {
	  	error: null,
	  	success: true
	  }

	UserHandle.findByIdAndRemove(id , function (err, user) {
		if (!user || !user.length) {
			out.error = err || "User not found for ID: " + id;
			out.success = false;
		} else {
			// Cascading content deletion logic here

			// TODO: Investigate cascading purge of user content
		}

		res.send(out);
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
