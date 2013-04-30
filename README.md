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

## Client-side Integration

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


## Server-side Integration

If you want to be able to authenticate user actions on your app quickly and easily, follow these steps to persist the Login server's session to your app.

**NOTE**: Server-side integration is currently supported only by `Express 3.2.1`.  Update your app's `package.json` file to reflect this, and ensure you have installed the upgrade with `npm install` before trying the steps below!

### 1. Include the required SSO server-side code in your server-side app

When declaring your middleware in `express.configure`, add the following code before any routes are declared, replacing `express.cookieSession()` & `express.cookieParser()` if they exist:

```javascript
express.configure( function() {
  ...;
  ...;
  express.use(express.cookieParser());
  express.use(express.cookieSession({
    key: 'wm.sid',
    secret: "I sometimes feed lunch meat to my neighbour's \"vegan\" dog.",
    cookie: {
      maxAge: 2678400000, // 31 days
      domain: ".webmaker.local"
    },
    proxy: true
  }));
  ...;
})
```

If you have an .env file for your app, you can load the `secret` and `domain` values from there - but keep them identical to what you see in the snippet above.

### 2a. (WITH SUDO) Emulate running your app on a subdomain 

!! WARNING !!
This step makes the node server require superuser permissions to run, and temporarily modifies your host file. e.g. `sudo node server.js`
See: https://github.com/jed/localhose#localhoseset-host1-host2-etc- 

Add `localhose` (note the spelling) to your dev dependancies in your **package.json** file.  If you don't have one, add a field like this:

```javascript
devDependencies: {
  "localhose": "*",
}
```

Require `localhose` somewhere in your global application scope:

```javascript
localhose = require( "localhose" );
```

Then add this line before the server is started:

```javascript
localhose.set(YOUR_APP_NAME + ".webmaker.local");
```

Run `NPM install --dev` to install the localhose module. 

This allows you to access your app in the browser with `http://YOUR_APP_NAME.webmaker.local:port`.  For example if before, it looked like:

`localhost:7777`

it will now look like:

`YOUR_APP_NAME.webmaker.local:7777`

### 3. Update the Login server environment variable

You must now update the login server's environment variable file `.env` to allow this new domain in cross-origin requests, and to ensure the correct Persona audience.  

If before step 2, your app was accessed with `localhost:7777`, the ALLOWED_DOMAINS variable will look like this:

```
ALLOWED_DOMAINS="http://localhost:7777"
```

It must be changed to look like this:

```
ALLOWED_DOMAINS="http://YOUR_APP_NAME.webmaker.local:7777"
```

Also, ensure that SESSION_SECRET matches the secret attribute in the `cookieSession()` declaration from step 1:

```javascript
SESSION_SECRET="I sometimes feed lunch meat to my neighbour's \"vegan\" dog."
```

### 4. How to check for a user on your server-side app

After a webmaker has logged in, your middleware will have access to the session through `req.session.auth`.  If this attribute of `req.session` exists, the session is authenticated against login.webmaker.org and the user is considered trusted.

The `auth` attribute contains two sub-attributes:

```javascript
auth: {
  _id: "user's email",
  isAdmin: true/false
}
```
More information about the user (for example, their `subdomain`) can be retrieved directly from the login server using the Login API (https://github.com/mozilla/login.webmaker.org/wiki/LoginAPI-&-User-Model) combined with these sub-attributes.  

For example:

```javascript
http.use( function ( req, res ) {
  // Check for an authenticated user
  if (req.session.auth) {
    // Pull the _id from the session
    var _id = req.session.auth._id

    // Initiate a "get" request to the login server, passing a callback 
    // that uses the "subdomain" of the user
    http.get('http://login.webmaker.local:3000/user/' + _id, function (res) {
      console.log(res.body.user.subdomain);
    })
  }
})
```


