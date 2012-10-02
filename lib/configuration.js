/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*
 * An abstraction which contains various pre-set deployment
 * environments and adjusts runtime configuration appropriate for
 * the current environmnet (specified via the NODE_ENV env var)..
 * Borrowed from the browserid project. -- Thanks @lloyd.
 * (https://github.com/mozilla/browserid)
 *
 * usage is
 *   exports.configure(app);
 */

const
path = require('path'),
semver = require('semver'),
fs = require('fs'),
convict = require('convict'),
cjson = require('cjson');

process.env.APP_ROOT = path.join(path.dirname(module.filename), '..');

// verify the proper version of node.js is in use
try {
  var required = 'unknown';
  // extract required node version from package.json
  required = JSON.parse(fs.readFileSync(path.join(__dirname, '..', "package.json"))).engines.node;
  if (!semver.satisfies(process.version, required)) throw false;
} catch (e) {
  process.stderr.write("update node! verision " + process.version +
                       " is not " + required +
                       (e ? " (" + e + ")" : "") + "\n");
  process.exit(1);
}

console.log(process.env.APP_ROOT + "/config/schema");

var conf = module.exports = convict(require(process.env.APP_ROOT + "/config/schema"));


console.log("Initializing. Environment: " + conf.get('env'));

// Here we set NODE_ENV in case we're defaulting to prod. 
// If NODE_ENV is already set, it'll be the same as conf.get('env')
process.env.NODE_ENV = conf.get('env');

// Here we load config/base.json and then overlay config/environments/{{NODE_ENV}}.json
conf.load(cjson.load(path.join(__dirname, '..', 'config', 'base.json')));
conf.load(cjson.load(path.join(__dirname, '..', 'config', 'environments', conf.get('env') + '.json')));

try{
  // validate the configuration based on the above specification
  conf.validate();
} catch(ex){
  console.log("\nError validating configuration! \n\tSee " + __filename + ". \n\tError: " + ex);
  process.exit();
}

// Replace any settings with those discovered in VCAP_SERVICES 
if (process.env.VCAP_SERVICES){
  var vcapServices = JSON.parse(process.env.VCAP_SERVICES);
  
  conf.load({
    bind_to: {
      port: process.env.VCAP_APP_PORT
    }
  });
  
  // Ignore if set.
  if (!conf.get('redis')['ignore_vcap_service_creds']) {
    // TODO: have it look for /^redis/ to grab the config info
    var redisConfig = vcapServices['redis-2.2'][0];
    conf.load({
      redis: {
        host: redisConfig.credentials.hostname,
        port: redisConfig.credentials.port,
        password: redisConfig.credentials.password
      }
    });
  }
}
