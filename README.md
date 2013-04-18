login.webmaker.org
==================

This is currently demo implementation of Single Sign-on using <a href="http://persona.org">Persona</a>. The end goal is for it to be the SSO server for the webmaker.org applications.

There are a few TODOs that make this not ready for an actual deployment. -- See <a href="https://github.com/mozilla/login.webmaker.org/issues">Issues</a>.

# Getting the Server Up and Running

There are *three* things you need to do to get this running:

1. Create and configure a `.env` file.
2. Run a `redis-server` instance
3. Run foreman

## Configuration

tl;dr: Copy the `.env.sample` file in the project root to `.env`.

login.webmaker.org attempts to conform to the <a href="http://www.12factor.net">twelve factor methodology</a>. If using <a href="http://blog.daviddollar.org/2011/05/06/introducing-foreman.html">foreman</a>, create a .env file and populate with the following variables:

###LOG_LEVEL

Standard Winston log levels

###PORT

Port for the HTTPD to listen on, use 3000 for development

###SESSION_SECRET

Any Gobbledygook will do, bonus points for humor.

###AUDIENCE

This is the persona audience of the SSO server. For dev mode, use "http://localhost:3000"

###ALLOWED_DOMAINS

If using the dev servers in development mode, use:
"http://localhost:3001", "http://localhost:3002"

Otherwise something like:

ALLOWED_DOMAINS='["*.webmaker.org"]'

###MONGO_URL

Connection string for local MongoDB instance and DB

For example:

MONGO_URL="mongodb://localhost:27017/local_webmakers"

## Installing Dependencies

Packages are managed using npm, so:

```
npm install
```

## Foreman

For running the dev instances do:

```
foreman start -f Procfile.dev
```

Then visit <a href="http://localhost:3001/">http://localhost:3001/</a> and sign in. If you visit <a href="http://localhost:3002/">http://localhost:3002/</a> you'll notice that you're signed in there too. Magic.

In fact, if you have them both open at the same time, they update with a short delay.

## Integration

See app/dev/public/index.html for application usage.
