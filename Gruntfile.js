module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jshint: {
      Gruntfile: {
        src: ['Gruntfile.js'],
        options: grunt.file.readJSON('.jshintrc')
      },
      src: {
        src: [
          'src/**/*.js'
        ],
        options: grunt.file.readJSON('src/.jshintrc')
      },
      test: {
        src: [
          'test/**/*.js',
          '!test/mocha.js',
          '!test/expect.js'
        ],
        options: grunt.file.readJSON('test/.jshintrc')
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
        dest: 'build/brix-<%= pkg.version %>.js'
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

  grunt.registerTask('test', ['jshint', 'connect', 'qunit']);
  grunt.registerTask('build', ['jshint', 'concat']);
};