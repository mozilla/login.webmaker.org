/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

exports.allowCorsRequests = function(req, resp, next){
  var allowed = env.get('ALLOWED_DOMAINS').split(' '),
      origin = req.get('origin'); // TODO: Check if this is spoof-proof

  /**
   * Browsers don't support passing a single list so we have to loop
   * and return a single domain when we detect a match
   */
  allowed.forEach(function(el, index, array) {
    if (origin === el) {
      resp.header('Access-Control-Allow-Origin', el);
    }
  });
  resp.header('Access-Control-Allow-Methods', 'POST');
  // Access-Control-Allow-Headers
  next();
};
