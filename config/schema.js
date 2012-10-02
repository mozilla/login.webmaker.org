/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */


module.exports = {
  env: {
    doc: "What environment are we running in?  Note: all deployments are 'deployed'.  ",
    //TODO: Perhaps unrestrict environment names.
    format: 'string ["deployed", "test", "development"] = "deployed"',
    env: 'NODE_ENV'
  },
  logger: {
    level: {
      doc: "The log level",
      format: 'string ["silent", "win", "error", "warn", "http", "info", "verbose", "silly"] = "info"',
      env: 'LOG_LEVEL'
    }
  },
  redis: {
    ignore_vcap_service_creds: {
      doc: "Ignore creds discovered via VCAP_SERVICES environment variable",
      format: 'boolean = false',
      env: 'REDIS_IGNORE_VCAP_SERVICES'
    },
    host: {
      doc: "The host where redis is listening",
      format: 'string = "localhost"',
      env: 'REDIS_HOST'
    },
    port: {
      doc: "The port that redis is listening on",
      format: 'integer{1,65535} = 6379',
      env: 'REDIS_PORT'
    },
    password: {
      doc: "The password for redis if applicable",
      format: 'string?',
      env: 'REDIS_PASSWORD'
    }
  },
  bind_to: {
    host: {
      doc: "The ip address the HTTP server should bind to",
      format: 'string = "127.0.0.1"',
      env: 'IP_ADDRESS'
    },
    port: {
      doc: "The port the HTTP server should bind to",
      format: 'integer{1,65535} = 80',
      env: 'PORT'
    }
  }
};
