// Exports
module.exports = function ( connection ) {

  var schema = new connection.Schema({
    word: {
      type: String,
      required: true,
      unique: true
    }
  });

  return connection.model( 'blacklist', schema );
};
