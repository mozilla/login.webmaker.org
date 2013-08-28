var Sequelize = require( "sequelize" ),
    badword = require( "badword" ),
    health,
    forkErrorHandling,
    forkSuccessHandling,
    dbHealthCheck,
    dbErrorHandling,
    parseQuery,
    findUserObject;

// Health state
health = {
  connected: false,
  err: null
};

// FOR MOCHA TESTING:
// If we're running as a child process, let our parent know there was a
// problem.
forkErrorHandling = function forkErrorHandling() {
  if ( process.send ) {
    try {
      process.send( "sqlNoConnection" );
    } catch ( e ) {
      // exit the worker if master is gone
      process.exit(1);
    }
  }
};

// FOR MOCHA TESTING:
// If we're running as a child process, let our parent know we're ready.
forkSuccessHandling = function forkSuccessHandling() {
  if ( process.send ) {
    try {
      process.send( "sqlStarted" );
    } catch ( e ) {
      // exit the worker if master is gone
      process.exit(1);
    }
  }
};

// Display a database error
dbErrorHandling = function dbErrorHandling( err, callback ) {
  callback = callback || function() {};

  // Error display
  err = Array.isArray( err ) ? err[ 0 ] : err;
  console.error( "models/user/sqlModel.js: DB setup error\n", err.number ? err.number : err.code, err.message );

  // Set state
  health.connected = false;
  health.err = err;

  callback();
};

/**
 * parseQuery( id )
 * -
 * id: username, email or _id
 */
parseQuery = function parseQuery( id ) {
  var query = {},
      field = "email";

  if ( !id ) {
    return null;
  }

  // Parse out field type
  if ( typeof( id ) === "number" || id.match( /^\d+$/g ) ) {
    field = "id";
  } else if ( id.match( /^[^@]+$/g ) ) {
    field = "username";
    id = id.toLowerCase();
  }
  query[ field ] = id;

  return query;
};

/**
 * findUserObject( id )
 * -
 * id: username, email or _id
 */
findUserObject = function findUserObject ( model, id, callback ) {
  model.find({ where: parseQuery( id ) }).complete( callback );
};

// Exports
module.exports = function( env ) {
  /**
   * ENV parsing
   */
  var db,
      dbOptions = {};

  // DB Config parsing
  db = env.get("DB");
  dbOptions = env.get("DBOPTIONS");

  /**
   * Model preparation
   */
  var sequelize,
      model;

  // Connect to mysql
  try {
    sequelize = new Sequelize( db.database, db.username, db.password, dbOptions );
  } catch ( error ) {
    dbErrorHandling( error, forkErrorHandling );

    return {
      dbHealthCheck: dbHealthCheck
    };
  }

  // Connect to table, confirm health
  model = sequelize.import( __dirname + "/sqlModel.js" );
  sequelize.sync().complete(function( err ) {
    if ( err ) {
      dbErrorHandling( err, forkErrorHandling );
    } else {
      health.connected = true;
      forkSuccessHandling();
    }
  });

  /**
   * Model Access methods
   */
  return {
    /**
     * getUser( id, callback )
     * -
     * id: username, email or _id
     * callback: function( err, user )
     */
    getUser: function( id, callback ) {
      if ( !id ) {
        return callback({ code: 400, err: "Invalid webmaker identifier! Email, numeric ID or username only." });
      }

      findUserObject( model, id, function( err, user ) {
        if ( err ) {
          return callback({ code: 500, message: err });
        }
        if ( !user ) {
          return callback({ code: 404, message: err });
        }
        return callback( null, user.getValues() );
      });
    },
    /**
     * createUser( data, callback )
     * -
     * data: JSON object containing user fields
     * callback: function( err, thisUser )
     */
    createUser: function( data, callback ) {
      var user,
          err,
          userData = {};

      if ( !data ) {
        return callback({ code: 400, message: "No data passed!" });
      }

      if ( !data.username ) {
        return callback({ code: 400, message: "No username passed!" });
      }

      // Confirm username is free
      this.checkUsername( data.username, function( err, unavailable ) {
        if ( err ) {
          return callback( err );
        }

        if ( unavailable ) {
          return callback({ code: 400, message: "The username " + userData.username + " is taken!" });
        }

        // Parse information
        if ( data._id ){
          // MongoDB compatibility hack (deleting `data._id` and passing `data` wasn't working :/)
          userData.email = data.email;
          userData.username = data.username;
          userData.fullName = data.fullName;
          userData.sendEngagements = data.sendEngagements;
          userData.sendNotifications = data.sendNotifications;
          userData.isAdmin = data.isAdmin;
          userData.isSuspended = data.isSuspended;
          userData.wasMigrated = true;
        } else {
          userData = data;

          // Stores user input for username verbatim before lowercasing
          userData.fullName = userData.username;
          userData.username = userData.username.toLowerCase();
        }
        user = model.build( userData );

        // Validate
        err = user.validate();
        if ( err ) {
          return callback({ code: 400, message: err });
        }

        user.save().complete(function( err, user ){
          if ( err ) {
            return callback({ code: 500, message: err });
          }

          return callback( null, user.getValues() );
        });
      });

    },

    /**
     * updateUser( id, data, callback )
     * -
     * id: username, email or _id
     * data: JSON object containing user fields
     * callback: function( err, user )
     */
    updateUser: function ( id, data, callback ) {
      findUserObject( model, id, function( err, user ) {
        var error;

        if ( err ) {
          return callback({ code: 500, message: err });
        }

        if ( !user  ) {
          return callback({ code: 404, message: "User not found!" });
        }

        // Selectively update the user model
        Object.keys( data ).forEach( function ( key ) {
          user[ key ] = data[ key ];
        });

        error = user.validate();
        if ( error ) {
          return callback({ code: 400, message: error });
        }

        user.save().complete(function ( err, user ){
          if ( err ) {
            return callback({ code: 500, message: err });
          }

          callback( null, user.getValues() );
        });
      });
    },

    /**
     * deleteUser( data, callback )
     * -
     * id: _id
     * callback: function( err, thisUser )
     */
    deleteUser: function ( id, callback ) {
      model.find({
        where: parseQuery( id )
      }).complete(function( err, user ){
        if ( err ) {
          return callback({ code: 500, message: err });
        }

        if ( !user ) {
          return callback({ code: 404, message: "User not found for ID " + id });
        }

        user.destroy().complete(function( err ) {
          if ( err ) {
            return callback({ code: 500, message: err });
          }

          return callback();
        });
      });
    },

    /**
     * getAllUsers( callback )
     * -
     * callback: function( err, users )
     */
    getAllUsers: function ( callback ) {
      model.findAll().complete( callback );
    },

    /**
     * checkUsername( username, callback )
     * -
     * username: username to be checked
     * callback: function( err, unavailable )
     */
    checkUsername: function( username, callback ) {
      if ( !username ) {
        return callback ({ code: 400, message: "Username must be provided!" });
      }

      model.count({
        where: {
          username: username
        }
      }).complete(function( error, count ) {
        // DB error
        if ( error ) {
          return callback({ code: 500, message: error });
        }

        // Username in use
        if ( count > 0 ) {
          return callback( null, true );
        }

        // Username blacklisted
        if ( badword( username ) ) {
          return callback({ code: 403, message: "badword" });
        }

        // By default, username not taken
        callback( null, false );
      });
    },
    health: health
  };
};
