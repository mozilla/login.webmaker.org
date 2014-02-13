/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this file,
* You can obtain one at http://mozilla.org/MPL/2.0/. */

module.exports.authenticateUser = function(User) {
  return function(req, res, next) {
    User.getUserByEmail(res.locals.email, function(err, user) {
      if (err) {
        return res.json(500, {
          "error": "Login database error",
          "login_error": err.toString()
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
      return res.json(422, {
        "error": "Missing username"
      });
    }

    var userInfo = {
      email: res.locals.email,
      username: req.body.user.username
    };

    User.createUser(userInfo, function(err, user) {
      if (err) {
        return res.json(500, {
          "error": "Login database error",
          "login_error": err.toString()
        });
      }

      if (!user) {
        return res.json(500, {
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
      return res.json(422, {
        "error": "Missing username"
      });
    }

    User.getUserByUsername(req.body.username, function(err, user) {
      if (err) {
        return res.json(500, {
          "error": "Login database error",
          "login_error": err.toString()
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
    "email": res.locals.email,
    "user": res.locals.user
  });
};
