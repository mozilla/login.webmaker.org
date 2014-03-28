module.exports.personaFilter = function(audience_whitelist) {
  return function(req, res, next) {
    if (!req.body.audience) {
      return res.json({
        "error": "Missing audience"
      });
    }

    if (audience_whitelist.indexOf(req.body.audience) === -1 &&
        audience_whitelist.indexOf("*") === -1) {
      return res.json({
        "error": "Audience parameter not allowed"
      });
    }

    if (!req.body.assertion) {
      return res.json({
        "error": "Missing assertion"
      });
    }

    process.nextTick(next);
  };
};

var verify = require( "browserid-verify" )();

module.exports.personaVerifier = function(req, res, next) {
  verify(req.body.assertion, req.body.audience, function(err, email, response) {
    if (err) {
      return res.json({
        "error": "Persona verifier error",
        "verifier_error": err.toString()
      });
    }

    if (!email) {
      return res.json({
        "error": "Persona verifier error",
        "verifier_error": response
      });
    }

    res.locals.email = email;
    process.nextTick(next);
  });
};

module.exports.updateLastLoggedIn = function(User) {
  return function(req, res, next) {
    User.updateUser( res.locals.email, {
      lastLoggedIn: new Date()
    }, function( err ) {
      //TODO do something useful if this error happens
      process.nextTick(next);
    });
  };
};
