var app
var Brick

describe('brix/app locked', function() {

  this.timeout(5000)

  before(function(done) {
    KISSY.use('brix/app,brix/base', function(S, _app, _Brick) {
      app = _app
      Brick = _Brick
      done()
    })
  })

  describe('config components', function() {

    it('can be locked using components versions.', function(done) {
      app.config('components', {
        'thx.prod': {
          foo: '0.1.0',
          bar: '0.2.0'
        }
      })

      app.prepare().then(function(brick) {
        var foo = brick.find('thx.prod/foo')
        var bar = brick.find('thx.prod/bar')

        expect(foo.bxName).to.equal('thx.prod/foo')
        expect(bar.bxName).to.equal('thx.prod/bar')
        done()
      })
    })

    it('can specify components with or without css.', function(done) {
      app.config('components', {
        'thx.prod': {
          foo: '0.1.0/js',
          bar: '0.2.0'
        }
      })

      app.bootStyle(function() {
        app.boot().then(function() {
          expect(true).to.be(true)
          done()
        })
      })
    })
  })
})