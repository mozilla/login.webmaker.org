module.exports.fetchUserBy = function (name, User) {
  var fetch = User["getUserBy" + name];

  return function (req, res, next, param) {
    fetch(param, function (err, user) {
      if (err) {
        return res.json({
          "error": "Login database error",
          "login_error": err instanceof Error ? err.toString() : err
        });
      }

      if (!user) {
        return res.json({
          "error": "User with " + name + " `" + param + "` not found"
        });
      }

      res.locals.user = user;
      process.nextTick(next);
    });
  };
};

module.exports.filterUserAttributesForSession = function (req, res, next) {
  res.locals.user = res.locals.user.serializeForSession();

  process.nextTick(next);
};

module.exports.audienceFilter = function (audienceWhitelist) {
  return function (req, res, next) {
    if (!req.body.audience) {
      return res.json({
        "error": "Missing audience"
      });
    }

    if (audienceWhitelist.indexOf(req.body.audience) === -1 &&
      audienceWhitelist.indexOf("*") === -1) {
      return res.json({
        "error": "Audience parameter not allowed"
      });
    }
    process.nextTick(next);
  };
};

module.exports.personaFilter = function () {
  return function (req, res, next) {
    if (!req.body.assertion) {
      return res.json({
        "error": "Missing assertion"
      });
    }
    process.nextTick(next);
  };
};

var browserIdVerify = require("browserid-verify");
var verifyPersona = browserIdVerify();
var verifyFxa = browserIdVerify({
  url: "https://verifier.accounts.firefox.com/v2"
});

module.exports.personaVerifier = function (req, res, next) {
  var verify = req.body.fxa ? verifyFxa : verifyPersona;
  verify(req.body.assertion, req.body.audience, function (err, email, response) {
    if (err) {
      return res.json({
        "error": "Persona verifier error",
        "verifier_error": err instanceof Error ? err.toString() : err
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

module.exports.updateUser = function (User) {
  return function (req, res, next) {
    User.updateUser(res.locals.email, {
      lastLoggedIn: new Date(),
      verified: true
    }, function (err) {
      process.nextTick(next);
    });
  };
};

module.exports.createOauthLogin = function (User) {
  return function (req, res, next) {
    if (req.body.oauth && req.body.oauth.client_id) {
      return User.createOauthLogin(res.locals.user.id, req.body.oauth.client_id, function (err) {
        next(err);
      });
    }

    process.nextTick(next);
  };
};

module.exports.engagedWithReferrerCode = function (User, options) {
  return function (req, res, next) {
    if (req.body.user && req.body.user.referrer) {
      // the referrer value is only passed in if the cookie exists client-side
      return User.engagedWithReferrerCode(res.locals.user.email, req.body.user.referrer, options.userStatus,
        function (err) {
          process.nextTick(next);
        });
    }

    process.nextTick(next);
  };
};

module.exports.verifyPasswordStrength = function (nextIfNone) {
  var PassTest = require("pass-test");

  var passTest = new PassTest({
    specialChars: {
      enabled: false
    },
    userValues: {
      enabled: true
    }
  });

  return function (req, res, next) {
    var password = req.body.password || req.body.newPassword;
    var user = res.locals.user;
    var userValues = [];

    if (user) {
      userValues.push(user.username);
      userValues.push(user.email);
    } else if (req.body.username && req.body.email) {
      userValues.push(req.body.username);
      userValues.push(req.body.email);
    }

    if (!password) {
      if (nextIfNone) {
        return process.nextTick(next);
      }

      return res.json(400, {
        error: "Missing password param"
      });
    }

    var testResults = passTest.test(password, userValues);

    if (testResults.passed) {
      return process.nextTick(next);
    }

    res.json(400, testResults);
  };
};
