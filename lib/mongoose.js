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
  });

  mongoose.connection.on( "open", function () {
    health.connected = true;

    // FOR MOCHA TESTING:
    // If we're running as a child process, let our parent know we're ready.
    if ( process.send ) {
      process.send( 'Started' );
    }    
  });

  // Attempt connection & return getter
  mongoose.connect( env.get("MONGOHQ") || env.get("MONGO_URL") || env.get("MONGO") );

  return {
    "conn": mongoose,
    "healthCheck": function( req, res, next ) {
      if (health.connected) {
        next();
      } 
      else {
        next( new Error( "MongoDB: No connection found!" ) );
      }
    }
  };
};
 
