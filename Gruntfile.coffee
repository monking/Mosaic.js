module.exports = (grunt) ->

  require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks)

  pkg = grunt.file.readJSON 'package.json'

  grunt.initConfig
    pkg: pkg

    coffee:
      compile:
        files:
          'mosaic.js': 'mosaic.coffee'

    uglify:
      min:
        files:
          'mosaic.min.js': 'mosaic.js'

  grunt.registerTask 'default', ['coffee', 'uglify']
