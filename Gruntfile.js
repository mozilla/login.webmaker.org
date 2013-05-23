module.exports = function( grunt ) {
  grunt.initConfig({
    pkg: grunt.file.readJSON( "package.json" ),

    recess: {
      dist: {
        options: {
          "noOverQualifying": false,
          "noIDs": false,
          "noOverqualifying": false,
          "strictPropertyOrder": false
        },
        src: [
          "app/http/public/css/*.less"
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

  grunt.loadNpmTasks( "grunt-recess" );
  grunt.loadNpmTasks( "grunt-contrib-jshint" );

  grunt.registerTask( "default", [ "recess", "jshint" ]);
  grunt.registerTask( "travis", [ "recess", "jshint" ]);
};
