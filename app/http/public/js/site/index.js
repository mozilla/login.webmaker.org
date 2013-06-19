define(['jquery', 'sso-ux'],
  function($) {
  "use strict";
  navigator.idSSO.app.onlogin = function(user) {
    window.location = "/account";
  };
});
