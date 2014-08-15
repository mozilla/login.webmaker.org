
module.exports = function( sequelize, DataTypes ) {
  return sequelize.define( "ResetAuthorization", {
    token: {
      type: DataTypes.STRING(32),
      allowNull: false
    },
    used: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  });
};
