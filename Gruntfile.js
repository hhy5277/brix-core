module.exports = function(grunt) {

  var PORT = 5050

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
        footer: ';\n',
        process: function(src, fpath) {
          // remove the placeholder object
          if ('src/interface/index.js' === fpath) return

          // rename corresponding interface module
          if (fpath.indexOf('src/interface/if') === 0) {
            src = src.replace(/brix\/interface\/[-\w]+/, 'brix/interface/index')
          }

          return src
        }
      },
      main: {
        src: ['src/**/*.js', '!src/interface/if-yicai.js'],
        dest: 'build/<%= pkg.version %>/brix.js'
      },
      alt: {
        src: ['src/**/*.js', '!src/interface/if-zuomo.js'],
        dest: 'build/<%= pkg.version %>/brix-alt.js'
      }
    },
    uglify: {
      dist: {
        files: [
          { src: ['build/<%= pkg.version %>/brix.js'], dest: 'build/<%= pkg.version %>/brix-min.js' },
          { src: ['build/<%= pkg.version %>/brix-alt.js'], dest: 'build/<%= pkg.version %>/brix-alt-min.js' }
        ]
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
  grunt.loadNpmTasks('grunt-contrib-uglify')
  grunt.loadNpmTasks('grunt-mocha')

  grunt.registerTask('test', ['jshint', 'connect', 'mocha'])
  grunt.registerTask('build', ['jshint', 'concat', 'uglify'])
}
