require(['jquery', 'sso-ux' ],
  function ( $ ) {
    "use strict";
    var $formFrag = $("#sso_create");
    var $mailSignUp = $('#bsd');
    var $usernameInput = $("#claim-input");
    var $errorContainer = $("#error-container");
    var csrf = $("meta[name='X-CSRF-Token']").attr("content");
    var email = $("meta[name='persona-email']").attr("content");
    var AUDIENCE = $("meta[name='audience']").attr("content");

    $formFrag.submit( function(data) {
      if( $mailSignUp.is(':checked') ) {
        $.ajax({
          type: 'POST',
          url: 'https://sendto.mozilla.org/page/s/webmaker',
          data: {
            email: $usernameInput.val(),
            'custom-1216': 1
          },
          success: function(resp) {
            return true;
          },
          error: function(resp) {
            return false;
          }
        });
      }

      $.ajax({
        type: "POST",
        url: "/user",
        headers: {
          "X-CSRF-Token": csrf
        },
        dataType: "json",
        data: {
          "_id": email,
          "email": email,
          "username": $usernameInput.val()
        },
        success: function(resp) {
          window.location = "/account";
        },
        error: function(resp) {
          var error = JSON.parse(resp.responseText);
          if(error.error.code === 11000 ) {
            $errorContainer.text("Sorry, the username "+ $usernameInput.val() + " is taken!");
            $usernameInput.val("");
          }
          return false;
        }
      });
      return false;
  });
});
