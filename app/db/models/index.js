var moment = require("moment");
var bPromise = require("bluebird");
var crypto = require("crypto");
var proquint = require("proquint");
var hat = require("hat");
var hatchet = require("hatchet");
var url = require("url");
var bcrypt;

try {
  bcrypt = require("bcrypt");
} catch (e) {
  console.info("Falling back to JavaScript implementation of bcrypt");
  bcrypt = require("bcryptjs");
}

module.exports = function (sequelize, env) {
  var TOKEN_EXPIRY_TIME = 1000 * 60 * 30;

  var RESET_CODE_BIT_LENGTH = 256;
  var RESET_CODE_BASE = 16;
  var RESET_EXPIRY_TIME = 1000 * 60 * 60 * 24;
  var BCRYPT_ROUNDS = 12;

  var user = sequelize.import(__dirname + "/user.js");
  var modelReferrerCode = sequelize.import(__dirname + "/modelreferrercode.js");
  var loginToken = sequelize.import(__dirname + "/loginToken.js");
  var password = sequelize.import(__dirname + "/password.js");
  var resetCode = sequelize.import(__dirname + "/resetCode.js");
  var oauthClient = sequelize.import(__dirname + "/oauthClient.js");
  var oauthLogin = sequelize.import(__dirname + "/oauthLogin.js");

  user.hasMany(modelReferrerCode);
  modelReferrerCode.belongsTo(user);

  user.hasMany(loginToken);
  loginToken.belongsTo(user);

  user.hasOne(password);
  password.belongsTo(user);

  user.hasMany(resetCode);
  resetCode.belongsTo(user);

  user.hasMany(oauthLogin);
  oauthLogin.belongsTo(user);

  oauthClient.hasMany(oauthLogin);
  oauthLogin.belongsTo(oauthClient);

  return {

    user: user,
    loginToken: loginToken,
    password: password,
    resetCode: resetCode,
    oauthClient: oauthClient,
    oauthLogin: oauthLogin,

    /**
     * getUserById( id, callback )
     * -
     * id: sql id
     * callback: function( err, user )
     */
    getUserById: function (id, callback) {
      user.find({
          where: {
            id: id
          }
        })
        .then((user) => callback(null, user))
        .catch((err) => callback(err));
    },

    /**
     * getUserByUsername( username, callback )
     * -
     * username: username
     * callback: function( err, user )
     */
    getUserByUsername: function (username, callback) {
      user.find({
          where: {
            username: username
          }
        })
        .then((user) => callback(null, user))
        .catch((err) => callback(err));
    },

    /**
     * getUserByEmail( email, callback )
     * -
     * email: email
     * callback: function( err, user )
     */
    getUserByEmail: function (email, callback) {
      user.find({
          where: {
            email: email
          }
        })
        .then((user) => callback(null, user))
        .catch((err) => callback(err));
    },

    /**
     * getUsersByIds( ids, callback )
     * -
     * ids: Array of sql ids
     * callback: function( err, users )
     */
    getUsersByIds: function (ids, callback) {
      user.findAll({
          where: {
            id: ids
          }
        })
        .then((users) => callback(null, users))
        .catch((err) => callback(err));
    },

    /**
     * getUsersByUsernames( usernames, callback )
     * -
     * usernames: array of usernames
     * callback: function( err, users )
     */
    getUsersByUsernames: function (usernames, callback) {
      user.findAll({
          where: {
            username: usernames
          }
        })
        .then((users) => callback(null, users))
        .catch((err) => callback(err));
    },

    /**
     * getUsersByEmail( email, callback )
     * -
     * emails: array of emails
     * callback: function( err, users )
     */
    getUsersByEmails: function (emails, callback) {
      user.findAll({
          where: {
            email: emails
          }
        })
        .then((users) => callback(null, users))
        .catch((err) => callback(err));
    },

    /**
     * createUser( data, callback )
     * -
     * data: JSON object containing user fields
     * callback: function( err, thisUser )
     */
    createUser: function (data, callback) {
      var userObj,
        err;

      if (!data) {
        return callback("No data passed!");
      }

      if (!data.username) {
        return callback("No username passed!");
      }

      if (!data.email) {
        return callback("No email passed!");
      }

      userObj = user.build({
        email: data.email,
        fullName: data.username,
        subscribeToWebmakerList: data.mailingList,
        username: data.username.toLowerCase(),
        lastLoggedIn: new Date(),
        prefLocale: data.prefLocale
      });

      // Validate
      userObj.validate()
        .then(() => userObj.save())
        .then((saveData) => {
          hatchet.send("create_user", {
            userId: userObj.getDataValue("id"),
            username: userObj.getDataValue("username"),
            email: userObj.getDataValue("email"),
            locale: userObj.getDataValue("prefLocale"),
            subscribeToWebmakerList: userObj.getDataValue("subscribeToWebmakerList"),
            client_id: data.client_id
          });

          callback(null, saveData);
        })
        .catch(callback);
    },

    /**
     * updateUser( email, data, callback )
     * -
     * email: email address
     * data: JSON object containing user fields
     * callback: function( err, user )
     */
    updateUser: function (email, data, callback) {
      this.getUserByEmail(email, function (err, user) {
        var error;

        if (err) {
          return callback(err);
        }

        if (!user) {
          return callback("User not found!");
        }

        // Selectively update the user model
        Object.keys(data).forEach(function (key) {
          user[key] = data[key];
        });

        error = user.validate();
        if (error) {
          return callback(error);
        }

        user
          .save()
          .then(() => callback())
          .catch((err) => callback(err));
      });
    },

    /**
     * deleteUser( email, callback )
     * -
     * email: email address
     * callback: function( err, thisUser )
     */
    deleteUser: function (email, callback) {
      // Check user exists (sequelize happily deletes
      // non existant-users)
      this.getUserByEmail(email, function (err, user) {
        if (err) {
          return callback(err);
        }

        if (!user) {
          return callback("User not found!");
        }

        // Delete user
        user
          .destroy()
          .then(function () {
            hatchet.send("delete_user", {
              userId: user.getDataValue("id"),
              username: user.getDataValue("username"),
              locale: user.getDataValue("prefLocale"),
              email: user.getDataValue("email")
            });

            callback();
          })
          .catch((err) => callback(err));
      });
    },

    /**
     * getAllWithEmails( emails, callback )
     * -
     * emails: Array of Emails
     * callback: function( err, users )
     */
    getAllWithEmails: function (emails, callback) {
      user.findAll({
          where: {
            "email": emails
          }
        })
        .then((users) => callback(null, users))
        .catch((err) => callback(err));
    },

    /**
     * engagedWithReferrerCode( email, data, userStatus, callback )
     * -
     * email: email address
     * referrerCode: referrer code
     * userStatus: enum ['new', 'existing']
     * callback: function( err )
     */
    engagedWithReferrerCode: function (email, referrerCode, userStatus, callback) {
      if (!referrerCode) {
        return callback();
      }

      this.getUserByEmail(email, function (err, user) {
        if (err) {
          return callback(err);
        }

        if (!user) {
          return callback(new Error("User not found!"));
        }

        var desiredRecord = {
          UserId: user.id,
          referrer: referrerCode
        };

        // Using findOrCreate() so we only have one record per campaign + user
        // but the updatedAt field can change with multiple interactions
        modelReferrerCode.findOrCreate(desiredRecord, desiredRecord)
          .then((referrercode, created) => {
            if (created) {
              // this was new and has now been saved
              referrercode.userStatus = userStatus;
            }

            return referrercode.save();
          })
          .then(() => callback());
      });
    },

    createToken: function (userObj, appURL, migrateUser, callback) {
      var token = loginToken.build({
        token: proquint.encode(crypto.randomBytes(4)),
        UserId: userObj.id
      });

      token.save()
        .then(savedToken => {
          var loginUrlObj = url.parse(appURL, true);
          loginUrlObj.search = null;
          loginUrlObj.query.uid = userObj.getDataValue("username");
          loginUrlObj.query.email = userObj.getDataValue("email");
          loginUrlObj.query.token = savedToken.token;

          // To log loginUrl to console, do not define "HATCHET_QUEUE_URL" in your environment
          hatchet.send("login_token_email", {
            userId: userObj.getDataValue("id"),
            username: userObj.getDataValue("username"),
            verified: userObj.getDataValue("verified"),
            email: userObj.getDataValue("email"),
            loginUrl: url.format(loginUrlObj),
            token: savedToken.token,
            migrateUser: migrateUser
          });

          callback();
        })
        .catch(callback);
    },

    lookupToken: function (userObj, token, callback) {
      loginToken.find({
          where: {
            UserId: userObj.id,
            token: token,
            used: false,
            createdAt: {
              gte: moment(Date.now() - TOKEN_EXPIRY_TIME).utc().format("YYYY-MM-DD HH:mm:ss Z")
            }
          }
        })
        .then(loginToken => {
          if (!loginToken) {
            return bPromise.reject({
              error: "unauthorized"
            });
          }

          return loginToken.updateAttributes({
            used: true
          }, ["used"]);
        })
        .then(() => callback())
        .catch(callback)
    },

    invalidateActiveResets: function (user, callback) {
      resetCode.update({
          invalid: true
        }, {
          where: {
            UserId: user.id,
            used: false,
            invalid: false,
            createdAt: {
              gte: moment(Date.now() - RESET_EXPIRY_TIME).utc().format("YYYY-MM-DD HH:mm:ss Z")
            }
          }
        })
        .then(affectedRows => {
          callback(null, affectedRows);
        })
        .catch(callback);
    },

    createResetCode: function (user, appURL, callback) {
      var code = hat(RESET_CODE_BIT_LENGTH, RESET_CODE_BASE);
      var userResetCode = resetCode.build({
        code: code,
        UserId: user.id
      });

      var resetUrlObj = url.parse(appURL || env.get("RESET_URL"), true);
      resetUrlObj.search = null;
      resetUrlObj.query.uid = user.getDataValue("username");
      resetUrlObj.query.resetCode = userResetCode.getDataValue("code");

      userResetCode
        .save()
        .then(() => {
          hatchet.send("reset_code_created", {
            email: user.getDataValue("email"),
            username: user.getDataValue("username"),
            resetUrl: url.format(resetUrlObj)
          });
          callback();
        })
        .catch(err => {
          console.error(err);
          callback("Error Creating Reset Authorization");
        });
    },

    validateReset: function (code, user, callback) {
      resetCode.find({
          where: {
            code: code,
            UserId: user.id,
            used: false,
            invalid: false,
            createdAt: {
              gte: moment(Date.now() - RESET_EXPIRY_TIME).utc().format("YYYY-MM-DD HH:mm:ss Z")
            }
          }
        })
        .then(resetcode => {
          if (!resetcode) {
            return callback(null, false);
          }

          return resetcode
            .updateAttributes({
              used: true
            }, ["used"]);
        })
        .then(() => callback(null, true))
        .catch(callback);
    },

    changePassword: function (newPass, user, callback) {
      var pass = user.Password || password.build();

      bcrypt.genSalt(BCRYPT_ROUNDS, (err, salt) => {
        bcrypt.hash(newPass, salt, (err, hash) => {
          pass.saltedHash = hash;
          user
            .updateAttributes({
              usePasswordLogin: true
            }, ["usePasswordLogin"])
            .then(() => user.setPassword(pass))
            .then(() => {
              hatchet.send("user-password-changed", {
                email: user.getDataValue("email"),
                username: user.getDataValue("username")
              });
              callback(null);
            })
            .catch(err => {
              console.error(err);
              callback({
                error: "Login Database Error"
              });
            });
        });
      });
    },

    removePassword: function (user, callback) {
      user.Password.destroy()
        .then(() =>
          user.update({
            usePasswordLogin: false
          }, ["usePasswordLogin"])
        )
        .then(() => callback())
        .catch(err => {
          console.error(err);
          callback({
            error: "Error removing password"
          });
        });
    },

    compare: function (pass, user, callback) {
      bcrypt.compare(pass, user.Password.saltedHash, callback);
    },

    createOauthLogin: function (userId, clientId, callback) {
      oauthClient.findOrCreate({
          client: clientId
        }, {
          client: clientId
        }).then(client => oauthLogin.create({
          OAuthClientId: client.id,
          UserId: userId
        }))
        .then(() => callback())
        .error(callback);
    }
  };
};
