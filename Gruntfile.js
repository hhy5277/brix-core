module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jshint: {
      all: [
        'Gruntfile.js',
        'src/**/*.js',
        'test/**/*.js',
        '!test/mocha.js',
        '!test/expect.js'
      ],
      options: {
        jshintrc: '.jshintrc'
      }
    },
    concat: {
      options: {
        separator: ';\n',
        banner: [
          '/**',
          ' * <%= pkg.description %> v<%= pkg.version %>',
          ' * ',
          ' * http://github.com/thx/brix-core',
          ' */',
          '' // for the extra line break
        ].join('\n'),
        footer: ';\n'
      },
      dist: {
        src: ['src/**/*.js'],
        dest: 'build/brix.js'
      }
    },
    connect: {
      server: {
        options: {
          port: 5000,
          base: '.',
          hostname: '*'
        }
      }
    },
    mocha: {
      all: {
        src: ['test/**/test.*.html'],
        options: {
          // 是否捕捉浏览器中的 console.log 并输送至 Node.js 的 console
          // log: true,
          run: true
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-mocha');

  grunt.registerTask('test', ['jshint', 'mocha']);
  grunt.registerTask('build', ['jshint', 'concat']);
};