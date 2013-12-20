(function() {
  // Cache config
  var loginUri = "{{ hostname }}";

  // Cache jQuery references
  var jQuery = {
        id: $( "#id" ),
        email: $( "#email" ),
        username: $( "#username" ),
        fullname: $( "#fullname" ),
        isAdmin: $( "#isAdmin" ),
        isCollaborator: $( "#isCollaborator" ),
        isSuspended: $( "#isSuspended" ),
        sendNotifications: $( "#sendNotifications" ),
        sendEngagements: $( "#sendEngagements" ),
        sendEventCreationEmails: $( "#sendEventCreationEmails" ),
        newUser: $( "#newUser" ),
        submit: $( "#submit" ),
        clear: $( "#clear" ),
        error: $( "#error" ),
        findByUserInput: $( "#find-user-input" ),
        findUserBtn: $( "#find-by-user" ),
        findByEmailInput: $( "#find-email-input" ),
        findEmailBtn: $( "#find-by-email" ),
        del: $( "#delete" )
      };

  /**
   * Ajax helper
   * Expects: {
   *   uri: loginAPI endpoing,
   *   method: GET/POST/PUT/DELETE,
   *   data: {},
   *   error: function ( xhr, status, error )
   *   success: function ( data, status, xhr )
   * }
   **/
  var ajaxHelper = function ( options ){
    var defaults = {
      success: function( data, status, xhr ) {
        console.log( "Safestate: Success, data is ", data );
      },
      error: function( xhr, status, error ) {
        console.log( "Safestate: Error is ", error );
      }
    };

    // Parse arguments
    options = options || {};
    if ( !options.uri ) {
      jQuery.error.html( "No URL passed to ajaxHelper" );
      return;
    }
    options.method = options.method || "get";
    options.data = options.data || {};
    options.success = options.success || defaults.success;
    options.error = options.error || defaults.error;


   $.ajax({
      url: options.uri,
      method: options.method,
      data: JSON.stringify( options.data ),
      error: options.error,
      success: options.success,
      contentType: "application/json"
    });
  }; // END AJAX-HELPER

  /**
   * DOM Manipulation helper
   **/
  var domHelper = {
    clearForm: function() {
      jQuery.id.prop( "value", "" );
      jQuery.email.prop( "value", "" );
      jQuery.username.prop( "value", "" );
      jQuery.fullname.prop( "value", "" );
      jQuery.isAdmin.prop( "checked", "" );
      jQuery.isCollaborator.prop( "checked", "" );
      jQuery.isSuspended.prop( "checked", "" );
      jQuery.sendNotifications.prop( "checked", "" );
      jQuery.sendEngagements.prop( "checked", "" );
      jQuery.sendEventCreationEmails.prop( "checked", "" );
      jQuery.newUser.prop( "value", "true" );
      jQuery.error.html( "" );

      // Reset validation
      valid = false;
    },
    deleteUser: function ( email ) {
      // Ask for confirmation
      var goForIt = confirm( "Really delete " + email + "?" );

      if ( goForIt ) {
        ajaxHelper({
          uri: loginUri + "/user/" + email,
          method: "delete",
          error: function( xhr, status, error ) {
            var resp = JSON.parse( xhr.responseText );
            jQuery.error.html( "Error: " + resp.error );
          },
          success: function( data, status, xhr ) {
            domHelper.clearForm();
          }
        });
      } // END-IF
    },
    saveUser: function() {
      // Collect data
      var userData = {};

      userData.email = jQuery.email.prop( "value" );
      userData.username = jQuery.username.prop( "value" );
      userData.fullName = jQuery.fullname.prop( "value" );

      userData.isAdmin = jQuery.isAdmin.prop( "checked" ) === false ? false : true;
      userData.isCollaborator = jQuery.isCollaborator.prop( "checked" ) === false ? false : true;
      userData.isSuspended = jQuery.isSuspended.prop( "checked" ) === false ? false : true;
      userData.sendNotifications = jQuery.sendNotifications.prop( "checked" ) === false ? false : true;
      userData.sendEngagements = jQuery.sendEngagements.prop( "checked" ) === false ? false : true;
      userData.sendEventCreationEmails = jQuery.sendEventCreationEmails.prop( "checked" ) === false ? false : true;

      // New user or old?
      var method = jQuery.newUser.attr( "value" ) === "false" ? "put" : "post",
          url = loginUri + ( jQuery.newUser.attr( "value" ) === "false" ? "/user/" + userData.email : "/user" );

      // Ajax call
      ajaxHelper({
        uri: url,
        method: method,
        data: userData,
        error: function ( xhr, status, error ) {
          var resp = JSON.parse( xhr.responseText );
          if ( resp.error.name === "ValidationError" ) {
            resp.error = resp.error.message + " for " + Object.keys( resp.error.errors ).join( " and " );
          }

          jQuery.error.html( "Error: " + resp.error );
        },
        success: function( xhr, status, error ) {
          jQuery.error.html( "" );
          alert( "Save Successful." );
        }
      });
    },
    editUser: function( query, findType ) {
      //clear everything
      domHelper.clearForm();

      // Collect user data
      ajaxHelper({
        uri: loginUri + "/user/" + findType + "/" + query,
        method: "get",
        error: function( xhr, status, error ) {
          var resp = JSON.parse( xhr.responseText );
          jQuery.error.html( "Error: " + resp.error );
        },
        success: function( data, status, xhr ) {
        // Populate form with data
          var user = data.user;

          // Text boxes
          jQuery.id.prop( "value", user.id );
          jQuery.email.prop( "value", user.email );
          jQuery.username.prop( "value", user.username );
          jQuery.fullname.prop( "value", user.fullName );

          // Checkboxes
          jQuery.isAdmin.prop( "checked", user.isAdmin === true ? true : false );
          jQuery.isCollaborator.prop( "checked", user.isCollaborator === true ? true : false );
          jQuery.isSuspended.prop( "checked", user.isSuspended === true ? true : false );
          jQuery.sendNotifications.prop( "checked", user.sendNotifications === true ? true : false );
          jQuery.sendEngagements.prop( "checked", user.sendEngagements === true ? true : false );
          jQuery.sendEventCreationEmails.prop( "checked", user.sendEventCreationEmails === true ? true : false );

          // Hidden field
          jQuery.newUser.prop( "value", "false" );
        }
      });
    }
  };

  /**
   * General event bindings
   **/
  jQuery.submit.on( "click", function() {
    domHelper.saveUser();
  });
  jQuery.del.on( "click", function() {
    if ( jQuery.id.val() ) {
      domHelper.deleteUser( jQuery.email.val() );
    }
  });
  jQuery.clear.on( "click", function() {
    domHelper.clearForm();
  });
  jQuery.findUserBtn.on( "click", function() {
    domHelper.editUser( jQuery.findByUserInput.val(), "username" );
  });
  jQuery.findByUserInput.on( "keypress", function( e ) {
    if ( e.which === 13 ) {
      e.preventDefault();
      e.stopPropagation();
      domHelper.editUser( jQuery.findByUserInput.val(), "username" );
    }
  });
  jQuery.findEmailBtn.on( "click", function() {
    domHelper.editUser( jQuery.findByEmailInput.val(), "email" );
  });
  jQuery.findByEmailInput.on( "keypress", function( e ) {
    if ( e.which === 13 ) {
      e.preventDefault();
      e.stopPropagation();
      domHelper.editUser( jQuery.findByEmailInput.val(), "email" );
    }
  });
})();

