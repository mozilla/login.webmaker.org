/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Store sessions in redis
 */
exports.session = function () {
  var options = env.get('redis');
  options.db = env.get('redis_session_db');
  return express.session({
    key: 'login.webmaker.org.sid',
    store: new RedisStore(options),
    secret: env.get('secret'),
  });
};
