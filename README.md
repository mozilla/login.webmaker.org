[![Build Status](https://travis-ci.org/mozilla/login.webmaker.org.png)](https://travis-ci.org/mozilla/login.webmaker.org)

login.webmaker.org
==================

This is our SSO server and identity provider for webmaker.org and all our additional Webmaker websites; sign in once, sign in everywhere!

## Getting the Server Up and Running Locally

The app is written using <a href="http://nodejs.org/">nodejs</a> and uses <a href="https://npmjs.org/doc/">npm</a> for package management.

Once you have those you can get things up and running by:

1. Install npm modules - `npm install`
2. Use the default configeration - `cp env.sample .env`
3. Run the server - `node app.js`

### Tests

We use <a href="http://gruntjs.com/">Grunt</a> to lint our CSS and JS and these tests are run on each pull request sent into the mozilla repo using <a href="https://travis-ci.org/mozilla/login.webmaker.org">travis-ci</a>.

If you want to check your code passes before sending in a pull request (and ensure no breaking builds) then:

* ensure that grunt is installed globally on your system - `npm install -g grunt`
* run `grunt --travis test`

## Bugs

Bugs can be found in Bugzilla - this is what <a href="https://bugzilla.mozilla.org/buglist.cgi?quicksearch=c%3Dlogin&list_id=6396195">bugs we have now</a>, if you notice anything else please <a href="https://bugzilla.mozilla.org/enter_bug.cgi?product=Webmaker&component=Login">file a new bug</a> for us.

## New Relic

To enable New Relic, set the `NEW_RELIC_ENABLED` environment variable and add a config file, or set the relevant environment variables.

For more information on configuring New Relic, see: https://github.com/newrelic/node-newrelic/#configuring-the-agent
