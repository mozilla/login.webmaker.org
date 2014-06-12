module.exports = function( app ) {
  var env = require( "../../config/environment" );
  var url = require("url");

  if ( !env.get( "REDIS_CONNECTION_STRING" ) ) {
    throw new Error("Rate limiting enabled, but no REDIS_CONNECTION_STRING is defined.");
  }

  var redisUrl = url.parse( env.get( "REDIS_CONNECTION_STRING" ) );
  var redisConfig = {
    port: redisUrl.port,
    host: redisUrl.hostname,
    auth: redisUrl.auth,
    db: redisUrl.path.substring( 1 )
  };

  var redisClient = require( "redis" ).createClient( redisConfig.port, redisConfig.host);

  if ( redisConfig.auth ) {
    redisClient.auth( redisConfig.auth );
  }
  if ( redisConfig.db ) {
    redisClient.select( redisConfig.db );
  }

  var limiter = require( "express-limiter" )( app, redisClient );

  limiter({
    path: "/api/v2/user/request",
    method: "post",
    lookup: ["headers.x-forwarded-for", "body.email"],
    // one request per minute - https://github.com/ded/express-limiter/issues/3
    total: 2,
    expire: 1000 * 60
  });

  limiter({
    path: "/api/v2/user/authenticateToken",
    method: "post",
    lookup: ["headers.x-forwarded-for", "body.email"],
    // ten requests per ten seconds - https://github.com/ded/express-limiter/issues/3
    total: 11,
    expire: 1000 * 10
  });

};
