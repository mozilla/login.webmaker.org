/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */


exports.create = function (req, res) { 
	var Users    = require("../../models/user")
	  , userInfo = req.body
	  , data     = {};

	userInfo._id = userInfo.email;

	var user = new Users(userInfo);

	console.log("userInfo")

	user.save( function(err, thisUser) {
		if (err) {
			data.error = err;
		}
		else {
			data.error = null;
			data.displayName = thisUser.displayName;
		}
		res.send(data);
	})
};