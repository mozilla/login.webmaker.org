var assert = require( 'assert' ),
    fork = require( 'child_process' ).fork,
    request = require( 'request' ),
    now = Date.now(),
    child,
    hostAuth = 'http://travis:travis@localhost:3000',
    hostNoAuth = 'http://localhost:3000',
    illegalChars = "` ! @ # $ % ^ & * ( ) + = ; : ' \" , < . > / ?".split( " " ),
    newUsers = []; 

    illegalChars.push(" ");
/**
 * Server functions 
 */

function startServer( done ) {
  // Spin-up the server as a child process
  child = fork( 'app.js', null, {} );
  child.on( 'message', function( msg ) {
    if ( msg === 'Started' ) {
      done();
    }
  });
}

function stopServer() {
  // Purge DB of test users
  userCleanup();

  child.kill();
}

/**
 * Api functions 
 */

function apiHelper( verb, uri, httpCode, data, callback, customAssertions ) {
  // Track new user, if applicable
  if ( data.email && verb === "post" ) {
    userTracker( data.email );
  }

  request({
    url: uri,
    method: verb,
    json: data
  }, function( err, res, body ) {
    // For more complex assertion logic
    if ( customAssertions ) {
      return customAssertions( err, res, body, callback ); 
    }

    assert.ok( !err );
    assert.ok( res.statusCode === httpCode );

    callback( err, res, body );
  });
}

/**
 * User functions 
 */

function unique() {
  var u = ( ++now ).toString( 36 );
  return {
    email: u + '@email.com',
    subdomain: u
  };
}

function userTracker( email ) {
  newUsers.push(email);

  return email;
}

function userCleanup() {
  newUsers.forEach( function ( user ) {
    apiHelper( "delete", hostNoAuth + '/user/' + user, 200, {}, function(){return;}, function(){return;});
  });

  newUsers = [];
}

/**
 * Unit tests
 */

describe( 'POST /user (create)', function() {

  var api = hostNoAuth + '/user';

  before( function( done ) {
    startServer( done );
  });

  after( function() {
    stopServer();
  });

  it( 'should error when missing required subdomain', function( done ) {
    apiHelper( 'post', api, 404, { email: unique().email }, done );
  });

  it( 'should create a new login with minimum required fields', function( done ) {
    var user = unique();

    apiHelper( 'post', api, 200, user, function( err, res, body ) {
      assert.equal( body.user._id, user.email );
      assert.equal( body.user.email, user.email );
      done();
    });
  });

  it( 'should error when subdomain is too long', function( done ) {
    var user = unique();
    user.subdomain = "123456789012345678901";

    apiHelper( 'post', api, 404, user, done );
  });

  it( 'should error when subdomain is too short', function( done ) {
    var user = unique();
    user.subdomain = "";

    apiHelper( 'post', api, 404, user, done );
  });

  // Test subdomain for 404 on illegal characters
  illegalChars.forEach( function( badString ) {
    it( 'should error when subdomain contains the illegal character "' + badString + '"', function( done ) {
      var user = unique();
      user.subdomain = badString;

      apiHelper( 'post', api, 404, user, done );
    });
  });

  it( 'should error when subdomain contains a bad word ("damn" is being tested)', function( done ) {
    var user = unique();
    user.subdomain = "damn";

    apiHelper( 'post', api, 404, user, done );
  });

  it( 'should error when subdomain already exists', function ( done ) {
    var user = unique();

    // Create a user, then create another one with the same subdomain
    apiHelper( 'post', api, 404, user, done, function ( err, res, body, done ) {
      var newUser = unique();
      newUser.subdomain = user.subdomain;

      apiHelper( 'post', api, 404, newUser, done );
    });
  });

  it( 'should create the "createdAt" user model field by default', function ( done ) {
    var user = unique();

    apiHelper( 'post', api, 200, user, function( err, res, body ) {
      assert.ok(!!body.user.createdAt);
      done();
    });
  });

  it( 'should create the "updatedAt" user model field by default', function ( done ) {
    var user = unique();

    apiHelper( 'post', api, 200, user, function( err, res, body ) {
      assert.ok(!!body.user.updatedAt);
      done();
    });
  });

  it( 'should create the "isAdmin" user model field as false by default', function ( done ) {
    var user = unique();

    apiHelper( 'post', api, 200, user, function( err, res, body ) {
      assert.ok(body.user.isAdmin === false);
      done();
    });
  });

  it( 'should create the "isSuspended" user model field as false by default', function ( done ) {
    var user = unique();

    apiHelper( 'post', api, 200, user, function( err, res, body ) {
      assert.ok(body.user.isSuspended === false);
      done();
    });
  });

  it( 'should create the "sendNotifications" user model field as true by default', function ( done ) {
    var user = unique();

    apiHelper( 'post', api, 200, user, function( err, res, body ) {
      assert.ok(body.user.sendNotifications === true);
      done();
    });
  });

  it( 'should create the "sendEngagements" user model field as true by default', function ( done ) {
    var user = unique();

    apiHelper( 'post', api, 200, user, function( err, res, body ) {
      assert.ok(body.user.sendEngagements === true);
      done();
    });
  });

  it( 'should error if webmaker already exists (i.e. the email field is a duplicate)', function ( done ) {
    var user = unique();
    
    // Create a user, then create another one with the same email
    apiHelper( 'post', api, 404, user, done, function ( err, res, body, done ) {
      var newUser = unique();
      newUser.email = user.email;

      apiHelper( 'post', api, 404, newUser, done );
    });
  });
});

describe( 'PUT /user/:id (update)', function() {
  var api = hostNoAuth + '/user';

  before( function( done ) {
    startServer( done );
  });

  after( function() {
    stopServer();
  });
  
  it( "should update a user when new, valid, parameters are passed", function ( done ) {
    var user = unique();

    // Create a user, then update it with a unique subdomain
    apiHelper( 'post', api, 200, user, done, function ( err, res, body, done ) {
      var newUser = unique();
      user.subdomain = newUser.subdomain;

      apiHelper( 'put', hostNoAuth + "/user/" + user.email, 200, user, done );
    });
  });

  it( 'should error when updating a user that does not exist', function ( done ) {
    var user = unique();

    apiHelper( 'put', hostNoAuth + "/user/" + user.email, 404, user, done );
  });

  it( 'should error when updating a user with an invalid parameter', function ( done ) {
    var user = unique();

    // Create user
    apiHelper( 'post', api, 200, user, done, function ( err, res, body, done ) {
      user.subdomain = "damn";

      // Update user
      apiHelper( 'put', hostNoAuth + "/user/" + user.email, 404, user, done );
    });
  });
});

describe( 'DELETE /user/:id', function() {
  var api = hostNoAuth + '/user';

  before( function( done ) {
    startServer( done );
  });

  after( function() {
    stopServer();
  });

  it( 'should successfully delete an account when attempting the action on an existing user', function ( done ) {
    var user = unique();
    
    // Create a user, then attempt to delete it 
    apiHelper( 'post', api, 200, user, done, function ( err, res, body, done ) {
      apiHelper( 'delete', hostNoAuth + "/user/" + user.email, 200, user, done );
    });
  });

  it( 'should error on attempting to delete a non-existant account', function ( done ) {
    apiHelper( 'delete', hostNoAuth + "/user/" + unique().email, 404, {}, done );
  });  
});

describe( 'GET /user/:id', function() {
  var api = hostNoAuth + '/user';

  before( function( done ) {
    startServer( done );
  });

  after( function() {
    stopServer();
  });

  it( 'should successfully return an account when attempting the retrieve an existing user', function ( done ) {
    var user = unique();
    
    // Create a user, then attempt to delete it 
    apiHelper( 'post', api, 200, user, done, function ( err, res, body, done ) {
      apiHelper( 'get', hostNoAuth + "/user/" + user.email, 200, {}, done );
    });
  });

  it( 'should error on attempting to retrieve a non-existant account', function ( done ) {
    apiHelper( 'get', hostNoAuth + "/user/" + unique().email, 404, {}, done );
  });  
});

describe( 'GET /isAdmin/:id', function() {
  var api = hostAuth + '/isAdmin?id=';

  before( function( done ) {
    startServer( done );
  });

  after( function() {
    stopServer();
  });

  it( 'should successfully return when attempting to check an existing user', function ( done ) {
    var user = unique();
    
    // Create a user, then attempt to check it 
    apiHelper( 'post',  hostNoAuth + '/user', 200, user, done, function ( err, res, body, done ) {
      apiHelper( 'get', api + user.email, 200, {}, function( err, res, body ) {
        assert.ok( typeof(body.isAdmin) === "boolean" );
        done();
      });
    });
  });

  it( 'should error on attempting to check a non-existant account', function ( done ) {
    apiHelper( 'get', api + unique().email, 404, {}, done );
  });  
});

describe( 'basicauth', function() {
  var api = 'http://wrong:combo@' + hostAuth.split("@")[1] + "/isAdmin?id=";
  before( function( done ) {
    startServer( done );
  });

  after( function() {
    stopServer();
  });

  it( 'should error when auth is incorrect', function( done ) {
    var user = unique();
    
    // Create a user, then attempt to check it 
    apiHelper( 'post',  hostNoAuth + '/user', 200, user, done, function ( err, res, body, done ) {
      apiHelper( 'get', api + user.email, 401, {}, done);
    });
  });
});