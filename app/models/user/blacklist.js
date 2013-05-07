// Exports
module.exports = function ( connection ) {

  var schema = new connection.Schema({
    /**
     * subdomain - the user's chosen subdomain. This is also
     * the user's shortname/nickname, like Twitter's @name.
     */
    name: {
      type: String,
      required: true,
      unique: true
    }
  });

  return connection.model( 'blacklist', schema );
};
