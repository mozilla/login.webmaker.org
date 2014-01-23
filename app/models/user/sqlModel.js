var badword = require( "badword" ),
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
    }
  }, {
    charset: 'utf8',
    collate: 'utf8_general_ci',
    instanceMethods: {
      getValues: function() {
        var obj = this.values;

        return {
          id: obj.id,
          email: obj.email,
          username: obj.username,
          fullName: obj.fullName,
          deletedAt: obj.deletedAt,
          isAdmin: obj.isAdmin,
          isCollaborator: obj.isCollaborator,
          isSuspended: obj.isSuspended,
          sendNotifications: obj.sendNotifications,
          sendEngagements: obj.sendEngagements,
          sendEventCreationEmails: obj.sendEventCreationEmails,
          // wasMigrated: obj.wasMigrated,
          createdAt: obj.createdAt,
          updatedAt: obj.updatedAt,
          displayName: obj.fullName,
          emailHash: md5( obj.email )
        };
      }
    }
  });
};

