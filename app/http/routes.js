// HTTP Routes
routes = {
  site: require('./controllers/site')
};

module.exports = function(http){
    http.get('/', routes.site.index);
    http.get('/signin', routes.site.signin);
    http.get('/js/sso.js', routes.site.sso);
};
