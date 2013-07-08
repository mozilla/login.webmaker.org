module.exports = function( grunt ) {
  grunt.initConfig({
    pkg: grunt.file.readJSON( "package.json" ),

    recess: {
      dist: {
        options: {
          "noIDs": false,
          "noOverqualifying": false,
          "strictPropertyOrder": false
        },
        src: [
          "app/http/public/css/nav.less",
          "app/http/public/css/account.less"
        ]
      }
    },
    jshint: {
      files: [
        "Gruntfile.js",
        "app.js",
        "test/**/*.js",
        "lib/**/*.js",
        "app/dev/**/*.js",
        "app/http/*.js",
        "app/lib/*.js",
        "app/http/controllers/*.js",
        "app/http/public/js/*.js",
        "app/http/views/js/*.ejs",
        "app/models/**/*.js"
      ]
    }
  });

  grunt.loadNpmTasks( "grunt-recess" );
  grunt.loadNpmTasks( "grunt-contrib-jshint" );

  grunt.registerTask( "default", [ "recess", "jshint" ]);
  grunt.registerTask( "travis", [ "recess", "jshint" ]);
};
