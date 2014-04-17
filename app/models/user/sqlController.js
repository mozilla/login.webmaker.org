var Sequelize = require( "sequelize" ),
    health,
    forkErrorHandling,
    forkSuccessHandling,
    dbHealthCheck,
    dbErrorHandling,
    parseQuery;

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

// Healthcheck middleware
dbHealthCheck = function dbHealthCheck( req, res, next ) {
  if ( health.connected ) {
    next();
  } else {
    next( new Error( "MySQL Error!\n", health.err ) );
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
     * getUserById( id, callback )
     * -
     * id: _id
     * callback: function( err, user )
     */
    getUserById: function( id, callback ) {
      model.find({ where: { id: id } }).complete( callback );
    },

    /**
     * getUserByUsername( username, callback )
     * -
     * username: username
     * callback: function( err, user )
     */
    getUserByUsername: function( username, callback ) {
      model.find({ where: { username: username } }).complete( callback );
    },

    /**
     * getUserByEmail( email, callback )
     * -
     * email: email
     * callback: function( err, user )
     */
    getUserByEmail: function( email, callback ) {
      model.find({ where: { email: email } }).complete( callback );
    },
    /**
     * createUser( data, callback )
     * -
     * data: JSON object containing user fields
     * callback: function( err, thisUser )
     */
    createUser: function( data, callback ) {
      var user,
          err;

      if ( !data ) {
        return callback( "No data passed!" );
      }

      if ( !data.username ) {
        return callback( "No username passed!" );
      }

      if ( !data.email ) {
        return callback( "No email passed!" );
      }

      user = model.build({
        email: data.email,
        fullName: data.username,
        subscribeToWebmakerList: data.mailingList,
        username: data.username.toLowerCase(),
        lastLoggedIn: new Date(),
        referrer: data.referrer
      });

      // Validate
      err = user.validate();
      if ( err ) {
        return callback( err );
      }

      // Delegates all server-side validation to sequelize during this step
      user.save().complete( callback );
    },

    /**
     * updateUser( email, data, callback )
     * -
     * email: email address
     * data: JSON object containing user fields
     * callback: function( err, user )
     */
    updateUser: function ( email, data, callback ) {
      this.getUserByEmail( email, function( err, user ) {
        var error;

        if ( err ) {
          return callback( err );
        }

        if ( !user  ) {
          return callback( "User not found!" );
        }

        // Selectively update the user model
        Object.keys( data ).forEach( function ( key ) {
          user[ key ] = data[ key ];
        });

        error = user.validate();
        if ( error ) {
          return callback( error );
        }

        user.save().complete( callback );
      });
    },

    /**
     * deleteUser( email, callback )
     * -
     * email: email address
     * callback: function( err, thisUser )
     */
    deleteUser: function ( email, callback ) {
      model.find({
          where: { email: email }
        }).complete(function( err, user ){
          if ( err ) {
            return callback( err );
          }

          if ( !user ) {
            return callback( "User not found for email " + email );
          }

          user.destroy().complete( callback );
        });
    },

    /**
     * getAllWithEmails( emails, callback )
     * -
     * emails: Array of Emails
     * callback: function( err, users )
     */
    getAllWithEmails: function( emails, callback ) {
      model.findAll({
        where: { "email": emails }
      }).complete( callback );
    },
    health: health
  };
};
