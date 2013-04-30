var mongoose = require( 'mongoose' ),
    health  = {
      connected: false,
      err: null
    };

module.exports = function ( env ) {
  // Set listeners
  mongoose.connection.on( 'error', function ( err ) { 
    health.connected = false;
    health.err = err;
  });

  mongoose.connection.on( 'open', function () {
    health.connected = true;
  });

  // Attempt connection & return getter
  mongoose.connect( env.get('MONGO_URL') );

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
 
