
module.exports = function( sequelize, DataTypes ) {
  return sequelize.define( "Password", {
    hash: {
      type: DataTypes.STRING(60)
    },
    salt: {
      type: DataTypes.UUID
    }
  });
};
