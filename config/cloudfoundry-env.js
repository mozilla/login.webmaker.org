/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */


/**
 * Convert "1", "true", "True", "t", "T" to true, all others to false
 *
 */
function testForTruthiness( string ){
  return /^1|t(rue)?/i.test( string );
}

// Here we hack the environment variables that habitat uses based on VCAP_SERVICES provided by CloudFoundry
function hackEnvironment() {
  if ( !process.env.VCAP_SERVICES || testForTruthiness( process.env.IGNORE_VCAP ) )
    return;

  var vcapServices;

  try {
    vcapServices = JSON.parse( process.env.VCAP_SERVICES );
  } catch(e) {
    throw new Error( 'Could not parse VCAP_SERVICES: ' + e.message );
  }

  for ( var service in vcapServices ) {
    if ( /^redis/.test( service ) ){
      var creds = vcapServices[service][0].credentials;
      process.env.REDIS_HOST = creds.host;
      process.env.REDIS_PORT = creds.port;
      process.env.REDIS_PASS = creds.password;
    }
  }

  process.env.OPENBADGER_HOST = process.env.VCAP_APP_HOST;
  process.env.OPENBADGER_PORT = process.env.VCAP_APP_PORT;
}

hackEnvironment();