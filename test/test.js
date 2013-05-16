var assert = require( 'assert' ),
    fork = require( 'child_process' ).fork,
    request = require( 'request' ),
    now = Date.now(),
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

function unique() {
  var unique = ( ++now ).toString( 36 );
  return {
    email: unique + '@email.com',
    subdomain: unique,
    fullName: unique + ' ' + unique
  };
}

describe( '/user routes', function() {

  var api = hostNoAuth + '/user';

  function postHelper( expectError, httpCode, data, callback ) {
    request({
      url: api,
      method: 'post',
      json: data
    }, function( err, res, body ) {
      assert.ok( !!err === expectError );
      assert.ok( res.statusCode, httpCode );
      callback( err, res, body );
    });
  }

  before( function( done ) {
    startServer( done );
  });

  after( function() {
    stopServer();
  });

  it( 'should error when missing required subdomain', function( done ) {
    var info = unique();

    postHelper( false, 404, { email: info.email }, done );
  });

  it( 'should create a new login with minimum required fields', function( done ) {
    var user = unique();

    postHelper( false, 200, user, function( err, res, body ) {
      assert.equal( body.user._id, user.email );
      assert.equal( body.user.email, user.email );
      assert.equal( body.user.fullName, user.fullName );
      done();
    });
  });

});
