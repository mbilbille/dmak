///*global module:false*/
module.exports = function(grunt) {

  'use strict';

  grunt.initConfig({

    concat : {
      dist : {
        src : [
        'js/dmak.min.js',
        'js/jquery.dmak.min.js',
        'js/raphael-min.js',
        'js/website.dmak.js'
        ],
        dest : 'js/script.js'
      }
    },

    uglify : {
      options : {
        report: 'gzip'
      },
      dist : {
        src: 'js/script.js',
        dest: 'js/script.min.js'
      }
    },

    cssmin: {
      minify: {
        expand: true,
        cwd : 'css/',
        src: ['style.css'],
        dest: 'css/',
        ext: '.min.css'
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-cssmin');

  grunt.registerTask('default', ['concat', 'uglify', 'cssmin']);
};