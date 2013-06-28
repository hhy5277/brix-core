module.exports = function(grunt) {

  var PORT = 5000

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
        jshintrc: '.jshintrc',
        jshintignore: '.jshintignore'
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
          port: PORT,
          base: '.',
          hostname: '*'
        }
      }
    },
    mocha: {
      all: {
        options: {
          urls: grunt.file.expand('test/**/test.*.html').map(function(file) {
            return 'http://127.0.0.1:' + PORT + '/' + file
          }),
          // 是否捕捉浏览器中的 console.log 并输送至 Node.js 的 console
          // log: true,
          run: true
        }
      }
    }
  })

  grunt.loadNpmTasks('grunt-contrib-connect')
  grunt.loadNpmTasks('grunt-contrib-jshint')
  grunt.loadNpmTasks('grunt-contrib-concat')
  grunt.loadNpmTasks('grunt-mocha')

  // grunt jshint does not work in Windows XP
  // https://github.com/gruntjs/grunt-contrib-jshint/issues/73
  //
  // To run grunt test successfully, just remove the jshint part.
  grunt.registerTask('test', ['jshint', 'connect', 'mocha'])
  grunt.registerTask('build', ['jshint', 'concat'])
}