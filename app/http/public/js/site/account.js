define(['jquery', 'persona-sso', 'sso-ux'], function ($) {
  var personaEmail;

  // CRSF Protection
  var csrf_token = $("meta[name='X-CSRF-Token']").attr("content");
  $.ajaxSetup({
    beforeSend: function(request) {
     request.setRequestHeader('X-CSRF-Token', csrf_token);
    }
  });

  navigator.idSSO.app.onnewuser = function() {
    console.log("LOL");
  };

  navigator.idSSO.app.onlogin = function( email, username, data ) {
    personaEmail = email;
    $("#logout-message").hide();
    $(".wm-user-panel" ).fadeIn();
    $(".wm-email").text( email );
    $(".wm-username").text(username);
    $("#user-avatar").css("background-image", "url(https://secure.gravatar.com/avatar/" + data.emailHash + "?s=200&d=http%3A%2F%2Fstuff.webmaker.org%2Favatars%2Fwebmaker-avatar-200x200.png)");
  };

  navigator.idSSO.app.onlogout = function() {
    $(".wm-user-panel" ).hide();
    $("#confirm-delete").hide();
  };
  $("#delete-account").click(function(e){
    e.preventDefault();
    $("#confirm-delete").fadeIn();
  });
  $("#delete-me").click(function(e){
    if ( $("#email-check").val() === personaEmail ) {
      $.post( "/account/delete", function( data ) {
        if ( !data.error ) {
          $(".wm-user-panel" ).fadeOut();
          $("#logout-message").fadeIn().text("Your user account was deleted!");
          navigator.idSSO.logout();
          setTimeout(function() {
            window.location.href = $("a")[0].href;
          }, 2000);
        }
      });
    } else {
      alert( "Looks like that isn't your email :(" );
    }
  });

});
