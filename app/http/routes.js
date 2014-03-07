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

  /**
   * Shared middleware
   */

  // basicAuth + Persona authentication
  var standardAuth = function( req, res, next ) {
    var sessionUser = req.session.email;

    // SSO Auth
    if ( sessionUser ) {
      userHandle.getUserByEmail( sessionUser.email, function( err, user ) {
        if ( err || !user ) {
          return res.json( 403, "Internal error!" );
        }

        // Allow a call from the browser if the user is initiating it themself
        if ( user.email === sessionUser.email ){
          return next();
        }

        // Allow a call from the browser if the user is an admin
        if ( user.isAdmin ) {
          return next();
        }

        return res.json( 403, "Error, admin privileges required!" );
      });
    } else {
      // BasicAuth
      authMiddleware( req, res, next );
    }
  };

  var adminOnlyAuth = function( req, res, next ) {
    var sessionUser = req.session.user;

    // SSO Auth
    if ( sessionUser ) {
      userHandle.getUserByEmail( sessionUser.email, function( err, user ) {
        if ( err || !user ) {
          return res.json( 403, "Internal error!" );
        }

        // Allow a call from the browser if the user is an admin
        if ( user.isAdmin ) {
          return next();
        }

        return res.json( 403, "Error, admin privileges required!" );
      });
    } else {
      // BasicAuth
      authMiddleware( req, res, next );
    }
  };

  // Persona authentication (non-admin users)
  var checkPersona = function( req, res, next ) {
    if ( req.session.email ) {
      req.params[0] = req.session.email;
      next();
    } else {
      res.send( "You are not signed in :(" );
    }
  };

  var allowCSRFHeaders = function( req, res, next ) {
    res.header( "Access-Control-Allow-Headers", "X-CSRF-Token" );
    res.send( 200 );
  };

  var filterAccountUpdates = function( req, res, next ) {
    var filtered = {},
        input = req.body;

    // Only allow attributes that users should be able to set on their own account
    filtered.sendEventCreationEmails = input.sendEventCreationEmails;

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
  http.get( "/js/sso-ux.js", routes.site.js( "sso-ux") );
  http.get("/js/console.js", routes.site.js( "console" ) );
  http.get( "/js/account.js", routes.site.js( "account" ) );
  http.get( "/js/ui.js", routes.site.js( "ui" ) );
  http.get( "/ajax/forms/new_user.html", routes.user.userForm );

  http.get( "/user/id/*", standardAuth, routes.user.getById );
  http.get( "/user/username/*", standardAuth, routes.user.getByUsername );
  http.get( "/user/email/*", standardAuth, routes.user.getByEmail );

  http.put( "/user/*", adminOnlyAuth, routes.user.update );
  http.del( "/user/*", adminOnlyAuth, routes.user.del );
  http.post( "/user", routes.user.create );

  http.get( "/usernames", authMiddleware, routes.user.hydrate );
  // Support for clients that refuse to send request bodies with POST requests
  http.post( "/usernames", authMiddleware, routes.user.hydrate );

  // Allow CSRF Headers
  http.options( "/user", allowCSRFHeaders );
  http.options( "/user/*", allowCSRFHeaders );

  // The new hotness
  var audience_whitelist = env.get( "ALLOWED_DOMAINS" ).split( " " );
  var middleware = require("./middleware");

  // admin console login routes
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
    middleware.loadUserUrls,
    routes.user2.outputUser
  );
  http.post(
    "/api/user/create",
    middleware.personaFilter( audience_whitelist ),
    middleware.personaVerifier,
    routes.user2.createUser( userHandle ),
    middleware.sendBSDSub,
    middleware.loadUserUrls,
    routes.user2.outputUser
  );
  http.post(
    "/api/user/exists",
    routes.user2.exists( userHandle )
  );

  // Devops
  http.get( "/healthcheck", routes.site.healthcheck );
};
