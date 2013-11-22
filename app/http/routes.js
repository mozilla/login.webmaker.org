module.exports = function( http, userHandle ){
  var qs = require( "querystring" ),
      express = require( "express" ),
      basicAuth = express.basicAuth,
      csrf = express.csrf(),
      env = require( "../../config/environment" ),
      routes = {
        site: require( "./controllers/site" ),
        user: require( "./controllers/user" )( userHandle )
      },
      userList = env.get( "ALLOWED_USERS" );

  userList = qs.parse( userList, ",", ":" );

  /**
   * Shared middleware
   */

  // basicAuth + Persona authentication
  var combinedAuth = function( req, res, next ) {
    var persona = req.session.email,
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

    // SSO Auth
    if ( persona ) {
      userHandle.getUser( persona, function( err, user ) {
        if ( err || !user ) {
          return res.json( 403, "Internal error!" );
        }

        // Allow a call from the browser if the user is initiating it themself
        if ( user.email === persona ){
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

  // Persona authentication (admin users)
  var checkPersonaAdmin = function( req, res, next ) {
    var persona = req.session.email;
    if ( persona ) {
      userHandle.getUser( persona, function( err, user ) {
        if ( err || !user ) {
          return res.json( 403, "Internal error!" );
        }

        if ( user.isAdmin ) {
          return next();
        }

        return res.json( 403, "Error, admin privileges required!" );
      });
    } else {
      return res.json( 403, "Persona account required!" );
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

  /**
   * Routes declaration
   */

  // Static pages
  http.get( "/",  routes.site.index );
  http.get( "/console", csrf, checkPersonaAdmin, routes.site.console );
  http.get( "/console/signin", csrf, routes.site.signin );

  // Account
  http.get( "/account", csrf, routes.site.account );
  http.post( "/account/delete", csrf, checkPersona, routes.user.del );

  // Resources
  http.get( "/js/sso-ux.js", routes.site.js( "sso-ux") );
  http.get("/js/console.js", routes.site.js( "console" ) );
  http.get( "/js/account.js", routes.site.js( "account" ) );
  http.get( "/js/ui.js", routes.site.js( "ui" ) );
  http.get( "/ajax/forms/new_user.html", routes.user.userForm );

  http.get( "/user/id/*", combinedAuth, routes.user.getById );
  http.get( "/user/username/*", combinedAuth, routes.user.getByUsername );
  http.get( "/user/email/*", combinedAuth, routes.user.getByEmail );
  http.get( "/user/*", combinedAuth, routes.user.get );

  http.put( "/user/*", combinedAuth, routes.user.update );
  http.del( "/user/*", combinedAuth, routes.user.del );
  http.post( "/user", routes.user.create );

  http.get( "/users", checkPersonaAdmin, routes.user.all );

  http.get( "/usernames", routes.user.hydrate );

  http.get( "/isAdmin", combinedAuth, routes.user.isAdmin );

  // Allow CSRF Headers
  http.options( "/user", allowCSRFHeaders );
  http.options( "/user/*", allowCSRFHeaders );

  // Devops
  http.get( "/healthcheck", routes.site.healthcheck );
};
