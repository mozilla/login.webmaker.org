[![Build Status](https://travis-ci.org/mozilla/login.webmaker.org.png)](https://travis-ci.org/mozilla/login.webmaker.org)

login.webmaker.org
==================

This is our SSO server and identity provider for webmaker.org and all our additional Webmaker websites; sign in once, sign in everywhere!

## Getting the Server Up and Running Locally

The app is written using <a href="http://nodejs.org/">nodejs</a> and uses <a href="https://npmjs.org/doc/">npm</a> for package management, but all you require to run the server is [Docker](https://www.docker.com/). Check out the instructions on how to set Docker up for [Mac](https://docs.docker.com/docker-for-mac/), [Windows](https://docs.docker.com/docker-for-windows/) and [Linux](https://docs.docker.com/engine/getstarted/step_one/).

Once you have Docker installed, you can get things up and running by:

1. Using the default environment configuration:

**On Linux or OSX**
```
$ sh ./run.sh env
```
**On Windows**
```
$ run.bat env
```

2. Starting the server:

**On Linux or OSX**
```
$ sh ./run.sh
```
**On Windows**
```
$ run.bat
```

Any changes you make to the source code will automatically restart the server in the Docker container. The following files are exceptions to this, i.e. they will require you to re-run step 2:
* package.json
* bower.json
* Gruntfile.js
* app.js

### Tests

We use <a href="http://gruntjs.com/">Grunt</a> to lint our CSS and JS and these tests are run on each pull request sent into the mozilla repo using <a href="https://travis-ci.org/mozilla/login.webmaker.org">travis-ci</a>.

If you want to check your code passes before sending in a pull request (and ensure no breaking builds) then:

**On Linux or OSX**
```
$ sh ./run.sh test
```
**On Windows**
```
$ run.bat test
```

## New Relic

To enable New Relic, set the `NEW_RELIC_ENABLED` environment variable and add a config file, or set the relevant environment variables.

For more information on configuring New Relic, see: https://github.com/newrelic/node-newrelic/#configuring-the-agent
