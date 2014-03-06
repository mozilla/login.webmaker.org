var env = require( "../../config/environment" );

module.exports.loadUserUrls = function(req, res, next) {

  res.locals.urls = {
    myMakes: env.get("AUDIENCE") + "/me",
    accountSettings: env.get("HOSTNAME") + '/account',
    profile: "//" + res.locals.user.username + env.get("PROFILE")
  };

  next();
};

module.exports.personaFilter = function(audience_whitelist) {
  return function(req, res, next) {
    if (!req.body.audience) {
      return res.json({
        "error": "Missing audience"
      });
    }

    if (audience_whitelist.indexOf(req.body.audience) === -1) {
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

var hyperquest = require("hyperquest");
var querystring = require("querystring");

module.exports.sendBSDSub = function(req, res, next) {
  if (!req.body.user || !req.body.user.mailingList) {
    return process.nextTick(next);
  }

  var post = hyperquest.post({
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    uri: "https://sendto.mozilla.org/page/s/webmaker"
  }, function(err, response) {
    //TODO do something useful if anything happens
    process.nextTick(next);
  });

  var signup = querystring.stringify({
    "custom-1216": 1,
    email: res.locals.email
  });

  post.end(new Buffer(signup));
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
