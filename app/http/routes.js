module.exports = function( http, userHandle ){
  routes = {
    site: require('./controllers/site'),
    user: require('./controllers/user')(userHandle)
  };

  http.get('/', routes.site.index);
  http.get('/signin', routes.site.signin);
  http.get('/js/sso.js', routes.site.sso);
  http.get('/ajax/forms/new_user.html', routes.user.userForm);

  http.post('/user', routes.user.create);
  http.put('/user/:id/', routes.user.update);
  http.get('/user/:id/', routes.user.get);
  http.del('/user/:id/', routes.user.del);


  // TODO: display name taken
  // http.get('/info/displayName', routes.info.displayName);


  // delete this as soon as we hit prod, PLEASE!!
  http.get('/dev/delete', routes.user.devDelete);
  http.get( "/test", function ( req, res ) {
    res.send({
      session: req.session,
      cookies: req.cookies
    });
  });
  http.get('/healthcheck', routes.site.healthcheck);
};

