var env = require( "../../../config/environment" );

var DEV_LOG_LINKS = !!env.get( "DEV_LOG_LINKS" );

module.exports = function (sequelize) {
  const TOKEN_HAT_BITS = 24;
  const TOKEN_HAT_BASE = 36;
  const TOKEN_EXPIRY_TIME = 1000 * 60 * 30;

  const RESET_HAT_BITS = 128;
  const RESET_HAT_BASE = 16;
  const RESET_EXPIRY_TIME = 1000 * 60 * 60 * 24;
  const BCRYPT_ROUNDS = 12;

  var bcrypt = require('bcrypt');
  var hat = require('hat');
  var hatchet = require('hatchet');

  var model = sequelize.import(__dirname + '/model.js');
  var loginToken = sequelize.import(__dirname + '/loginToken.js');
  var password = sequelize.import(__dirname + '/password.js');
  var resetAuthorization = sequelize.import(__dirname + '/resetAuthorization.js');

  model.hasOne(password);
  model.hasMany(loginToken);
  model.hasMany(resetAuthorization);
  loginToken.belongsTo(model);

  return {

    model: model,
    loginToken: loginToken,
    password: password,
    resetAuthorization: resetAuthorization,

    /**
     * getUserById( id, callback )
     * -
     * id: sql id
     * callback: function( err, user )
     */
    getUserById: function( id, callback ) {
      model.find({ where: { id: id } }).complete( callback );
    },

    /**
     * getUserByUsername( username, callback )
     * -
     * username: username
     * callback: function( err, user )
     */
    getUserByUsername: function( username, callback ) {
      model.find({ where: { username: username } }).complete( callback );
    },

    /**
     * getUserByEmail( email, callback )
     * -
     * email: email
     * callback: function( err, user )
     */
    getUserByEmail: function( email, callback ) {
      model.find({ where: { email: email } }).complete( callback );
    },

    /**
     * getUsersByIds( ids, callback )
     * -
     * ids: Array of sql ids
     * callback: function( err, users )
     */
    getUsersByIds: function( ids, callback ) {
      model.findAll({ where: { id: ids } }).complete( callback );
    },

    /**
     * getUsersByUsernames( usernames, callback )
     * -
     * usernames: array of usernames
     * callback: function( err, users )
     */
    getUsersByUsernames: function( usernames, callback ) {
      model.findAll({ where: { username: usernames } }).complete( callback );
    },

    /**
     * getUserByEmail( email, callback )
     * -
     * emails: array of emails
     * callback: function( err, user )
     */
    getUsersByEmails: function( emails, callback ) {
      model.findAll({ where: { email: emails } }).complete( callback );
    },

    /**
     * createUser( data, callback )
     * -
     * data: JSON object containing user fields
     * callback: function( err, thisUser )
     */
    createUser: function( data, callback ) {
      var user,
          err;

      if ( !data ) {
        return callback( "No data passed!" );
      }

      if ( !data.username ) {
        return callback( "No username passed!" );
      }

      if ( !data.email ) {
        return callback( "No email passed!" );
      }

      user = model.build({
        email: data.email,
        fullName: data.username,
        subscribeToWebmakerList: data.mailingList,
        username: data.username.toLowerCase(),
        lastLoggedIn: new Date(),
        referrer: data.referrer,
        prefLocale: data.prefLocale
      });

      // Validate
      err = user.validate();
      if ( err ) {
        return callback( err );
      }

      // Delegates all server-side validation to sequelize during this step
      user.save().complete( function (err, data) {
        if (err) {
          return callback(err);
        }

        hatchet.send( "create_user", {
          userId: user.getDataValue("id"),
          username: user.getDataValue("username"),
          email: user.getDataValue("email"),
          locale: user.getDataValue("prefLocale"),
          referrer: user.getDataValue("referrer"),
          subscribeToWebmakerList: user.getDataValue("subscribeToWebmakerList")
        });

        callback(null, data);
      });
    },

    /**
     * updateUser( email, data, callback )
     * -
     * email: email address
     * data: JSON object containing user fields
     * callback: function( err, user )
     */
    updateUser: function ( email, data, callback ) {
      this.getUserByEmail( email, function( err, user ) {
        var error;

        if ( err ) {
          return callback( err );
        }

        if ( !user  ) {
          return callback( "User not found!" );
        }

        // Selectively update the user model
        Object.keys( data ).forEach( function ( key ) {
          user[ key ] = data[ key ];
        });

        error = user.validate();
        if ( error ) {
          return callback( error );
        }

        user.save().complete( callback );
      });
    },

    /**
     * deleteUser( email, callback )
     * -
     * email: email address
     * callback: function( err, thisUser )
     */
    deleteUser: function ( email, callback ) {
      // Check user exists (sequelize happily deletes
      // non existant-users)
      this.getUserByEmail( email, function( err, user ) {
        if ( err ) {
          return callback( err );
        }

        if ( !user  ) {
          return callback( "User not found!" );
        }

        // Delete user
        user.destroy().complete( function( err ) {
          if ( err ) {
            return callback( err );
          }

          hatchet.send( "delete_user", {
            userId: user.getDataValue("id"),
            username: user.getDataValue("username"),
            locale: user.getDataValue("prefLocale"),
            email: user.getDataValue("email")
          });

          callback();
        });
      });
    },

    /**
     * getAllWithEmails( emails, callback )
     * -
     * emails: Array of Emails
     * callback: function( err, users )
     */
    getAllWithEmails: function( emails, callback ) {
      model.findAll({
        where: { "email": emails }
      }).complete( callback );
    },

    createToken: function( email, callback ) {
      this.getUserByEmail(email, function(err, user) {
        if (err) {
          return res.json({
            "error": "Login database error",
            "login_error": err instanceof Error ? err.toString() : err
          });
        } else if ( !user ) {
          return callback({
            "error": "User not found"
          });
        }

        var token = loginToken.build({
          token: hat(TOKEN_HAT_BITS, TOKEN_HAT_BASE),
          UserId: user.id
        });

        token.save().complete(function( err, savedToken) {
          if (err) {
            return callback(err);
          }

          var loginLink = env.get('WEBMAKERORG') + '/?e=' + user.getDataValue("email") + '&t=' + savedToken.token

          // log the token in the console
          if ( DEV_LOG_LINKS ) {
            console.log( "*****\nLOGIN TOKEN: " + savedToken.token + "\nLOGIN LINK: " + loginLink + "\n*****");
          }

          hatchet.send("login_token_email", {
            userId: user.getDataValue("id"),
            username: user.getDataValue("username"),
            email: user.getDataValue("email"),
            // contextualize this based on where the login request came from
            loginUrl: loginLink,
            token: savedToken.token
          });

          callback();
        });
      });
    },

    lookupToken: function( email, token, callback ) {
      // lookup email to get the userID
      this.getUserByEmail(email, function(err, user) {
        if (err) {
          return callback({
            "error": "Login database error",
            "login_error": err instanceof Error ? err.toString() : err
          });
        } else if ( !user ) {
          return callback({
            "error": "unauthorised"
          });
        }

        // search for the token
        loginToken.find({
          where: {
            token: token
          }
        }).complete(function( err, logintoken) {
          if (err) {
            return callback({
              "error": "Login Database error"
            });
          }

          // If the token is expired, but the id's match,
          // continue, so the user can be told of an expired token
          var wrongUserAndExpired = logintoken &&
                                    logintoken.UserId !== user.id &&
                                    logintoken.failedAttempts >= 3;

          if (!logintoken || wrongUserAndExpired) {
            return callback({
              "error": "unauthorised"
            });
          }

          // in most cases, invalid login attempts should increment failedAttempts
          if (logintoken.UserId !== user.id ||
              logintoken.used === true) {

            logintoken.failedAttempts++;
            return logintoken.save().complete(function() {
              return callback({
                "error": "unauthorised"
              });
            });
          }

          // everything looks okay, but this is an expired token!
          if (logintoken.createdAt <= Date.now() - TOKEN_EXPIRY_TIME ||
              logintoken.failedAttempts >= 3) {

            return callback({
              "error": "expired"
            });
          }

          // mark token used and save
          logintoken.used = true;

          logintoken.save().complete(function(err){
            if ( err ) {
              return callback({
                "error": "Login database error"
              });
            }
            callback(null, user);
          });
        });
      });
    },

    cancelActiveResets: function(user, callback) {
      resetAuthorization.update({
        used: true
      }, {
        UserId: user.id,
        used: false,
        createdAt: {
          gt: Date.now() - RESET_EXPIRY_TIME
        }
      })
      .then(function(affectedRows) {
        callback(null, affectedRows);
      })
      .error(callback);
    },

    createResetAuthorization: function(user, callback) {
      var resetToken = hat(RESET_HAT_BITS, RESET_HAT_BASE);
      var rA = resetAuthorization.build({
        token: resetToken,
        used: false,
        UserId: user.id
      });

      rA
        .save()
        .success(function(){

          var resetUrl = env.get("WEBMAKERORG") + '/password-reset/' + user.getDataValue("email") + '/' + rA.getDataValue("token");

          if ( DEV_LOG_LINKS ) {
            console.log("*****\nRESET LINK: ", resetUrl + "\n*****");
          }

          hatchet.send( "reset_authorization_created", {
            email: user.getDataValue("email"),
            username: user.getDataValue("username"),
            resetUrl: resetUrl
          });
          callback();
        })
        .error(function(err) {
          console.error(err);
          callback("Error Creating Reset Authorization");
        });
    },

    validateReset: function(token, user, callback) {
      resetAuthorization.find({
        where: {
          token: token,
          UserId: user.id,
          used: false,
          createdAt: {
            gt: Date.now() - RESET_EXPIRY_TIME
          }
        }
      })
      .then(function(token) {
        if ( !token ) {
          return callback(null, false);
        }

        token
          .updateAttributes({
            used: true
          })
          .success(function(){
            callback(null, true);
          })
          .error(callback);
      })
      .error(callback);
    },

    changePassword: function(newPass, user, callback) {
      var pass = user.password || password.build(),
          firstPassword = !!user.password;

      bcrypt.genSalt(BCRYPT_ROUNDS, function(err, salt) {
        bcrypt.hash(newPass, salt, function(err, hash) {
          pass.saltedHash = hash;
          user
            .updateAttributes({
              usePasswordLogin: true
            })
            .then(function() {
             return user.setPassword(pass);
            })
            .then(function() {
              hatchet.send('user-password-changed', {
                email: user.getDataValue('email'),
                username: user.getDataValue('username'),
                firstPassword: firstPassword
              });
              callback(null);
            })
            .error(function(err) {
              console.error( err );
              callback({
                error: "Login Database Error"
              });
            });
        });
      });
    },

    removePassword: function(user, callback) {
      var pass = user.password;

      pass.destroy().then(function() {
        return user.updateAttributes({
          usePasswordLogin: false
        });
      })
      .then(function() {
        hatchet.send('user-password-removed', {
          email: user.getDataValue('email'),
          username: user.getDataValue('username')
        });
        callback(null);
      })
      .error(function(err) {
        console.error(err);
        callback({
          error: "Login Database Error"
        });
      });
    },

    compare: function(pass, user, callback) {
      if ( !user.password ) {
        callback(err, false);
      }

      bcrypt.compare(pass, user.password.saltedHash, function(err, res) {
        callback(err, res);
      });
    }
  };
};
