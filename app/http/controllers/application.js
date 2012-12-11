/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

exports.allowCorsRequests = function(req, resp, next){
  // TODO: Keep a configured list of allowed origins
  resp.header('Access-Control-Allow-Origin', '*');
  resp.header('Access-Control-Allow-Methods', 'POST');
  // Access-Control-Allow-Headers
  next();
};
