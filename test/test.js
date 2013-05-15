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

  it( 'should create a new login with only required fields', function( done ) {
    var email = "test@testing.com",
        newUser = {
          _id: email,
          email: email,
          fullName: "Test User"
        };

    apiHelper( 'post', null, newUser, function( err, res, body ) {
      assert.ok( !err );
      assert.equal( res.statusCode, 200 );
      assert.equal( body.user._id, email );
      assert.equal( body.user.email, email );
      assert.equal( body.user.fullName, newUser.fullName );
      done();
    });
  });

});
