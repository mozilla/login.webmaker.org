login.webmaker.org (core)
==================

This is our Single-Sign-On (SSO) server and identity provider for webmaker.org and all our additional Webmaker websites; sign in once, sign in everywhere!

**NOTE: This README assumes that you have all the required external dependencies installed and have a working dev environment. New to Webmaker? Make sure to read our <a href="https://wiki.mozilla.org/Webmaker/Code">developer guide</a> for everything you need in order to get started!**

## 1. Prerequisites

Running this server requires running the other core nodes (<a href="https://github.com/mozilla/MakeAPI">*MakeAPI*</a> and <a href="https://github.com/mozilla/webmaker.org">*Webmaker.org*</a>) in order to function properly. For more information on Webmaker's external dependencies, see our <a href="https://wiki.mozilla.org/Webmaker/Code">developer guide</a>.

## 2. Installing & running the server

Installation:

1. Clone the repo with `git clone https://github.com/mozilla/login.webmaker.org.git`
2. In the root folder of the login server, copy `env.sample` into a new file named `.env`
3. Run `npm install`

**NOTE**: The `.env` file contains settings for various aspects of the Login server's operation. In the majority of development use-cases, the default settings will be enough.

Running the server:

1. For browser work, ensure that the core service <a href="https://github.com/mozilla/webmaker.org/blob/master/README.md">*Webmaker.org*</a> is installed and running.
2. Run `node app` or `node app.js` from the root folder of the login server

## 3. Testing
### How to test
We use a combination of technologies to "lint" and test our CSS and Javascript code. These tests **must** pass in order for a pull request to be merged into the Mozilla repository. To run them locally,

1.  Navigate to the root folder of the login server
2.  Run `npm test`

### TravisCI
When a pull request is made to the Mozilla repository, it is automatically scheduled for testing on the [Travis-CI continuous-integration platform](https://travis-ci.org/). This verifies that the code passes linting requirements as well as all of its unit tests. You can see the status of these tests on the Github page for the pull request, and on the <a href="https://travis-ci.org/mozilla/login.webmaker.org/pull_requests">login.webmaker.org travisCI page</a>.

### Updating tests
Most developers won't need to update the tests, but changes to the Login API require that the tests be revised. Keeping these tests accurate is essential for easy maintenence of this code base, and pull requests that change the API will be rejected without proper unit tests.

If you think you have modified the Login API and need help understanding the unit tests, hop on the #webmaker IRC channel and we'll be happy to help!

## 4. Resources

### RESTful API & User Model
Full documentation of the Login server's RESTful API and the data model for Webmaker users can be found [here](https://github.com/mozilla/login.webmaker.org/wiki/LoginAPI-&-User-Model).

### Environment Variables
Full documentation of the Login server's `.env` file can be found [here](https://github.com/mozilla/login.webmaker.org/wiki/ENV-File-Reference).

##  5. Filing and working with bugs

Our bug tracker is located at <a href="bugzilla.mozilla.org">bugzilla.mozilla.org</a>. New bugs can be filed <a href="https://bugzilla.mozilla.org/enter_bug.cgi?product=Webmaker&component=Login">here</a>.

**(recommended) Read our <a href="https://wiki.mozilla.org/Webmaker/Code#2._Find_or_File_a_Webmaker_Bug">Developer Guide section on working with Bugzilla</a> for more information on how to file bugs properly.**

##  6. Integration
Adding SSO to a new Webmaker app? See our integration guide [here](https://github.com/mozilla/login.webmaker.org/wiki/Integration-guide-for-new-apps), and make sure to ask questions on the #webmaker IRC channel!

##  7. Metrics and logging
The Login server uses a number of technologies, like [STATSD](https://github.com/etsy/statsd/) and [New Relic](http://newrelic.com/), to collect and analyze useful performance data. For local development, this shouldn't be a concern.

For more information on configuring the Login server's New Relic module, see: https://github.com/newrelic/node-newrelic/#configuring-the-agent
