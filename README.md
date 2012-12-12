login.webmaker.org
==================

# Getting the Server Up and Running

## Configuration

login.webmaker.org attempts to conform to the <a href="http://www.12factor.net">twelve factor methodology</a>.

###LOG_LEVEL

Standard Winston log levels

###REDIS_HOST & REDIS_PORT

Used as a session store

###PORT

Port for the HTTPD to listen on, use 3000 for development

###SESSION_SECRET

Any Gobbledygook will do, bonus points for humor.

###ALLOWED_DOMAINS

If using the dev servers in development mode, use: 
'["http://localhost:3001", "http://localhost:3002"]'

Otherwise something like: 

ALLOWED_DOMAINS='["*.webmaker.org"]'

## Foreman

For running the dev instances do:

```
foreman start -f Procfile.dev
```

Then visit <a href="http://localhost:3001/">http://localhost:3001/</a> and sign in. If you visit <a href="http://localhost:3002/">http://localhost:3002/</a> you'll notice that you're signed in there too. Magic.

In fact, if you have them both open at the same time, they update with a short delay.

## Integration

See app/dev/public/index.html for application usage.
