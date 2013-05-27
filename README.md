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

Head to either <a href="http://localhost:3001">http://localhost:3001</a> or <a href="http://localhost:3002">http://localhost:3002</a> (or both) and sign in.

On first-time login, the page will slide down a dialog that lets you pick a subdomain to use. Fill in something interesting, accept the terms, and continue. On subsequent logins, you will not be faced with this dialog.

### Tests

We use <a href="http://gruntjs.com/">Grunt</a> to lint our CSS and JS and these tests are run on each pull request sent into the mozilla repo using <a href="https://travis-ci.org/mozilla/login.webmaker.org">travis-ci</a>.

If you want to check your code passes before sending in a pull request (and ensure no breaking builds) then:

* ensure that grunt is installed globally on your system - `npm install -g grunt`
* run `grunt --travis test`

## Bugs

Bugs can be found in Bugzilla - this is what <a href="https://bugzilla.mozilla.org/buglist.cgi?quicksearch=c%3Dlogin&list_id=6396195">bugs we have now</a>, if you notice anything else please <a href="https://bugzilla.mozilla.org/enter_bug.cgi?product=Webmaker&component=Login">file a new bug</a> for us.

## Integration

If you wish to use the webmaker user bar in your webmaker.org app, you will need to implement the following steps.

### 1. Add express-personaand the webmaker-loginapi modules

Your app will need to be able to speak to persona (for server-side validation and logout), as well as the webmaker login API. You will need the `express-persona`, https://github.com/jbuck/express-persona, and `webmaker-loginapi`, https://github.com/mozilla/node-webmaker-loginapi, modules installed.

Also note that the login API requires that  the `username:password` combination that you use to create your loginapi instance with needs to be known by the login server you are accessing. As such, you will have to make sure that it is one of the possible `username:password` combinations specified in the login server's environment variable `ALLOWED_USERS`.

Also, it is recommended to not hardcode the loginapi's endpoint with user credentials in your app, but to use an environment variable that you refer to in the code: `var loginapi = require("webmaker-loginapi")({make this an env. var});`.

### 2. Set up your environment variables

Ensure that you're using the correct values in your local .env file, make sure that the URL of your app is included in the ALLOWED_DOMAINS for this app. (For production and staging, these values have already been fixed to the webmaker.org production and staging domains).

For example, if we're integrating SSO into two apps running at http://localhost:8888 and http://localhost:7777, with the Login server running at http://localhost:3000, you would need to include the following in the .env of login.webmaker.org:

`ALLOWED_DOMAINS="http://localhost:3000 http://localhost:8888 http://localhost:7777"`

For testing purposes, your app's Persona `AUDIENCE` variable can be set to the following:

`AUDIENCE="http://webmaker.mofostaging.net"`

and your app's `LOGIN` variable can be set to the following:

`LOGIN="http://login.mofostaging.net"`


### 3. Include this app's CSS file in your master template

```html
<link rel="stylesheet" href="<%= login %>/css/nav.css" />
```

For staging/dev work, you can use `http://login.mofostaging.net` instead of the `login` variable.

### 4. Add the following snippet to your HTML page, below <body> but before any other content in the required HTML for the Webmaker navigation bar

```html
<div id="webmaker-nav">
  <!-- the webmaker bar -->
  <nav class="webmaker-nav-container">
    <a id="logo" href="https://webmaker.org"><img src="<%= login %>/img/webmaker-logo.png" alt="Mozilla Webmaker" /></a>
    <ul class="webmaker-nav user-info">
      <li class="user">
        Hi <span id="identity" class="user-name-container"></span>
      </li>
      <li class="makes"><button>My makes</button></li>
      <li>
        <button id="webmaker-login">Sign in to save <span>Sign up</span></button>
        <button id="webmaker-logout">Sign out</button>
      </li>
    </ul>
  </nav>
  <div class="my-projects-container">
    <iframe src="<%= audience %>/myprojects?app=<%= appname %>&email=<%= email %>"></iframe>
  </div>
</div>
```

### 5. Link to our external JS file

For the best performance put this at the bottom of your HTML file, just before the closing ```</body>```

```html
<script src="http://webmaker.mofostaging.net/sso/include.js"></script>
```

### 6. If you need your own login / logout event handling

You can specify custom event handlers to be triggered after the user bar logs someone in or out (in order to effect UI changes for your app, for instance). This requires setting up a `navigator.idSSO.app` object in the following manner:

```html
<script>
  navigator.idSSO.app = {
    onlogin: function(loggedInUser, displayName) {
      // your code here
    },
    onlogout: function() {
      // your code here
    }
  };
</script>
```
Note that you do not need to provide both event handlers; if you only need one, the other can be left out without leading to any errors.

### 7. Include our sso-ux script

This include must be included after the Persona `include.js`, or —if custom event handlers are used— after the custom event handling script block.

```html
<script src="http://login.mofostaging.net/js/sso-ux.js"></script>
```

### 8 Set up the persona handler

The persona block that you will need to add to your app.js consists of the following code:

```javascript
persona(app, {
  audience: env.get( "AUDIENCE" )
});
```

Make sure you also follow the instructions on setting up express-persona mentiond in step 1.

This will let you use `req.session.email` in the rest of your code.


### 9 put the session email into your master template, when known

Add the following snippet to you HTML `<head>` section, and render it based on the person-created `req.session.email` value:

```html
  <meta name="persona-email" content="{value from req.session.email}">
```

If `req.session.email` is known during page serving, the user may already be logged in and this value should be the user's Persona email address. If it is not set, this value should be an empty string.

### 10 Set up a /user/:id route in your app

Finally, add the Login API user route to your app.js:

```javascript
app.get( "/user/:userid", function( req, res ) {
  loginAPI.getUser(req.session.email, function(err, user) {
    if(err || !user) {
      return res.json({
        status: "failed",
        reason: (err || "user not defined")
      });
    }
    req.session.webmakerid = user.subdomain;
    res.json({
      status: "okay",
      user: user
    });
  });
});
```

This will let you use `req.session.webmakerid` in the rest of your code.


## New Relic

To enable New Relic, set the `NEW_RELIC_ENABLED` environment variable and add a config file, or set the relevant environment variables.

For more information on configuring New Relic, see: https://github.com/newrelic/node-newrelic/#configuring-the-agent
