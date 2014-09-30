module.exports = function (allowedDomains) {
  return function cors(req, res, next) {
    if (allowedDomains.indexOf(req.headers.origin) > -1) {
      res.header('Access-Control-Allow-Origin', req.headers.origin);
      res.header('Access-Control-Allow-Methods', 'POST, GET, PUT, DELETE');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token, Accept-Ranges, Range-Unit, Content-Range, Range');
      res.header('Access-Control-Expose-Headers', 'Content-Type, Accept-Ranges, Range-Unit, Content-Range');
      res.header('Access-Control-Allow-Credentials', true);
    }
    next();
  };
};
