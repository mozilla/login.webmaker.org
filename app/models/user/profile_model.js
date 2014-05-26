module.exports = function(sequelize, DataTypes) {
  return sequelize.define("Profile", {
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: "Users",
      referencesKey: "id",
      onDelete: "cascade"
    },
    bio: {
      type: DataTypes.TEXT
    },
    location: {
      type: DataTypes.TEXT
    }
  }, {
    charset: "utf8",
    collate: "utf8_general_ci"
  });
};
