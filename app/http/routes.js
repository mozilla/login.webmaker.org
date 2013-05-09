module.exports = function( http, userHandle, blacklist ){
  routes = {
    site: require('./controllers/site'),
    user: require('./controllers/user')(userHandle),
    blacklist: require('./controllers/blacklist')(blacklist)
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

  /*
   * In place of any proper admin section we can add in new words to blacklist using:
   * $.ajax({
   *  type: "POST",
   *  url: "{localhost}/user/blacklist",
   *  data: { "name": "word" }
   * });
   */
  http.post('/user/blacklist', routes.blacklist.create);
  http.get('/user/blacklist/:word', routes.blacklist.find);


  // delete this as soon as we hit prod, PLEASE!!
  http.get('/dev/delete', routes.user.devDelete);
  http.get('/healthcheck', routes.site.healthcheck);
};

