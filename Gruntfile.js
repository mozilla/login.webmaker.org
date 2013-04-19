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
          "app/dev/public/*.css"
        ]
      }
    },
    jshint: {
      files: [
        "Gruntfile.js",
        "app.js",
        "lib/**/*.js",
        "app/**/*.js",
        "app/http/views/js/*.ejs"
      ]
    }
  });

  grunt.loadNpmTasks( "grunt-contrib-csslint" );
  grunt.loadNpmTasks( "grunt-contrib-jshint" );

  grunt.registerTask( "default", [ "csslint", "jshint" ]);
  grunt.registerTask( "travis", [ "csslint", "jshint" ]);
};
