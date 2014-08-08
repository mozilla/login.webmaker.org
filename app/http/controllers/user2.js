/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this file,
* You can obtain one at http://mozilla.org/MPL/2.0/. */

/* jshint esnext: true */

var usernameRegex = /^[abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789\-]{1,20}$/;

function isInvalidUsername( str ) {
  return typeof str !== "string" || !usernameRegex.test( str );
}

function fourOhOne(res) {
  res.json(401, {
    status: 'unauthorized'
  });
}

module.exports.authenticateUser = function(User) {
  return function(req, res, next) {
    User.getUserByEmail(res.locals.email, function(err, user) {
      if (err) {
        return res.json({
          "error": "Login database error",
          "login_error": err instanceof Error ? err.toString() : err
        });
      }

      if (!user) {
        return res.json({
          "email": res.locals.email
        });
      }

      res.locals.user = user;
      process.nextTick(next);
    });
  };
};

module.exports.createUser = function(User) {
  return function(req, res, next) {
    if (req.body.user && !req.body.user.username) {
      return res.json({
        "error": "Missing username"
      });
    }

    if (isInvalidUsername( req.body.user.username )) {
      return res.json({
        "error": "Invalid username. All usernames must be between 1-20 characters, and only include \"-\" and alphanumeric characters"
      });
    }

    var userInfo = {
      email: res.locals.email || req.body.user.email,
      mailingList: !!req.body.user.mailingList,
      username: req.body.user.username,
      prefLocale: req.body.user.prefLocale,
      referrer: req.body.user.referrer
    };

    User.createUser(userInfo, function(err, user) {
      if (err) {
        return res.json({
          "error": "Login database error",
          "login_error": err instanceof Error ? err.toString() : err
        });
      }

      if (!user) {
        return res.json({
          "error": "Login database error",
          "login_error": "Failed to create user"
        });
      }

      res.locals.user = user;
      process.nextTick(next);
    });
  };
};

module.exports.exists = function(User) {
  return function(req, res, next) {
    if (!req.body.username) {
      return res.json({
        "error": "Missing username"
      });
    }

    User.getUserByUsername(req.body.username, function(err, user) {
      if (err) {
        return res.json({
          "error": "Login database error",
          "login_error": err instanceof Error ? err.toString() : err
        });
      }

      res.json({
        "username": req.body.username,
        "exists": !!user
      });
    });
  };
};

module.exports.outputUser = function(req, res, next) {
  res.json({
    email: res.locals.email,
    user: res.locals.user
  });
};

module.exports.updateUserWithBody = function (User) {
  return function(req, res, next) {
    User.updateUser(res.locals.user.email, req.body, function(err, user) {
      if (err) {
        return res.json({
          "error": "Login database error",
          "login_error": err instanceof Error ? err.toString() : err
        });
      }

      if (!user) {
        return res.json({
          "error": "User with email `" + res.locals.user.email + "` not found"
        });
      }

      res.locals.user = user;
      process.nextTick(next);
    });
  };
};

module.exports.generateLoginTokenForUser = function (User) {
  return function(req, res, next) {
    if ( !req.body.email ) {
      return res.json({
        "error": "No Email Provided"
      });
    }

    User.createToken(req.body.email, function(err) {
      if ( err ) {
        return res.json(err);
      }
      res.json({
        "status": "Login Token Sent"
      });
    });
  };
};


module.exports.verifyTokenForUser = function (User) {
  return function(req, res, next) {
    if ( !req.body.email ) {
      return res.json({
        "error": "No Email Provided"
      });
    }
    if ( !req.body.token ) {
      return res.json({
        "error": "No token Provided"
      });
    }

    User.lookupToken(req.body.email, req.body.token, function(err, user) {
      if ( err ) {
        if ( err.error && err.error === "unauthorised" ) {
          return res.json(403, err);
        }
        return res.json(err);
      }
      res.locals.user = user;
      process.nextTick(next);
    });
  };
};

module.exports.setUser = function(User) {
  return function(req, res, next) {
    var val = req.body.email || req.body.username;
    var lookup = req.body.email ? "email" : "username";
    var where = {};

    if ( !val ) {
      return fourOhOne(res);
    }

    where[ lookup ] = val;

    User.model.find({
      where: where,
      include: [
        User.password,
        User.resetAuthorization
      ]
    })
    .then(function(user){
      res.locals.user = user;
      process.nextTick(next);
    })
    .error(function() {
        return fourOhOne(res);
    });
  };
};

module.exports.changePassword = function(User) {
  return function(req, res, next) {
    var oldPassword = req.body.oldPassword;
    var newPass = req.body.newPassword;
    var user = res.locals.user;

    User.compareHash(oldPassword, user, function(err, result) {
      if ( err || !result ) {
        return fourOhOne(res);
      }
      User.changePassword(newPass, user, function(err, result) {
        if ( err ) {
          console.error( err );
          return fourOhOne(res);
        }
        res.json( result );
      });
    });
  };
};

module.exports.setFirstPassword = function(User) {
  return function(req, res, next) {
    var token = req.body.token;
    var pass = req.body.password;
    var user = res.locals.user;

    if ( user.password ) {
      return fourOhOne(res);
    }

    if ( !token ) {
      return fourOhOne(res);
    }

    // need to fix lookupToken
    User.lookupToken(user.email, token, function(err) {
      if ( err ) {
        console.error(err);
        return fourOhOne(res);
      }

      User.changePassword(pass, user, function(err) {
        if ( err ) {
          return res.json(err.status, err.error);
        }
        res.json({
          user: user
        });
      });
    });
  };
};

module.exports.verifyReset= function(User) {

  return function(req, res, next) {
    var token = req.body.resetToken;
    var user = res.locals.user;

    User.validateReset(token, user, function( err, valid ) {
      if ( err || !valid ) {
        return fourOhOne(res);
      }
      process.nextTick(next);
    });
  };
};

module.exports.verifyPassword = function(User) {
  return function(req, res, next) {

    var pass = req.body.password;
    var user = res.locals.user;

    if ( !pass ) {
      return fourOhOne(res);
    }

    User.compareHash(pass, user, function(err, result) {
      if ( err || !result ) {
        return fourOhOne(res);
      }
      process.nextTick(next);
    });
  };
};

module.exports.createResetAuthorization = function(User) {
  return function(req, res) {
    var user = res.locals.user;

    User.createResetAuthorization(user, function(err) {
      if ( err ) {
        return res.json(500, {
          error: err
        });
      }
      res.json({
        status: "created"
      });
    });
  };
};
