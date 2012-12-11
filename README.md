login.webmaker.org
==================

ALLOWED_DOMAINS='["*.webmaker.org"]'

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


## Integration

See app/dev/public/index.html for application usage.

