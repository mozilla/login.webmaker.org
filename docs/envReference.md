#### ALLOW_SEND_WELCOME_EMAIL
*  Controls whether the login server sends new users a welcome email

#### ALLOWED_DOMAINS
*  Pages loaded into a browser from the domains listed in this variable are allowed to communicate with the login server directly.

#### ALLOWED_USERS
*  A series of allowed <a href="http://en.wikipedia.org/wiki/Basic_access_authentication">basicauth</a> credentials for accessing the `isAdmin` API. Additional user/pass combinations are deliniated with a comma.

#### AUDIENCE
*  This variable must contain the full hostname of the login server as understood by a web browser in order for the <a href="http://www.mozilla.org/en-US/persona/">Persona-based</a> single-sign on functionality to work

#### AWS_ACCESS_KEY
#### AWS_SECRET_KEY
*  These variables contain your Amazon Web Services credentials, which are only required if *ALLOW_SEND_WELCOME_EMAIL* is set to `true`.

#### DB_DATABASE
#### DBOPTIONS_DIALECT
#### DBOPTIONS_STORAGE
#### DBOPTIONS_LOGGING
*  These variables create the database for use with the login server. They are enabled by default, and shouldn't be modified except for using the MySQL variables below.

#### DB_HOST
#### DB_USERNAME
#### DB_PASSWORD
#### DBOPTIONS_PORT
*  These variables can be used to create a database for use with the login server using MySQL. They are disabled (commented out) by default, because using them requires the extra dependancy of MySQL instance. In most cases, the default values for these variables will be sufficient if you have a MySQL server running locally.

#### FORCE_SSL
* For most situations, this variable shouldn't be modified. If the server is running in a production environment, and is operating behind a load-balancer using SSL, this should be set to `true`.

#### GA_ACCOUNT
#### GA_DOMAIN
* These variables configure Google Analytics scripts in the login server to report usage metrics.

#### HOSTNAME
* This variable must be set to the fully qualified URI of the Login server

#### LANG_MAPPINGS
* This variable sets the default language code for a given language.  It must be a language code found in the `SUPPORTED_LANGUAGES` variable.  For more information, see the <a href="https://github.com/mozilla/node-webmaker-i18n#dynamic-mappings">Dynamic Mappings</a> section of the webmaker-i18n documentation

#### LOGINAPI
* This variable must contain the hostname including one set of basicauth details from the `ALLOWED_USERS` variable.

#### NODE_ENV
* This variable controls how server activity is logged, and will optimize performance for production if set to `production`.

#### PORT
* The login server will be accessible through the port specified in this variable.

#### SESSION_SECRET
* This (hopefully humourous) phrase will be used to generate a session signature to secure the cookie the server relies on.

#### STATSD_HOST
#### STATSD_PORT
#### STATSD_PREFIX
* These variables configure the server to send metrics data to a <a href="https://github.com/etsy/statsd/">statsd</a> server for tracking. If these are left empty, no stats will be collected or sent to a server. Only STATSD_HOST and STATSD_PORT are required. STATSD_PREFIX is an optional prefix for all stats (defaults to "development.login" or "production.login" if left blank).

#### SUPPORTED_LANGS
* This variable is an array of all the languages that are currently supported for the login server, represented by language codes in the form *lang*-*countryCode*