If you wish to use the webmaker user bar in your webmaker.org app, you will need to follow a few steps. This should be considered a rough guide - ask for help in the #webmaker IRC channel when you run into problems.

### 1. Add the webmaker-loginapi module to your server

Your app will need to be able to speak to persona (for server-side validation and logout). You will need the [`webmaker-loginapi`](https://github.com/mozilla/node-webmaker-loginapi) module installed to accomplish this, and detailed instructions can be found in the module's [README](https://github.com/mozilla/node-webmaker-loginapi/blob/master/README.md).

### 2. Setting up the Login ENV file

Servers can only communicate with the Login server if its ENV file has been configured to allow it. Full details can be found in the [ENV reference for the Login server](https://github.com/mozilla/login.webmaker.org/wiki/ENV-File-Reference). On production & staging, these will be configured by our devops team. 

For local development, we recommend using the default ENV settings as a base, and adding only what you need to support the new server. Following this approach, this is what you'll need to update in the login `.env` file:

`ALLOWED_DOMAINS="http://localhost:3000 http://localhost:8888 http://localhost:7777"`
* All servers running locally need to have their full URI listed here in order for the Login server to accept requests from that domain. If you're using the default configuration, add your new server's URI to the end of this space-delineated list.

### 3. Include the Login server's CSS file in your master template

The Login server exposes CSS for use with its Single-sign-on solution, so make sure to include it in any client-side templates you require SSO functionality on:

```html
<link rel="stylesheet" href="{{ login-url }}/css/nav.css" />
```

### 4. Add the HTML for the SSO bar.

Add the following snippet to your HTML templates, below <body> but before any other content:

```html
    <div id="webmaker-nav">
      <nav class="webmaker-nav-container">
        <div class="lang-picker">
          <select id="lang-picker" data-supported="{{supportedLanguages}}">
          {% for language in listDropdownLang %}
            <option {% if languageNameFor(localeInfo.lang) == languageNameFor(language) %} selected="selected" {% endif %} value="{{language}}">{{ languageNameFor(language) }}</option>
          {% endfor %}
          </select>
        </div>
        <div class="butter-btn-menu-container butter-project-menu">
          <a class="butter-btn btn-white butter-project-menu-control butter-btn-menu-control"><span class="icon icon-only icon-reorder"></span></a>
          <ul class="butter-btn-menu">
            <li><a href="/{{localeInfo.lang}}/" target="_blank"> <span class="icon icon-file-alt"></span> {{ gettext("New") }}</a></li>
            <li><a class="butter-clear-events-btn" target="_blank"> <span class="icon icon-remove"></span> {{ gettext("Clear Events") }}</a></li>
            <li><a class="butter-remove-project-btn" target="_blank"> <span class="icon icon-trash"></span> {{ gettext("Delete Project") }}</a></li>
          </ul>
        </div>

        <div class="webmaker-nav user-info">
          <div class="user">
              {{ gettext("Hi") }} <span id="identity" class="user-name-container"></span> <span class="icon icon-caret-down"></span>
          </div>
          <ul class="menu-container">
            <li class="my-makes"><span class="icon icon-th-large"></span> <button>{{ gettext("My makes") }}</button></li>
            <li class="login"><span class="icon icon-signout"></span><iframe src="{{audience}}/{{localeInfo.lang}}/sso/include.html" class="include-frame"></iframe>
            {% if togetherjsEnabled %}
              <li><span class="icon icon-comments-alt"></span><button class="together-toggle">{{ gettext("Collaborate") }}</button></li>
            {% endif %}
            </li>
          </ul>
        </div>

        <div class="back-to-webmaker"><span class="icon webmaker-icon"></span> <a href="{{audience}}/{{localeInfo.lang}}">Webmaker.org</a></div>

      </nav>
      <div class="my-projects-container">
        <iframe class="my-projects-iframe"></iframe>
      </div>
    </div>
```

### 5. Link to our SSO javascript file called "include.js"

This SSO component is served from the Webmaker.org server, and should be included right before the closing `</body>` tag in your master template:

```html
<script src="{{ WEBMAKER_DOT_ORG_URI }}/sso/include.js"></script>
```

### 6. Custom login/logout handling

`include.js` will define default logic to run on log-in/log-out, but you can specify custom logic that runs after the user bar logs someone in or out (in order to effect UI changes for your app, for instance). This requires setting up a `navigator.idSSO.app` object in your client-side pages:

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

This must be included after the Persona `include.js`, or — if custom login/logout handlers are used — after the `<script>` block from step 6.

```html
<script src="{{ LOGIN_SERVER_URI }}/js/sso-ux.js"></script>
```

### 8. Put the user's session email into your master template

SSO requires access to the user's session email, which must be rendered on the server-side before client-side pages are sent to the user. Add the following snippet to your HTML templates' `<head>` section, and render it based on the person-created `req.session.email` value:

```html
  <meta name="persona-email" content="{ req.session.email }">
```

If `req.session.email` is known during page serving, the user may already be logged in and this value should be the user's Persona email address. If it is not set, this value should be an empty string.

