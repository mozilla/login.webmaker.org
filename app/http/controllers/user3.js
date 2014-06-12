/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this file,
* You can obtain one at http://mozilla.org/MPL/2.0/. */

module.exports.generateLoginTokenForUser = function (User) {
  return function(req, res, next) {
    if ( !req.body.email ) {
      return res.json({
        "error": "No Email Provided"
      });
    }

    User.createToken(req.body.email, function(err) {
      if ( err ) {
        if ( err.error && err.error === 'User not found' ) {
          return res.json(404, err);
        }
        return res.json(500, {
          "error": "login database error"
        });
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
      return res.json( 400, {
        "error": "No Email Provided"
      });
    }

    if ( !req.body.token ) {
      return res.json( 400, {
        "error": "No token Provided"
      });
    }

    User.lookupToken(req.body.email, req.body.token, function(err, user) {
      if ( err ) {
        if ( err.error && err.error === "unauthorized" ) {
          return res.json(401, {
            status: 'unauthorized'
          });
        }
        return res.json(500, {
          "error": "Database Error"
        });
      }
      res.locals.user = user;
      process.nextTick(next);
    });
  };
};

module.exports.updateUser = function (User) {
  return function(req, res, next) {
    res.locals.user.updateAttributes({
      verified: true,
      lastLoggedIn: new Date()
    }, ["verified", "lastLoggedIn"]).done(function(err) {
      if ( err ) {
        return res.json({
          error: "Login database error"
        });
      }
      process.nextTick(next);
    });
  };
};
