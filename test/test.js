var assert = require( "assert" ),
    async = require( "async" ),
    fork = require( "child_process" ).fork,
    request = require( "request" ),
    now = Date.now(),
    env = require( "../config/environment" ),
    child,
    hostAuth,
    hostNoAuth,
    illegalChars = "` ! @ # $ % ^ & * ( ) + = ; : ' \" , < . > / ?".split( " " );

    // Adding a space to the illegalChars list
    illegalChars.push(" ");

    // Parse URLS
    hostAuth = 'http://' + env.get( "ALLOWED_USERS" ).split( "," )[0] + "@" + env.get( "APP_HOSTNAME" ).split( "//" )[1];
    hostNoAuth = env.get( "APP_HOSTNAME" );

/**
 * Server functions
 */

function startServer( done ) {
  var sqlDbCheck = false;

  // Spin-up the server as a child process
  child = fork( "app.js", null, {} );

  // Listen for success, or error with the DB
  child.on( 'message', function( msg ) {
    if ( msg === 'sqlStarted' ) {
      sqlDbCheck = true;
    }
    if ( msg === 'sqlNoConnection' ) {
      console.log( "MySQL database not connected! Tests will fail." );
      child.kill();
      process.exit(1);
    }
    if ( sqlDbCheck ) {
      done();
    }
  });
  child.on( 'error', function(err) {
    console.error( err );
    child.kill();
  });
}

function stopServer( done ) {
  // Delete test users & kill process
  userTracer.userCleanup( function() {
    child.kill();
    done();
  });
}

/**
 * Api functions
 */

function apiHelper( verb, uri, httpCode, data, callback, customAssertions ) {
  // Parameter handling
  if ( typeof( data ) === "function" ) {
    callback = data;
    data = {};
  } else {
    data = data || {};
  }
  callback = callback || function(){};
  customAssertions = customAssertions || function( err, res, body, callback) {
    callback( err, res, body );
  };
  var assertion = function ( err, res, body, callback ) {
    if ( !body ) {
      err = err || "No response body found!";
    }

    assert.ok( !err );
    assert.equal( res.statusCode, httpCode );
    customAssertions( err, res, body, callback );
  };

  request({
    url: uri,
    method: verb,
    json: data
  }, function( err, res, body ) {
    var user;

    if ( err ) {
      return callback( err );
    }

    if ( body ) {
      user = body.user;
    }

    // Track new user, if applicable
    if ( verb === "post" && httpCode == 200 && user ) {
      userTracer.watchUser( user.email );
    }

    assertion( err, res, body, callback );
  });
}

/**
 * [userTracer helper object]
 * -
 * obj.watchUser: Track the passed user
 * obj.unwatchUser: Stop tracking the passed user
 * obj.userCleanup: Deletes all tracked users from database backend
 */
var userTracer = (function() {
  var newUsers = [];

  return {
    watchUser: function ( email ) {
      // Prevent duplicate entries
      if ( newUsers.indexOf( email ) === -1 ){
        newUsers.push( email );
      }
    },
    unwatchUser: function ( email ) {
      var index = newUsers.indexOf( email );

      if ( index !== -1 ){
        // Remove user from list
        newUsers.splice( index, 1 );
      }
    },
    userCleanup: function( callback ) {
      var userCount = newUsers.length;

      callback = callback || function() {};

      // Ensure process is killed
      if ( !userCount ) {
        return callback();
      }

      newUsers.forEach( function ( user ) {
        // Delete each user in turn, then kill the process and
        // run the callback (if present)
        apiHelper( "delete", hostAuth + '/user/' + user, 200, function( err, res, body ){
          if ( !--userCount ) {
            callback();
          }
        });
      });

      // Reset tracking array
      newUsers = [];
    }
  };
})();

function unique() {
  var u = ( ++now ).toString( 36 );
  return {
    email: u + '@email.com',
    username: u
  };
}

/**
 * Unit tests
 */

describe( 'POST /user (create)', function() {

  var api = hostAuth + '/user';

  before( function( done ) {
    startServer( done );
  });

  after( function( done ) {
    stopServer( done );
  });

  it( 'should error when missing required username', function( done ) {
    apiHelper( 'post', api, 404, { email: unique().email }, done );
  });

  it( 'should create a new login with minimum required fields', function( done ) {
    var user = unique();

    apiHelper( 'post', api, 200, user, function( err, res, body ) {
      assert.equal( body.user.fullName, user.username );
      assert.equal( body.user.email, user.email );
      done();
    });
  });

  it( 'should error when username is too long', function( done ) {
    var user = unique();
    user.username = "123456789012345678901";

    apiHelper( 'post', api, 404, user, done );
  });

  it( 'should error when username is too short', function( done ) {
    var user = unique();
    user.username = "";

    apiHelper( 'post', api, 404, user, done );
  });

  // Test username for 404 on illegal characters
  illegalChars.forEach( function( badString ) {
    it( 'should error when username contains the illegal character "' + badString + '"', function( done ) {
      var user = unique();
      user.username = badString;

      apiHelper( 'post', api, 404, user, done );
    });
  });

  it( 'should error when username contains a bad word ("damn" is being tested)', function( done ) {
    var user = unique();
    user.username = "damn";

    apiHelper( 'post', api, 404, user, done );
  });

  it( 'should error when username already exists', function ( done ) {
    var user = unique();

    // Create a user, then create another one with the same username
    apiHelper( 'post', api, 200, user, done, function ( err, res, body, done ) {
      var newUser = unique();
      newUser.username = user.username;

      apiHelper( 'post', api, 404, newUser, done );
    });
  });

  it( 'should create the "createdAt" user model field by default', function ( done ) {
    apiHelper( 'post', api, 200, unique(), function( err, res, body ) {
      assert.ok(!!body.user.createdAt);
      done();
    });
  });

  it( 'should create the "updatedAt" user model field by default', function ( done ) {
    apiHelper( 'post', api, 200, unique(), function( err, res, body ) {
      assert.ok(!!body.user.updatedAt);
      done();
    });
  });

  it( 'should create the "isAdmin" user model field as false by default', function ( done ) {
    apiHelper( 'post', api, 200, unique(), function( err, res, body ) {
      assert.equal(body.user.isAdmin, false);
      done();
    });
  });

  it( 'should create the "isSuspended" user model field as false by default', function ( done ) {
    apiHelper( 'post', api, 200, unique(), function( err, res, body ) {
      assert.equal(body.user.isSuspended, false);
      done();
    });
  });

  it( 'should create the "sendNotifications" user model field as false by default', function ( done ) {
    apiHelper( 'post', api, 200, unique(), function( err, res, body ) {
      assert.equal(body.user.sendNotifications, false);
      done();
    });
  });

  it( 'should create the "sendEngagements" user model field as false by default', function ( done ) {
    apiHelper( 'post', api, 200, unique(), function( err, res, body ) {
      assert.equal(body.user.sendEngagements, false);
      done();
    });
  });

  it( 'should error if webmaker already exists (i.e. the email field is a duplicate)', function ( done ) {
    var user = unique();

    // Create a user, then create another one with the same email
    apiHelper( 'post', api, 200, user, done, function ( err, res, body, done ) {
      var newUser = unique();
      newUser.email = user.email;

      apiHelper( 'post', api, 404, newUser, done );
    });
  });
});

describe( 'PUT /user/:id (update)', function() {
  var api = hostAuth + '/user';

  before( function( done ) {
    startServer( done );
  });

  after( function( done ) {
    stopServer( done );
  });

  it( "should update a user when new, valid, username is passed", function ( done ) {
    var user = unique();
    // Create a user, then update it with a unique username
    apiHelper( 'post', api, 200, user, done, function ( err, res, body, done ) {
      user.username = unique().username;
      apiHelper( 'put', hostAuth + "/user/" + user.email, 200, user, done );
    });
  });


  it( 'should error when updating a user that does not exist', function ( done ) {
    apiHelper( 'put', hostAuth + "/user/" + unique().email, 404, {}, done );
  });

  it( 'should error when updating a user with an invalid username', function ( done ) {
    var user = unique();

    // Create user
    apiHelper( 'post', api, 200, user, done, function ( err, res, body, done ) {
      user.username = "damn";

      // Update user
      apiHelper( 'put', hostAuth + "/user/" + user.email, 404, user, done );
    });
  });

  it( 'should error when updating a user with an invalid email', function ( done ) {
    var user = unique();

    // Create user
    apiHelper( 'post', api, 200, user, done, function ( err, res, body, done ) {
      var invalidEmail = "invalid";

      // Update user
      apiHelper( 'put', hostAuth + "/user/" + user.email, 404, { email: invalidEmail, id: invalidEmail }, done );
    });
  });
});

describe( 'DELETE /user/:id', function() {
  var api = hostAuth + '/user';

  before( function( done ) {
    startServer( done );
  });

  after( function( done ) {
    stopServer( done );
  });

  it( 'should successfully delete an account when attempting the action on an existing user', function ( done ) {
    var user = unique();

    // Create a user, then attempt to delete it
    apiHelper( 'post', api, 200, user, done, function ( err, res, body, done ) {
      // Remove user from auto-delete after test suite
      userTracer.unwatchUser( body.user.email );

      apiHelper( 'delete', hostAuth + "/user/" + body.user.email, 200, user, done );
    });
  });

  it( 'should error on attempting to delete a non-existent account', function ( done ) {
    apiHelper( 'delete', hostAuth + "/user/" + unique().email, 404, {}, done );
  });
});

function getAssertions( err, res, body, callback ) {
  var user = body.user;

  assert.ok( user.hasOwnProperty( "id" ) );
  assert.notDeepEqual( user.id, "undefined" );
  assert.notDeepEqual( user.id, "null" );
  assert.ok( user.hasOwnProperty( "email" ) );
  assert.notDeepEqual( user.email, "undefined" );
  assert.notDeepEqual( user.email, "null" );
  assert.ok( user.hasOwnProperty( "username" ) );
  assert.notDeepEqual( user.username, "undefined" );
  assert.notDeepEqual( user.username, "null" );
  assert.ok( user.hasOwnProperty( "fullName" ) );
  assert.notDeepEqual( user.fullName, "undefined" );
  assert.notDeepEqual( user.fullName, "null" );
  assert.ok( user.hasOwnProperty( "deletedAt" ) );
  assert.notDeepEqual( user.deletedAt, "undefined" );
  assert.notDeepEqual( user.deletedAt, "null" );
  assert.ok( user.hasOwnProperty( "isAdmin" ) );
  assert.notDeepEqual( user.isAdmin, "undefined" );
  assert.notDeepEqual( user.isAdmin, "null" );
  assert.ok( user.hasOwnProperty( "sendNotifications" ) );
  assert.notDeepEqual( user.sendNotifications, "undefined" );
  assert.notDeepEqual( user.sendNotifications, "null" );
  assert.ok( user.hasOwnProperty( "sendEngagements" ) );
  assert.notDeepEqual( user.sendEngagements, "undefined" );
  assert.notDeepEqual( user.sendEngagements, "null" );
  assert.ok( user.hasOwnProperty( "createdAt" ) );
  assert.notDeepEqual( user.createdAt, "undefined" );
  assert.notDeepEqual( user.createdAt, "null" );
  assert.ok( user.hasOwnProperty( "updatedAt" ) );
  assert.notDeepEqual( user.updatedAt, "undefined" );
  assert.notDeepEqual( user.updatedAt, "null" );
  assert.ok( user.hasOwnProperty( "displayName" ) );
  assert.notDeepEqual( user.displayName, "undefined" );
  assert.notDeepEqual( user.displayName, "null" );
  assert.ok( user.hasOwnProperty( "emailHash" ) );
  assert.notDeepEqual( user.emailHash, "undefined" );
  assert.notDeepEqual( user.emailHash, "null" );

  callback( err, res, body );
}

describe( 'GET /user/email/*', function() {
  var api = hostAuth + '/user';

  before( function( done ) {
    startServer( done );
  });

  after( function( done ) {
    stopServer( done );
  });

  it( 'should successfully return an account when attempting the retrieve an existing user by email', function ( done ) {
    var user = unique();

  // Create a user, then attempt to retrieve it
  apiHelper( 'post', api, 200, user, done, function ( err, res, body, done ) {
      apiHelper( 'get', hostAuth + "/user/email/" + user.email, 200, {}, done, getAssertions );
    });
  });

  it( 'should error on attempting to retrieve a non-existent email', function ( done ) {
    apiHelper( 'get', hostAuth + "/user/email/" + unique().email, 404, {}, done );
  });

  it( 'should deal with bogus usernames that look like routes', function( done ) {
    apiHelper( 'get', hostAuth + "/user/email//../../../../../../../../../../../etc/passwd", 404, {}, done );
  });
});

describe( 'GET /user/id/*', function() {
  var api = hostAuth + '/user';

  before( function( done ) {
    startServer( done );
  });

  after( function( done ) {
    stopServer( done );
  });

  it( 'should successfully return an account when attempting the retrieve an existing user by id', function ( done ) {
    var user = unique();

  // Create a user, then attempt to retrieve it
  apiHelper( 'post', api, 200, user, done, function ( err, res, body, done ) {
      apiHelper( 'get', hostAuth + "/user/id/" + body.user.id, 200, {}, done, getAssertions );
    });
  });

  it( 'should error on attempting to retrieve a non-existent id', function ( done ) {
    apiHelper( 'get', hostAuth + "/user/id/" + unique().id, 404, {}, done );
  });

  it( 'should deal with bogus usernames that look like routes', function( done ) {
    apiHelper( 'get', hostAuth + "/user/id//../../../../../../../../../../../etc/passwd", 404, {}, done );
  });
});

describe( 'GET /user/username/*', function() {
  var api = hostAuth + '/user';

  before( function( done ) {
    startServer( done );
  });

  after( function( done ) {
    stopServer( done );
  });

  it( 'should successfully return an account when attempting the retrieve an existing user by username', function ( done ) {
    var user = unique();

  // Create a user, then attempt to retrieve it
  apiHelper( 'post', api, 200, user, done, function ( err, res, body, done ) {
      apiHelper( 'get', hostAuth + "/user/username/" + user.username, 200, {}, done, getAssertions );
    });
  });

  it( 'should error on attempting to retrieve a non-existent account', function ( done ) {
    apiHelper( 'get', hostAuth + "/user/username/" + unique().username, 404, {}, done );
  });

  it( 'should deal with bogus usernames that look like routes', function( done ) {
    apiHelper( 'get', hostAuth + "/user/username//../../../../../../../../../../../etc/passwd", 404, {}, done );
  });
});

describe( 'basicauth', function() {
  // Rather complicated way of stripping correct auth and replacing with bad values
  var invalidAuthAPI = hostAuth.replace( new RegExp( env.get("ALLOWED_USERS").split(",")[0] ), "wrong:string" ) + "/user/email/";

  before( function( done ) {
    startServer( done );
  });

  after( function( done ) {
    stopServer( done );
  });

  it( 'should error when auth is incorrect', function( done ) {
    var user = unique();

    // Create a user, then attempt to check it
    apiHelper( 'post',  hostAuth + '/user', 200, user, done, function ( err, res, body, done ) {
      apiHelper( 'get', invalidAuthAPI + user.email, 401, {}, done);
    });
  });
});

describe( 'GET /usernames', function() {

  var createUsersArray = [];

  function createUniqueUser( callback ) {
    apiHelper( 'post',  hostAuth + '/user', 200, unique(), function ( err, res, body ) {
      if ( err ) {
        return callback( err );
      }
      return callback( null, body.user );
    });
  }

  function randomizeUsernameRequest( userArray ) {
    return userArray.filter(function(elem) {
      return !!Math.round(Math.random());
    }).map(function( elem ) {
      return elem.email;
    });
  }

  function findByEmail( source, email ) {
    return source.filter(function( obj ) {
        return obj.email === email;
    })[ 0 ];
  }

  before( function( done ) {
    startServer( done );
  });

  after( function( done ) {
    stopServer( done );
  });

  it("Should succeed in hydrating an array of emails to their usernames", function( done ) {
    // queue up user creation functions for async
    for ( var i = 0; i < 10; i++ ) {
      createUsersArray.push( createUniqueUser );
    }

    async.parallel( createUsersArray, function( err, users ) {
      var requestArray = randomizeUsernameRequest( users );
      apiHelper( 'get', hostAuth + '/usernames', 200, requestArray, function( err, res, body ) {
        var keys = Object.keys( body );
        assert.equal( keys.length, requestArray.length );
        keys.forEach(function( email ) {
          var user = findByEmail( users, email );
          assert( user );
          assert.equal( user.username, body[ email ].username );
        });
        done();
      });
    });
  });
});
