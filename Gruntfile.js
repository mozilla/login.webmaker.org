module.exports = function( grunt ) {
  grunt.initConfig({
    pkg: grunt.file.readJSON( "package.json" ),

    csslint: {
      lax: {
        options: {
          "box-sizing": false,
          "ids": false,
          "important": false,
          "overqualified-elements": false,
          "qualified-headings": false,
          "unique-headings": false
        },
        src: [
          "app/http/public/css/*.css"
        ]
      }
    },
    jshint: {
      files: [
        "Gruntfile.js",
        "app.js",
        "lib/**/*.js",
        "app/dev/**/*.js",
        "app/http/controllers/*.js",
        "app/http/public/js/*.js",
        "app/http/views/js/*.ejs"
      ]
    }
  });

  grunt.loadNpmTasks( "grunt-contrib-csslint" );
  grunt.loadNpmTasks( "grunt-contrib-jshint" );

  grunt.registerTask( "default", [ "csslint", "jshint" ]);
  grunt.registerTask( "travis", [ "csslint", "jshint" ]);
};
