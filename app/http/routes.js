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
          return ( user === username && pass === userList[ username ] );
        }
      }
      return false;
    });


  // Static pages
  http.get('/', authenticate, routes.site.index);
  http.get('/console', authenticate, routes.site.console);

  // Resources
  http.get('/js/sso-ux.js', routes.site.sso);
  http.get('/js/console.js', routes.site.consolejs);
  http.get('/ajax/forms/new_user.html', routes.user.userForm);

  // LoginAPI
  http.get('/user/:id', routes.user.get);
  http.get('/users', routes.user.all);
  http.put('/user/:id', routes.user.update);
  http.del('/user/:id', authenticate, routes.user.del);
  http.post('/user', routes.user.create);
  http.get('/user/subdomain/:name', authenticate, routes.user.checkSubdomain);
  http.get( '/isAdmin', authenticate, routes.user.isAdmin );

  // Devops
  http.get('/healthcheck', routes.site.healthcheck);

  // Dev Tools
  //
  // FIXME: delete this as soon as we hit prod, PLEASE!!
  // SEE: https://bugzilla.mozilla.org/show_bug.cgi?id=872204
  http.get('/dev/delete', routes.user.devDelete);
};

