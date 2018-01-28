var Sequelize = require('sequelize');

module.exports = function (env) {
  var sequelize;
  var health = {
    connected: false,
    err: null
  };
  var handlers = require('./utils/handlers')(health);
  var db = env.get('DB');
  var dbOptions = env.get('DBOPTIONS');

  // Initialize
  try {
    sequelize = new Sequelize(db.database, db.username, db.password, dbOptions);
  } catch (error) {
    handlers.dbErrorHandling(error, handlers.forkErrorHandling);
  }

  // Controllers
  var modelControllers = require('./models')(sequelize, env);

  // Sync
  sequelize.sync()
    .then(() => {
      health.connected = true;
      handlers.forkSuccessHandling();
    })
    .catch(err => handlers.dbErrorHandling(err, handlers.forkErrorHandling));

  // Export models
  return {
    Models: modelControllers
  };
};
