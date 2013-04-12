/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

exports.allowCorsRequests = function(req, resp, next){
  var allowed = process.env.ALLOWED_DOMAINS.split(' ')
    , i
    , origin = req.get('origin'); // TODO: Check if this is spoof-proof 

  console.log("Req.get(origin): ", req.get('origin'))

  for (i = 0; i < allowed.length; i++) {
  	if ( origin === allowed[i] ) {
	  resp.header('Access-Control-Allow-Origin', allowed[i]);
  	}
  }

  resp.header('Access-Control-Allow-Methods', 'POST');
  // Access-Control-Allow-Headers
  next();
};
