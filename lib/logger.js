/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const env = require('../config/environment');

var logger = require('winston');
logger.handleExceptions(new logger.transports.Console({ colorize: true, json: true, level: env.get('log_level')}));

module.exports = logger;
