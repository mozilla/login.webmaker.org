/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */


exports.create = function (req, res) {
	var User    = require('../../models/user'),
		userInfo = req.body,
		data     = {};

	userInfo._id = userInfo.email;

	var user = new User(userInfo);

	user.save( function(err, thisUser) {
		if (err) {
			data.error = err;
		} else {
			data.error = null;
			data.displayName = thisUser.displayName;
		}
		res.send(data);
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
		'ross@mozillafoundation.org',
		'ross@ross-eats.co.uk',
		'rossbruniges10@yahoo.co.uk',
		'rossbruniges@gmail.com'
	],
		User = require('../../models/user');

	email.forEach(function(m) {
		User.find({ email:m }).remove();
	});
};
