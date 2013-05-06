login.webmaker.org
==================

This is our SSO server and identity provider for webmaker.org and all our additional Webmaker websites; sign in once, sign in everywhere!

## Getting the Server Up and Running Locally

The app is written using <a href="http://nodejs.org/">nodejs</a>, requires npm for package management and (to make running multiple servers at once easier) ruby (we run the app locally using <a href="http://ddollar.github.io/foreman/">foreman</a>).

Once you have those you can get things up and running by:

1. Install npm modules - `npm install`
2. Install and start up a <a href="http://docs.mongodb.org/manual/tutorial/install-mongodb-on-os-x/">local MongoDB instance</a>
3. Create and configure a `.env` file - copy the `.env.sample` file we've provided.
4. Install <a href="http://ddollar.github.io/foreman/">foreman</a> (if you don't have it) - `gem install foreman`
5. Run foreman - `foreman start -f Procfile.dev`

Head to either <a href="http://localhost:3001">http://localhost:3001</a> or <a href="http://localhost:3002">http://localhost:3002</a> (or both) and sign-up.

### Tests

We use <a href="http://gruntjs.com/">Grunt</a> to lint our CSS and JS and these tests are run on each pull request sent into the mozilla repo using <a href="https://travis-ci.org/mozilla/login.webmaker.org">travis-ci</a>.

If you want to check your code passes before sending in a pull request (and ensure no breaking builds) then:

* ensure that grunt is installed globally on your system - ```npm install -g grunt```
* run ```grunt --travis test```

## Bugs

Bugs can be found in Bugzilla - this is what <a href="https://bugzilla.mozilla.org/buglist.cgi?quicksearch=c%3Dlogin&list_id=6396195">bugs we have now</a>, if you notice anything else please <a href="https://bugzilla.mozilla.org/enter_bug.cgi?product=Webmaker&component=Login">file a new bug</a> for us.

## Integration

### 1. Set up your environment variables

Ensure that you're using the correct values in your local .env file, make sure that the URL of your app is included in the ALLOWED_DOMAINS.

For example, if were integrating SSO into two apps running at http://localhost:8888 and http://localhost:7777, you would need to include the following in the .env of login.webmaker.org:

```ALLOWED_DOMAINS="http://localhost:8888 http://localhost:7777"```

### 2. Link through to our CSS file in your master template

```html
<link rel="stylesheet" href="http://{webmaker.sso.domain}/css/nav.css" />
```

### 3. Include in the required HTML for the Webmaker navigation bar

```html
<div id="webmaker-nav">
  <nav class="webmaker-nav-container">
    <ul class="webmaker-nav primary">
      <li><a>Webmaker</a></li>
    </ul>
    <ul class="webmaker-nav user-info">
      <li class="user">
        <div class="user-name">
          <span id="identity" class="user-name-container"></span>
        </div>
      </li>
      <li><iframe id="SSO"></iframe></li>
    </ul>
  </nav>
</div>
```

### 4. Link to our external JS file

For the best performance put this at the bottom of your HTML file, just before the closing ```</body>```

```html
<script src="http://{webmaker.sso.domain}/js/sso.js"></script>
```
### 5. If you need to override our defaults

By default, sso.js will initialise based on the element with id ```SSO```, and will use two default event handlers. However, if you wish to override this (for whatever reason) you can include the following HTML, customized to your needs, prior to loading the sso.js file:

```html
<script type="text/x-webmaker-sso-config">
  var config = {
    target: document.getElementById('SSO'),
    onlogin: function(eventName, personaData) {
      var userid = personaData.loggedInUser,
          assertion = personaData.assertion;
      // ...your code goes here...
    },
    onlogout: function() {
      // ...your code goes here...
    }
  };
</script>
```
Note that you do not need to provide all three properties; any property not added will fall back to the default.

Code inside the config block can also make use of ```window```, ```document``` and jQuery, so that your login/out handlers can make use of persistent variables and on-page elements. As an example:

```html
<script type="text/x-webmaker-sso-config">
  var loggedIn = false,
      actionButton = false;
  var config = {
    target: document.getElementById('SSO'),
    onlogin: function(eventName, personaData) {
      loggdIn = true;
      if (!actionButton) {
        actionButton = $("#actionbutton");
      }
      actionButton.show();
    },
    onlogout: function() {
      loggdIn = false;
      if (actionButton) {
        actionButton.hide();
      }
    }
  };
</script>
```

Note that your variables do not become globals, they are scoped so that they only work in combination with your login and logout handlers.

## New Relic

To enable New Relic, set the `NEW_RELIC_ENABLED` environment variable and add a config file, or set the relevant environment variables.

For more information on configuring New Relic, see: https://github.com/newrelic/node-newrelic/#configuring-the-agent

## Deploying to Heroku

If you want to test this code in a live environment, you can spin up a heroku instance, and simply push up the master branch code. (read the heroku tutorial on deploying a node.js application. If you follow the instructions, it's super simple).

In addition to a standard node.js deploy, you will also need to add the "mongohq" addon to your heroku instance. The website explains how to do this quite well, but you will need to tie a creditcard to your heroku account. As long as you make sure to add the `sandbox` plan for mongohq, no fees will be incurred (The sandbox is free, and allows up to 50MB of storage, which is enough for testing purposes)

You will need to issue some environment "SET" commands to make sure things work:

```
> heroku config:set ALLOWED_DOMAINS="<your heroku consumer application>"
> heroku config:set AUDIENCE="<the login heroku instance url>"
> heroku config:set COOKIE_DOMAIN=".herokuapp.com"
> heroku config:set MONGO_URL="<the same as the MONGOHQ_URL after adding the mongohq addon>"
> heroku config:set SESSION_SECRET="<salting string>"
> heroku config:set PARSER_SECRET="<another salting string>"
```

Make sure that the `PARSER_SECRET` and `SESSION_SECRET` that you use for your login.webmaker.org heroku instance match the values these environment variables have for your consumer application, or there will be a cookie mismatch.
