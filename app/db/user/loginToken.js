
module.exports = function( sequelize, DataTypes ) {
  return sequelize.define( "LoginToken", {
    token: {
      type: DataTypes.STRING(5)
    },
    failedAttempts: {
      type: DataTypes.INTEGER,
      allowNull: false,
      dafaultValue: 0
    },
    used: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      dafaultValue: false
    }
  });
};
