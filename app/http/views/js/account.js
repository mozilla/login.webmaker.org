 requirejs.config({
    baseUrl: "/js",
    paths: {
      "jquery": "ext/jquery-1.9.1.min",
      "persona-sso": "{{ audience }}/sso/include"
    },
    shim: {
      "persona-sso": [],
      "sso-ux": [ "jquery", "persona-sso" ]
    }
  });
  require([ "jquery", "persona-sso", "sso-ux" ], function ($) {
    var personaEmail;

    // CRSF Protection
    var csrf_token = $( "meta[name='X-CSRF-Token']" ).attr( "content" );
    $.ajaxSetup({
      beforeSend: function( request ) {
       request.setRequestHeader( "X-CSRF-Token", csrf_token );
      }
    });

    navigator.idSSO.app.onlogin = function( email, username, data ) {
      personaEmail = email;
      $( "#soundcloud" ).val( data.servicesAccounts.soundcloud );
      $( "#youtube" ).val( data.servicesAccounts.youtube );
      $( "#flickr" ).val( data.servicesAccounts.flickr );
      $( "#logout-message" ).hide();
      $( ".wm-user-panel" ).fadeIn();
      $( ".wm-email" ).text( email );
      $( ".wm-username" ).text( username );
      $( "#user-avatar" ).css( "background-image", "url(https://secure.gravatar.com/avatar/" + data.emailHash + "?s=200&d=https%3A%2F%2Fstuff.webmaker.org%2Favatars%2Fwebmaker-avatar-200x200.png)" );

      $( "#sendEventCreationEmailsCheckbox" ).prop( "checked", data.sendEventCreationEmails );
    };

    navigator.idSSO.app.onlogout = function() {
      $( ".wm-user-panel" ).hide();
      $( "#confirm-delete" ).hide();
    };
    $( "#delete-account" ).click(function( e ){
      e.preventDefault();
      $( "#confirm-delete" ).fadeIn();
    });
    $( "#delete-me" ).click(function( e ){
      if ( $( "#email-check" ).val() === personaEmail ) {
        $.post( "/account/delete", function( data ) {
          if ( !data.error ) {
            $( ".wm-user-panel" ).fadeOut();
            $( "#logout-message" ).fadeIn();
            navigator.idSSO.logout();
            setTimeout(function() {
              window.location.href = "{{ audience }}";
            }, 2000);
          }
        });
      } else {
        $( "#wrong-email" ).fadeIn();
        setTimeout(function() {
          $( "#wrong-email" ).fadeOut();
        }, 3000);
      }
    });

    $( "#sendEventCreationEmailsCheckbox" ).change(function(e) {
      var checked = $( this ).prop( "checked" ) ? 1 : 0;

      $.ajax({
        type: "PUT",
        url: "/user/" + personaEmail,
        data: {
          sendEventCreationEmails: checked
        },
        success: function( data, textStatus ) {
          console.log( data, textStatus );
          $( ".email-prefs.prefs-saved" ).fadeIn().delay( 1000 ).fadeOut();
        },
        error: function( jqXHR, textStatus, errorThrown ) {
          console.log( textStatus, errorThrown );
          $( ".email-prefs.prefs-error" ).fadeIn().delay( 1000 ).fadeOut();
        }
      });
    });
    $( "#servicesSubmit" ).click(function() {
      var soundcloud = $( "#soundcloud" ).val(),
          youtube = $( "#youtube" ).val(),
          flickr = $( "#flickr" ).val(),
          options = {};

      options.youtube = youtube;
      options.soundcloud = soundcloud;
      options.flickr = flickr;

      $.ajax({
        url: "/user/" + personaEmail,
        type: "PUT",
        data: {
          servicesAccounts: options
        },
        success: function( data, textStatus ) {
          console.log( data, textStatus );
          $( ".email-prefs.prefs-saved" ).fadeIn().delay( 1000 ).fadeOut();
        },
        error: function( jqXHR, textStatus, errorThrown ) {
          console.log( textStatus, errorThrown );
          $( ".email-prefs.prefs-error" ).fadeIn().delay( 1000 ).fadeOut();
        }
      });
    });
  });
