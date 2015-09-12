# login.webmaker.org
> Login service for Webmaker.org https://login.webmaker.org

[![Build Status](https://travis-ci.org/mozilla/login.webmaker.org.png)](https://travis-ci.org/mozilla/login.webmaker.org)
[![Code Climate](https://codeclimate.com/github/mozilla/id.webmaker.org/badges/gpa.svg)](https://codeclimate.com/github/mozilla/id.webmaker.org)
[![David-DM](https://david-dm.org/mozilla/id.webmaker.org.svg)](https://david-dm.org/mozilla/id.webmaker.org)

`login.webmaker.org` is an [`Express`](http://expressjs.com/) application. It serve as the SSO server and identity provider for webmaker.org and all our additional Webmaker websites. It serves as the backend for [`id.webmaker.org`](https://github.com/mozilla/id.webmaker.org).

**NOTE: This project will be deprecated soon, shifting all identity services to [`id.webmaker.org`](https://github.com/mozilla/id.webmaker.org).**

## Prerequisites

- [Node](https://nodejs.org) and NPM, [installation](https://github.com/nodejs/node-v0.x-archive/wiki/Installing-Node.js-via-package-manager)
- [Postgres](http://www.postgresql.org/), [installation](http://www.postgresql.org/download/)

## Up and Running

1. Fork and clone this repository
2. Navigate to the directory of the repository, e.g. `cd login.webmaker.org`
3. `npm install` to install dependencies
4. Set configuration variables, by default `cp sample.env .env` or `copy sample.env .env` on Windows
5. `npm start`
6. Navigate your browser to [`http://localhost:3000`](http://localhost:3000)

## Tests

* ensure that grunt is installed globally on your system - `npm install -g grunt`
* run `grunt --travis test`

## Environment

This project requires several environment variables be configured before it is able to run. It uses a library called [`habitat`](https://github.com/brianloveswords/habitat) to load configuration from a `.env` file, as well as process and cli configuration.

A [`sample.env` file](https://github.com/mozilla/login.webmaker.org/blob/develop/sample.env) is included with this repository. Create a copy of `sample.env` named `.env` to use the default configuration. See the "Up and Running" section above for more instructions on how to do this.

You can customize these variables by editing the `.env` file in the root directory of the repository.

## New Relic

To enable New Relic, set the `NEW_RELIC_ENABLED` environment variable and add a config file, or set the relevant environment variables.

For more information on configuring New Relic, see: https://github.com/newrelic/node-newrelic/#configuring-the-agent
