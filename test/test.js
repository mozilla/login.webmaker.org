var assert = require( 'assert' ),
    fork = require( 'child_process' ).fork,
    request = require( 'request' ),
    now = Date.now(),
    child,
    hostAuth = 'http://travis:travis@localhost:3000',
    hostNoAuth = 'http://localhost:3000',
    illegalChars = "` ! @ # $ % ^ & * ( ) + = ; : ' \" , < . > / ?".split( " " );

    // Adding a space to the illegalChars list
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
  var assertion = customAssertions || function ( err, res, body, callback ) {
    assert.ok( !err );
    assert.equal( res.statusCode, httpCode );
    callback( err, res, body );
  };

  // Track new user, if applicable
  if ( verb === "post" && httpCode == 200 ) {
    userTracer.watchUser( data.email );
  }

  // Remove user from tracker, if applicable
  if ( verb === "delete" && httpCode == 200 ) {
    userTracer.unwatchUser( data.email );
  }

  request({
    url: uri,
    method: verb,
    json: data
  }, function( err, res, body ) {
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
        // Remove user from email
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

/**
 * User functions 
 */

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
      assert.equal( body.user._id, user.email );
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

  it( 'should create the "sendNotifications" user model field as true by default', function ( done ) {
    apiHelper( 'post', api, 200, unique(), function( err, res, body ) {
      assert.equal(body.user.sendNotifications, true);
      done();
    });
  });

  it( 'should create the "sendEngagements" user model field as true by default', function ( done ) {
    apiHelper( 'post', api, 200, unique(), function( err, res, body ) {
      assert.equal(body.user.sendEngagements, true);
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

  it( "should update a user when new, valid, email is passed", function ( done ) {
    var user = unique();

    // Create a user, then update it with a unique email
    apiHelper( 'post', api, 200, user, done, function ( err, res, body, done ) {
      var newEmail = unique().email;

      // Update user
      apiHelper( 'put', hostAuth + "/user/" + user.email, 200, { email: newEmail, _id: newEmail }, done );
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
      apiHelper( 'put', hostAuth + "/user/" + user.email, 404, { email: invalidEmail, _id: invalidEmail }, done );
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
      apiHelper( 'delete', hostAuth + "/user/" + user.email, 200, user, done );
    });
  });

  it( 'should error on attempting to delete a non-existant account', function ( done ) {
    apiHelper( 'delete', hostAuth + "/user/" + unique().email, 404, {}, done );
  });  
});

describe( 'GET /user/:id', function() {
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
      apiHelper( 'get', hostAuth + "/user/" + user.email, 200, {}, done );
    });
  });

  it( 'should successfully return an account when attempting the retrieve an existing user by username', function ( done ) {
    var user = unique();
    
    // Create a user, then attempt to retrieve it 
    apiHelper( 'post', api, 200, user, done, function ( err, res, body, done ) {
      apiHelper( 'get', hostAuth + "/user/" + user.username, 200, {}, done );
    });
  });

  it( 'should error on attempting to retrieve a non-existant account', function ( done ) {
    apiHelper( 'get', hostAuth + "/user/" + unique().email, 404, {}, done );
  });  
});

describe( 'GET /isAdmin/:id', function() {
  var api = hostAuth + '/isAdmin?id=';

  before( function( done ) {
    startServer( done );
  });

  after( function( done ) {
    stopServer( done );
  });

  it( 'should successfully return when attempting to check an existing user', function ( done ) {
    var user = unique();

    user.isAdmin = true;
    
    // Create a user, then attempt to check it 
    apiHelper( 'post',  hostAuth + '/user', 200, user, done, function ( err, res, body, done ) {
      apiHelper( 'get', api + user.email, 200, {}, function( err, res, body ) {
        assert.equal( body.isAdmin, true );
        done();
      });
    });
  });

  it( 'should error on attempting to check a non-existant account', function ( done ) {
    apiHelper( 'get', api + unique().email, 404, {}, done );
  });  
});

describe( 'basicauth', function() {
  // Rather complicated way of stripping correct auth and replacing with bad values
  var invalidAuthAPI = hostAuth.replace( /travis/g, "wrongstring" ) + "/isAdmin?id=";

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

