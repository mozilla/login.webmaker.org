var env = require( "../config/environment" ),
    postalservice;

module.exports.sendWelcomeEmail = function( options, callback ) {
  if ( !env.get( "ALLOW_SEND_WELCOME_EMAIL" ) ) {
    console.log( "Sending the welcome email is disabled" );
    return callback();
  }

  if (!postalservice) {
    postalservice = require( "webmaker-postalservice" )({
      key: env.get( "AWS_ACCESS_KEY" ),
      secret: env.get( "AWS_SECRET_KEY" )
    });
  }

  postalservice.sendWelcomeEmail( options, callback );
};
