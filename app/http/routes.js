// HTTP Routes
routes = {
  site: require('./controllers/site'),
  user: require('./controllers/user')
};

module.exports = function(http){
    http.get('/', routes.site.index);
    http.get('/signin', routes.site.signin);
    http.get('/js/sso.js', routes.site.sso);
    http.post('/user/create', routes.user.create);
};
