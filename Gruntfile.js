module.exports = function( grunt ) {
  grunt.initConfig({
    pkg: grunt.file.readJSON( "package.json" ),

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
        "app/db/**/*.js"
      ]
    }
  });

  grunt.loadNpmTasks( "grunt-recess" );
  grunt.loadNpmTasks( "grunt-contrib-jshint" );

  grunt.registerTask( "default", [ "jshint" ]);
  grunt.registerTask( "travis", [ "jshint" ]);
};
