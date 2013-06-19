define(['jquery'],
  function($){
  "use strict";
  debugger;
    // Which button do we show?
  var emailMeta = document.querySelector("meta[name='persona-email']"),
      cookieEmail = emailMeta.content ? emailMeta.content : "",
      loggedIn = !!cookieEmail,
      csrfMeta = document.querySelector("meta[name='X-CSRF-Token']"),
      HOSTNAME = document.querySelector("meta[name='hostname']").content;

  var buttonIframe = document.querySelector( "#persona-iframe" );

  var ui = {
    displayLogin: function(userData) {
      var placeHolder = $("#identity"),
          userElement = $('div.user-name');
      if (userData) {
        placeHolder.html('<a href="'+ HOSTNAME + '/account">' + userData.name + '</a>');
        placeHolder.before("<img src='https://secure.gravatar.com/avatar/" + userData.hash + "?s=26&d=http%3A%2F%2Fstuff.webmaker.org%2Favatars%2Fwebmaker-avatar-44x44.png' alt='" + userData.hash + "'>");
      } else {
        userElement.html("<span id='identity'></span>");
      }
    },
    checkMaker: function(userData, callback) {
      $.ajax({
        type: "GET",
        url: "/user/" + userData.loggedInUser,
        headers: {
          "X-CSRF-Token": csrfMeta.content
        },
        dataType: "json",
        success: function(resp) {
          ui.existingMaker({
            name: resp.user.username,
            hash: resp.user.emailHash
          });
          callback(null, userData.loggedInUser, resp.user.username);
        },
        error: function(resp) {
          ui.newMaker();
          return false;
        }
      });
    },
    newMaker: function() {
      window.location = HOSTNAME + "/account/new";
    },
    existingMaker: function(userData) {
      /**
       * API call to the getUserData API
       * display logged in user data in the UI (where to be defined)
       */
      ui.displayLogin(userData);
    },
    loggedOut: function() {
      /**
       * remove logged in user data from the UI
       * remove any listeners we have attached
       */
      ui.displayLogin();
      $(".webmaker-create-user").slideUp();
    }
  };

  // Set up the 'my makes' functionality.
  var makes = $("#webmaker-nav .my-projects-container"),
      makeButton = $("#webmaker-nav .makes button").click(function() {
        makes.toggleClass("open");
      });

  // Window level control over updating the iframe when a consumer
  // app knows that the publications have changed and need to be
  // refreshed:
  window.userBar = window.userBar || {
    updateMakes: function() {
      var iframe = $("iframe",makes)[0];
      iframe.src = iframe.src;
    }
  };

  // User-defined login/logout handling
  var noop = function(){};
  navigator.idSSO.app = navigator.idSSO.app || {};
  navigator.idSSO.app.onlogin = navigator.idSSO.app.onlogin || noop;
  navigator.idSSO.app.onlogout = navigator.idSSO.app.onlogout || noop;


  // Start listening for Persona events
  navigator.idSSO.watch({
    // Note: 'loggedInUser:cookieEmail' yet, see https://bugzilla.mozilla.org/show_bug.cgi?id=872710
    onlogin: function(assertion) {
      $.ajax({
        type: 'POST',
        url: '/persona/verify',
        headers: {
          "X-CSRF-Token": csrfMeta.content
        },
        data: {assertion: assertion},
        success: function(res, status, xhr) {
          ui.checkMaker( { loggedInUser:res.email }, function (err, loggedInUser, displayName) {
            // hook-out to the owning page, so that it can perform a
            // webmaker-loginAPI lookup, allowing it to bind the user's
            // email and webmaker ID in its req.session.[...]
            $.ajax({
              type: 'GET',
              url: "/user/" + loggedInUser,
              headers: {
                "X-CSRF-Token": csrfMeta.getAttribute("content")
              },
              dataType: "json",
              success: function(res, status, xhr) {
                if (res.status === "failed") {
                  navigator.idSSO.logout();
                } else if (res.user.username !== displayName) {
                  navigator.idSSO.logout();
                } else {
                  // login succeeded, show this user as logged in
                  // and call the on-page onlogin handler.
                  $( buttonIframe ).addClass("loggedin");
                  $('body').addClass("loggedin");
                  navigator.idSSO.app.onlogin(loggedInUser, displayName, res.user);
                }
              },
              error: function(xhr, status, err) {
                navigator.idSSO.logout();
              }
            });
          });
        },
        error: function(xhr, status, err) {
          navigator.idSSO.logout();
        }
      });
    },
    onlogout: function() {
      ui.loggedOut();
      makes.removeClass("open");
      $('body').removeClass("loggedin");
      $(buttonIframe).removeClass("loggedin");
      // make sure the page does whatever it needs to,
      navigator.idSSO.app.onlogout();
      // and make sure the app knows we're logged out.
      $.ajax({
        type: "POST",
        url: "/persona/logout",
        headers: {
          "X-CSRF-Token": csrfMeta.content
        },
        async: true
      });
    }
  });
});
