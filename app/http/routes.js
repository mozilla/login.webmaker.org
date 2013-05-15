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

  http.get('/', routes.site.index);
  http.get('/signin', routes.site.signin);
  http.get('/js/sso.js', routes.site.sso);
  http.get('/ajax/forms/new_user.html', routes.user.userForm);

  http.post('/user', routes.user.create);
  http.put('/user/:id', routes.user.update);
  http.get('/user/:id', routes.user.get);
  http.del('/user/:id', routes.user.del);

  http.get( '/isAdmin', basicAuth( function( user, pass ) {
    for ( var username in userList ) {
      if ( userList.hasOwnProperty( username ) ) {
        if ( user === username && pass === userList[ username ] ) {
          return true;
        }
      }
    }
    return false;
  }), routes.user.isAdmin );

  // delete this as soon as we hit prod, PLEASE!!
  //SEE: https://bugzilla.mozilla.org/show_bug.cgi?id=872204
  http.get('/dev/delete', routes.user.devDelete);

  http.get('/healthcheck', routes.site.healthcheck);
};

