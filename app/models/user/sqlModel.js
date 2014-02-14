var badword = require( "badword" ),
    defaultGravatar = encodeURIComponent("https://stuff.webmaker.org/avatars/webmaker-avatar-44x44.png"),
    md5 = require( "MD5" ),
    isNotBlacklisted,
    isUsername,
    usernameRegex = /^[abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789\-\_]{1,20}$/;

/**
 * Custom Validation
 */
isNotBlacklisted = function( str ) {
  if ( badword( str ) ) {
    throw new Error("Contains a bad word!");
  }
};

isUsername = function( str ) {
  if ( (typeof( str ) !== "string") || !usernameRegex.test( str ) ) {
    throw new Error("Invalid username. All usernames must be between 1-20 characters, " +
                    "and only include \"-\", \"_\" and alphanumeric characters");
  }
};

/**
 * Exports
 */
module.exports = function( sequelize, DataTypes ) {
  return sequelize.define( "User", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    email: {
      type: DataTypes.STRING,
      validate: {
        isEmail: true
      },
      allowNull: false,
      unique: true
    },
    username: {
      type: "VARCHAR(20)",
      validate: {
        isUsername: isUsername,
        isNotBlacklisted: isNotBlacklisted
      },
      allowNull: false,
      unique: true
    },
    fullName: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: false
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    lastLoggedIn: {
      type: "TIMESTAMP NULL DEFAULT NULL"
    },
    isAdmin: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isCollaborator: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isSuspended: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    sendNotifications: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    sendEngagements: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    sendEventCreationEmails: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    wasMigrated: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    avatar: {
      type: DataTypes.STRING,
      get: function() {
        return "https://secure.gravatar.com/avatar/" +
                md5(this.getDataValue("email")) +
                "?s=26&d=" + defaultGravatar;
      }
    },
    emailHash: {
      type: DataTypes.STRING,
      get: function() {
        return md5(this.getDataValue("email"));
      }
    },
    displayName: {
      type: DataTypes.STRING,
      get: function() {
        return this.getDataValue("fullName")
      }
    }
  }, {
    charset: 'utf8',
    collate: 'utf8_general_ci'
  });
};

