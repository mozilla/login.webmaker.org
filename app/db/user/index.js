var moment = require("moment");
var bPromise = require("bluebird");
var crypto = require("crypto");
var proquint = require("proquint");
var env = require("../../../config/environment");
var hatchet = require("hatchet");

module.exports = function (sequelize) {

  var TOKEN_EXPIRY_TIME = 1000 * 60 * 30;

  var model = sequelize.import(__dirname + '/model.js');
  var modelReferrerCode = sequelize.import(__dirname + '/modelreferrercode.js');
  var loginToken = sequelize.import(__dirname + '/loginToken.js');

  model.hasMany(modelReferrerCode);
  modelReferrerCode.belongsTo(model);

  model.hasMany(loginToken);
  loginToken.belongsTo(model);

  return {

    model: model,
    loginToken: loginToken,

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

    /**
     * engagedWithReferrerCode( email, data, userStatus, callback )
     * -
     * email: email address
     * referrerCode: referrer code
     * userStatus: enum ['new', 'existing']
     * callback: function( err )
     */
    engagedWithReferrerCode: function ( email, referrerCode, userStatus, callback ) {
      if ( !referrerCode ) {
        return callback();
      }

      this.getUserByEmail( email, function( err, user ) {
        if ( err ) {
          return callback( err );
        }

        if ( !user  ) {
          return callback( new Error ("User not found!") );
        }

        var desiredRecord = {
          UserId: user.id,
          referrer: referrerCode
        };

        // Using findOrCreate() so we only have one record per campaign + user
        // but the updatedAt field can change with multiple interactions
        modelReferrerCode.findOrCreate(desiredRecord, desiredRecord).success(function(referrercode, created) {
          if (created) {
            // this was new and has now been saved
            referrercode.userStatus = userStatus;
            referrercode.save().complete( callback );
          } else {
            // save this again to update the autogenerated updatedAt field
            referrercode.save().complete( callback );
          }
        });
      });
    },

    createToken: function( email, callback ) {
      this.getUserByEmail(email, function(err, user) {
        if (err) {
          return res.json({
            "error": "Login database error",
            "login_error": err instanceof Error ? err.toString() : err
          });
        }

        if ( !user ) {
          return callback({
            "error": "User not found"
          });
        }

        var token = loginToken.build({
          token: proquint.encode( crypto.randomBytes( 4 ) ),
          UserId: user.id
        });

        token.save().complete(function( err, savedToken) {
          if (err) {
            return callback(err);
          }

          // To log loginUrl to console, do not define "HATCHET_QUEUE_URL" in your environment
          hatchet.send("login_token_email", {
            userId: user.getDataValue("id"),
            username: user.getDataValue("username"),
            email: user.getDataValue("email"),
            loginUrl: env.get("WEBMAKERORG") + "/?email=" + user.getDataValue("email") + "&token=" + savedToken.token,
            token: savedToken.token
          });

          callback();
        });
      });
    },

    lookupToken: function( email, token, callback ) {
      var user;

      model.find({
        where: {
          email: email
        },
        include: [{
          model: loginToken,
          where: {
            token: token,
            used: false,
            createdAt: {
              gte: moment(Date.now() - TOKEN_EXPIRY_TIME).utc().format("YYYY-MM-DD HH:mm:ss Z")
            }
          }
        }]
      }).
      then(function(foundUser) {
        if (!foundUser || !foundUser.loginTokens || !foundUser.loginTokens.length) {
          return bPromise.reject({
            error:"unauthorized"
          });
        }

        user = foundUser;

        return user.loginTokens[0].updateAttributes({
            used: true
          }, ["used"]);

      })
      .then(function(){
        callback(null, user);
      })
      .caught(function(err) {
        callback(err);
      });
    }
  };
};
