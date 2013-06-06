module.exports = function( http, userHandle ){
  var qs = require('querystring'),
      basicAuth = require( 'express').basicAuth,
      env = require('../../config/environment'),
      routes = {
        site: require('./controllers/site'),
        user: require('./controllers/user')(userHandle)
      },
      userList = env.get( "ALLOWED_USERS" );

  userList = qs.parse( userList, ",", ":" );

  // Shared middleware
  var authenticate = basicAuth( function( user, pass ) {
      for ( var username in userList ) {
        if ( userList.hasOwnProperty( username ) ) {
          if ( user === username && pass === userList[ username ] ) {
            return true;
          }
        }
      }
      return false;
    });

// Make sure persona is there
  var checkpersona = function( req, res, next ) {
    if ( req.session.email ) {
      req.params.id = req.session.email;
      next();
    } else {
      res.send( "You are not signed in :(" );
    }
  };

  // Static pages
  http.get('/', authenticate, routes.site.index);
  http.get('/console', authenticate, routes.site.console);

  // Account
  http.get('/account', routes.site.account);
  http.post('/account/delete', checkpersona, routes.user.del);

  // Resources
  http.get('/js/sso-ux.js', routes.site.js('sso-ux'));
  http.get('/js/console.js', routes.site.js('console'));
  http.get('/js/account.js', routes.site.js('account'));
  http.get('/ajax/forms/new_user.html', routes.user.userForm);

  // LoginAPI
  http.get('/user/:id', routes.user.get);
  http.get('/users', routes.user.all);
  http.put('/user/:id', routes.user.update);
  http.del('/user/:id', authenticate, routes.user.del);
  http.post('/user', routes.user.create);
  http.get('/user/username/:name', authenticate, routes.user.checkUsername);
  http.get( '/isAdmin', authenticate, routes.user.isAdmin );

  // Devops
  http.get('/healthcheck', routes.site.healthcheck);

  // Dev Tools
  //
  // FIXME: delete this as soon as we hit prod, PLEASE!!
  // SEE: https://bugzilla.mozilla.org/show_bug.cgi?id=872204
  http.get('/dev/delete', routes.user.devDelete);
};

