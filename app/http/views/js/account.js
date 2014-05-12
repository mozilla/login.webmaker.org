 requirejs.config({
    baseUrl: "/js",
    paths: {
      "analytics": "/bower/webmaker-analytics/analytics",
      "jquery": "../bower/jquery/jquery.min",
      "webmaker-auth-client": "/bower/webmaker-auth-client/dist/webmaker-auth-client.min",
      "languages": "/bower/webmaker-language-picker/js/languages",
      "list": "/bower/listjs/dist/list.min",
      "fuzzySearch": "/bower/list.fuzzysearch.js/dist/list.fuzzysearch.min",
      "selectize": "../bower/selectize/dist/js/standalone/selectize.min",
      "text": "../bower/text/text"
    }
  });
  require([ "jquery", "languages", "webmaker-auth-client", "selectize" ], function ($, Languages, WebmakerAuthClient, Selectize) {
    var langSelector = document.querySelector('#lang-picker'),
        csrf_token = $( "meta[name='csrf-token']" ).attr( "content" );

    var webmakerAuthClient = new WebmakerAuthClient({
      csrfToken:csrf_token
    });

    //initialized language selectize -- used in signup for webmaker-auth-client
    $('#supportedLocales').selectize();

    // CRSF Protection
    $.ajaxSetup({
      beforeSend: function( request ) {
       request.setRequestHeader( "X-CSRF-Token", csrf_token ); // express.js uses a non-standard name for csrf-token
      }
    });

    var loginEl = $('.webmaker-login');
    var logoutEl = $('.webmaker-logout');

    function toggleUserData(userData) {
      var placeHolder = $('#identity');
      var userElement = $('div.user-name');
      var lang = $('html').attr('lang') || 'en-US';

      if (userData) {
        placeHolder.html('<img src="https://secure.gravatar.com/avatar/' +
          userData.emailHash + '?s=26&d=https%3A%2F%2Fstuff.webmaker.org%2Favatars%2Fwebmaker-avatar-44x44.png" alt="">' +
          '<a href="/' + lang + '/account">' + userData.username + "</a>");
      } else {
        userElement.html('<span id="identity"></span>');
      }
    }

    function onLogin( user ) {
      $('#webmaker-nav').addClass('loggedin');
      toggleUserData(user);
      loginEl.hide();
      logoutEl.show();

      $( "#logout-message" ).hide();
      $( ".wm-user-panel" ).fadeIn();
      $( ".wm-email" ).text( user.email );
      $( ".wm-page").html( '<a href="//' + user.username + "{{ profile }}" +'">' + user.username + "{{ profile }}" + '</a>');
      $( ".wm-username" ).text( user.username );
      $( "#user-avatar" ).css( "background-image", "url(https://secure.gravatar.com/avatar/" + user.emailHash + "?s=200&d=https%3A%2F%2Fstuff.webmaker.org%2Favatars%2Fwebmaker-avatar-200x200.png)" );

      $( "#sendEventCreationEmailsCheckbox" ).prop( "checked", user.sendEventCreationEmails );
    }

    function onLogout() {
      $('#webmaker-nav').removeClass('loggedin');
      toggleUserData();
      loginEl.show();
      logoutEl.hide();
      $( ".wm-user-panel" ).hide();
      $( "#confirm-delete" ).hide();
    }

    webmakerAuthClient.on( "login", onLogin );
    webmakerAuthClient.on( "logout", onLogout );

    loginEl.click( webmakerAuthClient.login );
    logoutEl.click( webmakerAuthClient.logout );

    webmakerAuthClient.verify();

    $( "#delete-account" ).click(function( e ){
      e.preventDefault();
      $( "#confirm-delete" ).fadeIn();
    });
    $( "#delete-me" ).click(function( e ){
      if ( $( "#email-check" ).val() === $( ".wm-email" ).text() ) {
        $.post( "/account/delete", function( data ) {
          if ( !data.error ) {
            webmakerAuthClient.off( "logout", onLogout );
            webmakerAuthClient.on( "logout", function onDelete() {
              setTimeout(function() {
                window.location.href = "{{ WEBMAKERORG }}";
              }, 2000);
            });
            webmakerAuthClient.on( "error", function onError( error ) {
              webmakerAuthClient.off( "error", onError );
              webmakerAuthClient.off( "logout", onDelete );
              webmakerAuthClient.on( "logout", onLogout );
              alert( error );
            });
            webmakerAuthClient.logout();
          }
        });
      } else {
        $( "#wrong-email" ).fadeIn();
        setTimeout(function() {
          $( "#wrong-email" ).fadeOut();
        }, 3000);
      }
    });

    // The button to close the confirm-delete box
    $( "#boxclose" ).click(function() {
      $( "#confirm-delete" ).fadeOut();
    });

    $( "#sendEventCreationEmailsCheckbox" ).change(function(e) {
      var checked = $( this ).prop( "checked" ) ? true : false;

      $.ajax({
        type: "PUT",
        url: "/account/update",
        data: JSON.stringify({
          sendEventCreationEmails: checked
        }),
        contentType: "application/json",
        success: function( data, textStatus ) {
          $( ".email-prefs.prefs-saved" ).fadeIn().delay( 1000 ).fadeOut();
        },
        error: function( jqXHR, textStatus, errorThrown ) {
          $( ".email-prefs.prefs-error" ).fadeIn().delay( 1000 ).fadeOut();
        }
      });
    });

    $("#languagePref").selectize({
        onChange: function(value) {
          $.ajax({
            type: "PUT",
            url: "/account/update",
            data: {
              prefLocale: value
            },
            success: function( data, textStatus ) {
              Languages.langRedirector(value);
            },
            error: function( jqXHR, textStatus, errorThrown ) {
              $( ".email-prefs.prefs-error" ).fadeIn().delay( 1000 ).fadeOut();
            }
          });
        }
    });
  });
