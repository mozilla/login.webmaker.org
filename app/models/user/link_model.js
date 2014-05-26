module.exports = function(sequelize, DataTypes) {
  return sequelize.define("Link", {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: sequelize.UUIDV4
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: "Profiles",
      referencesKey: "user_id",
      onDelete: "cascade"
    },
    link: {
      type: DataTypes.TEXT
    }
  }, {
    charset: "utf8",
    collate: "utf8_general_ci"
  });
};
