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

### 4. Link to our external JS file and instantiate the personaSSO functionality

For the best performance put this at the bottom of your HTML file, just before the closing ```</body>```

```html
<script type="text/javascript" src="http://code.jquery.com/jquery-1.8.2.min.js"></script>
// yes we rely on jQuery - if this is a problem file a bug!
<script src="http://{webmaker.sso.domain}/js/sso.js"></script>
<script type="text/javascript">
  $(function(){
    var personaSSO = navigator.personaSSO;
    personaSSO.init(document.getElementById('SSO'));
    personaSSO.id.watch({
      onlogin: function(topic, data){
        personaSSO.ui.checkMaker(data, $("#webmaker-nav"));
      },
      onlogout: function(){
        personaSSO.ui.loggedOut();
      }
    });
  });
</script>
```
