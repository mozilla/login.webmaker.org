var assert = require( 'assert' ),
    fork = require( 'child_process' ).fork,
    request = require( 'request' ),
    child,
    hostAuth = 'http://travis:travis@localhost:3000',
    hostNoAuth = 'http://localhost:3000';

function startServer( callback ) {
  // Spin-up the server as a child process
  child = fork( 'app.js', null, {} );
  child.on( 'message', function( msg ) {
    if ( msg === 'Started' ) {
      callback();
    }
  });
}

function stopServer() {
  child.kill();
}

describe( '/user routes', function() {

  var api = hostNoAuth + '/user';

  function apiHelper( verb, id, data, callback ) {
    request[ verb ]({
      uri: api + ( id ? '/' + id : '' ),
      data: data,
      json: true
    }, callback );
  }

  before( function( done ) {
    startServer( done );
  });

  after( function() {
    stopServer();
  });

  it( 'should create a new login', function( done ) {
    apiHelper( 'post', null, { email: "test@testing.com" }, function( err, res, body ) {
      assert.ok( !err );
      assert.equal( res.statusCode, 200 );
      assert.deepEqual( body.user, {
        email: "test@testing.com"
      });
      done();
    });
  });

});
