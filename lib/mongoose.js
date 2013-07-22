var mongoose = require( "mongoose" ),
    health  = {
      connected: false,
      err: null
    };

module.exports = function ( env ) {
  // Set listeners
  mongoose.connection.on( "error", function ( err ) {
    health.connected = false;
    health.err = err;

    // FOR MOCHA TESTING:
    // If we're running as a child process, let our parent know there was a
    // problem.
    if ( process.send ) {
      try {
        process.send( "noConnection" );
      } catch ( e ) {
        // exit the worker if master is gone
        process.exit( 1 );
      }
    }


  });

  mongoose.connection.on( "open", function () {
    health.connected = true;

    // FOR MOCHA TESTING:
    // If we're running as a child process, let our parent know we're ready.
    if ( process.send ) {
      try {
        process.send( "Started" );
      } catch ( e ) {
        // exit the worker if master is gone
        process.exit( 1 );
      }
    }
  });

  // Attempt connection & return getter
  mongoose.connect( env.get( "MONGOHQ" ) || env.get( "MONGO_URL" ) || env.get( "MONGO" ) );

  return {
    "conn": mongoose,
    "healthCheck": function( req, res, next ) {
      if ( health.connected ) {
        next();
      }
      else {
        next( new Error( "MongoDB: No connection found!" ) );
      }
    }
  };
};

