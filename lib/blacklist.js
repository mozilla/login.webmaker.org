module.exports = function( Blacklist ) {
  return {
    add: function( word, callback ) {
      var entry = new Blacklist( word );
      // Delegates all validation to mongoose during this step
      entry.save( function( err, entry ) {
        if ( err ) {
          callback( err );
        }
        callback();
      });
    },
    find: function ( word, callback ) {
      Blacklist.findOne({ word: word }, function ( err, entry ) {
        if ( err ) {
          callback( err );
        }
        callback( null, !!entry );
      });
    }
  };
};
