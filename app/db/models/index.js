var Sequelize = require("sequelize");
var moment = require("moment");
var crypto = require("crypto");
var proquint = require("proquint");
var hat = require("hat");
var hatchet = require("hatchet");
var url = require("url");
var bcrypt;

var Op = Sequelize.Op;

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
      user.findById(id)
        .then(user => callback(null, user))
        .catch(callback);
    },

    /**
     * getUserByUsername( username, callback )
     * -
     * username: username
     * callback: function( err, user )
     */
    getUserByUsername: function (username, callback) {
      user.findOne({
        where: {
          username: username
        }
      })
        .then(user => callback(null, user))
        .catch(callback);
    },

    /**
     * getUserByEmail( email, callback )
     * -
     * email: email
     * callback: function( err, user )
     */
    getUserByEmail: function (email, callback) {
      user.findOne({
        where: {
          email: email
        }
      })
        .then(user => callback(null, user))
        .catch(callback);
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
        .then(users => callback(null, users))
        .catch(callback);
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
        .then(users => callback(null, users))
        .catch(callback);
    },

    /**
     * getUserByEmail( email, callback )
     * -
     * emails: array of emails
     * callback: function( err, user )
     */
    getUsersByEmails: function (emails, callback) {
      user.findAll({
        where: {
          email: emails
        }
      })
        .then(users => callback(null, users))
        .catch(callback);
    },

    /**
     * createUser( data, callback )
     * -
     * data: JSON object containing user fields
     * callback: function( err, thisUser )
     */
    createUser: function (data, callback) {
      var userObj;

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
        .then(() => {
          // Delegates all server-side validation to sequelize during this step
          return userObj.save()
            .then(saveData => {
              hatchet.send("create_user", {
                userId: userObj.getDataValue("id"),
                username: userObj.getDataValue("username"),
                email: userObj.getDataValue("email"),
                locale: userObj.getDataValue("prefLocale"),
                subscribeToWebmakerList: userObj.getDataValue("subscribeToWebmakerList"),
                client_id: data.client_id
              });

              callback(null, saveData);
            });
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
      this.getUserByEmail(email, (err, user) => {
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

        user.validate()
          .then(() => user.save())
          .then(user => callback(null, user))
          .catch(callback);
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
      this.getUserByEmail(email, (err, user) => {
        if (err) {
          return callback(err);
        }

        if (!user) {
          return callback("User not found!");
        }

        const data = {
          userId: user.getDataValue("id"),
          username: user.getDataValue("username"),
          locale: user.getDataValue("prefLocale"),
          email: user.getDataValue("email")
        };

        // Delete user
        user.destroy()
          .then(() => {
            hatchet.send("delete_user", data);
            return callback();
          })
          .catch(callback);
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
        .then(users => callback(null, users))
        .catch(callback);
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

      this.getUserByEmail(email, (err, user) => {
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
          .spread((referrercode, created) => {
            if (created) {
              // this was new and has now been saved
              referrercode.userStatus = userStatus;
              return referrercode.save();
            }

            // save this again to update the autogenerated updatedAt field
            return referrercode.save();
          })
          .then(referrercode => callback(null, referrercode))
          .catch(callback);
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

          return callback();
        })
        .catch(callback);
    },

    lookupToken: function (userObj, token, callback) {
      loginToken.findOne({
          where: {
            UserId: userObj.id,
            token: token,
            used: false,
            createdAt: {
              [Op.gte]: moment(Date.now() - TOKEN_EXPIRY_TIME).utc().format("YYYY-MM-DD HH:mm:ss Z")
            }
          }
      })
        .then(function (loginToken) {
          if (!loginToken) {
            throw {
              error: "unauthorized"
            };
          }

          return loginToken.update({ used: true }, { fields: ["used"] });
        })
        .then(() => callback()) // .then gets passed a bunch of params that we don't want to pass back to callback
        .catch(callback);
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
            [Op.gte]: moment(Date.now() - RESET_EXPIRY_TIME).utc().format("YYYY-MM-DD HH:mm:ss Z")
          }
        }
      })
        .then(affectedRows => callback(null, affectedRows))
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
        .then(function () {
          hatchet.send("reset_code_created", {
            email: user.getDataValue("email"),
            username: user.getDataValue("username"),
            resetUrl: url.format(resetUrlObj)
          });
          callback();
        })
        .catch(function (err) {
          console.error(err);
          callback("Error Creating Reset Authorization");
        });
    },

    validateReset: function (code, user, callback) {
      resetCode.findOne({
        where: {
          code,
          UserId: user.id,
          used: false,
          invalid: false,
          createdAt: {
            [Op.gte]: moment(Date.now() - RESET_EXPIRY_TIME).utc().format("YYYY-MM-DD HH:mm:ss Z")
          }
        }
      })
        .then(function (rc) {
          if (!rc) {
            return callback(null, false);
          }

          return rc.update({
            used: true
          }, {
            fields: ["used"]
          })
            .then(() => callback(null, true));
        })
        .catch(callback);
    },

    changePassword: function (newPass, user, callback) {
      var pass = user.password || password.build();

      bcrypt.genSalt(BCRYPT_ROUNDS, function (err, salt) {
        bcrypt.hash(newPass, salt, function (err, hash) {
          pass.saltedHash = hash;
          user.update({
            usePasswordLogin: true
          }, {
            fields: ["usePasswordLogin"]
          })
            .then(() => user.setPassword(pass))
            .then(() => {
              hatchet.send("user-password-changed", {
                email: user.getDataValue("email"),
                username: user.getDataValue("username")
              });
              callback(null);
            })
            .catch(function (err) {
              console.error(err);
              callback({
                error: "Login Database Error"
              });
            });
        });
      });
    },

    removePassword: function (user, callback) {
      user.password.destroy()
        .then(() =>
          user.update({
            usePasswordLogin: false
          }, {
            fields: ["usePasswordLogin"]
          })
        )
        .then(() => callback()) // .then gets passed a bunch of params that we don't want to pass back to callback
        .catch(function (err) {
          console.error(err);
          callback({
            error: "Error removing password"
          });
        });
    },

    compare: function (pass, user, callback) {
      bcrypt.compare(pass, user.password.saltedHash, function (err, res) {
        callback(err, res);
      });
    },

    createOauthLogin: function (userId, clientId, callback) {
      oauthClient.findOrCreate({
        where: {
          client: clientId
        },
        defaults: {
          client: clientId
        }
      })
        .spread(client => {
          return oauthLogin.create({
            OAuthClientId: client.id,
            UserId: userId
          });
        })
        .then(() => callback()) // .then gets passed a bunch of params that we don't want to pass back to callback
        .catch(callback);
    }
  };
};
