/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

var habitat = require('habitat');
var env = new habitat(null, {
  port: 5000
});
var urlutil = require('url');

// In here we hack the environment variables that habitat uses based on
// VCAP_SERVICES provided by CloudFoundry
require('./cloudfoundry-env');

module.exports = env;