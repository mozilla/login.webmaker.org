/**
 * Exports
 */
module.exports = function( sequelize, DataTypes ) {
  return sequelize.define( "EngagedWithCampaign", {
    referrer: {
      type: DataTypes.STRING
    }
  }, {
    charset: 'utf8',
    collate: 'utf8_general_ci'
  });
};
