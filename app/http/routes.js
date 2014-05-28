module.exports = function( http, userHandle, webmakerAuth ){
  var qs = require( "querystring" ),
      express = require( "express" ),
      basicAuth = express.basicAuth,
      csrf = express.csrf(),
      env = require( "../../config/environment" ),
      routes = {
        site: require( "./controllers/site" ),
        user: require( "./controllers/user" )( userHandle ),
        user2: require( "./controllers/user2" )
      },
      userList = env.get( "ALLOWED_USERS" ),
      authMiddleware = basicAuth( function( user, pass ) {
        for ( var username in userList ) {
          if ( userList.hasOwnProperty( username ) ) {
            if ( user === username && pass === userList[ username ] ) {
              return true;
            }
          }
        }
        return false;
      });

  userList = qs.parse( userList, ",", ":" );

  // Persona authentication (non-admin users)
  var checkPersona = function( req, res, next ) {
    if ( req.session.email ) {
      req.params[0] = req.session.email;
      next();
    } else {
      res.send( "You are not signed in :(" );
    }
  };

  var filterAccountUpdates = function( req, res, next ) {
    var filtered = {},
        input = req.body;

    // Only allow attributes that users should be able to set on their own account
    filtered.sendEventCreationEmails = input.sendEventCreationEmails;
    filtered.prefLocale = input.prefLocale;

    req.body = filtered;
    next();
  };

  /**
   * Routes declaration
   */

  // Static pages
  http.get( "/",  routes.site.index );

  // Account
  http.get( "/account", csrf, routes.site.account );
  http.post( "/account/delete", csrf, checkPersona, routes.user.del );
  http.put( "/account/update", csrf, checkPersona, filterAccountUpdates, routes.user.update );

  // Resources
  http.get( "/js/account.js", routes.site.js( "account" ) );

  // Used by webmaker-user-client with basicAuth
  http.get( "/user/id/*", authMiddleware, routes.user.getById );
  http.get( "/user/username/*", authMiddleware, routes.user.getByUsername );
  http.get( "/user/email/*", authMiddleware, routes.user.getByEmail );
  http.put( "/user/*", authMiddleware, routes.user.update );

  http.get( "/usernames", authMiddleware, routes.user.hydrate );
  // Support for clients that refuse to send request bodies with POST requests
  http.post( "/usernames", authMiddleware, routes.user.hydrate );

  // The new hotness
  var audience_whitelist = env.get( "ALLOWED_DOMAINS" ).split( " " );
  var middleware = require("./middleware");

  // Client-side Webmaker Auth support
  http.post('/verify', webmakerAuth.handlers.verify);
  http.post('/authenticate', webmakerAuth.handlers.authenticate);
  http.post('/logout', webmakerAuth.handlers.logout);
  http.post('/create', webmakerAuth.handlers.create);
  http.post('/check-username', webmakerAuth.handlers.exists);

  http.post(
    "/api/user/authenticate",
    middleware.personaFilter( audience_whitelist ),
    middleware.personaVerifier,
    routes.user2.authenticateUser( userHandle ),
    middleware.updateLastLoggedIn( userHandle ),
    routes.user2.outputUser
  );
  http.post(
    "/api/user/create",
    middleware.personaFilter( audience_whitelist ),
    middleware.personaVerifier,
    routes.user2.createUser( userHandle ),
    routes.user2.outputUser
  );
  // For backwards compatibility; this can be removed at any time
  http.put(
    "/api/user/email/:email",
    authMiddleware,
    routes.user2.updateUserWithBody( userHandle ),
    routes.user2.outputUser
  );
  http.patch(
    "/api/user/email/:email",
    authMiddleware,
    routes.user2.updateUserWithBody( userHandle ),
    routes.user2.outputUser
  );
  http.patch(
    "/api/user/id/:id",
    authMiddleware,
    routes.user2.updateUserWithBody( userHandle ),
    routes.user2.outputUser
  );
  http.patch(
    "/api/user/username/:username",
    authMiddleware,
    routes.user2.updateUserWithBody( userHandle ),
    routes.user2.outputUser
  );
  http.post(
    "/api/user/exists",
    routes.user2.exists( userHandle )
  );

  // Parameters
  http.param("email", middleware.fetchUserBy( "Email", userHandle ));
  http.param("id", middleware.fetchUserBy( "Id", userHandle ));
  http.param("username", middleware.fetchUserBy( "Username", userHandle ));

  // Devops
  http.get( "/healthcheck", routes.site.healthcheck );
};
