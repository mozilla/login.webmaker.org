// HTTP Routes
routes = {
  site: require('./controllers/site'),
  user: require('./controllers/user')
};

module.exports = function(http){
    http.get('/', routes.site.index);
    http.get('/signin', routes.site.signin);
    http.get('/js/sso.js', routes.site.sso);
    http.get('/ajax/forms/new_user.html', routes.user.userForm);
    http.post('/user/create', routes.user.create);
    // delete this as soon as we hit prod, PLEASE!!
    http.get('/dev/delete', routes.user.devDelete);
};
