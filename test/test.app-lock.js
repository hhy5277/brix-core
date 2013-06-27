var app
var Brick

describe('brix/app locked', function() {

  before(function(done) {
    KISSY.use('brix/app,brix/base', function(S, _app, _Brick) {
      app = _app
      Brick = _Brick
      done()
    })
  })

  describe('config components', function() {

    before(function() {
      app.config('namespace', 'thx.prod')
    })

    it('can be locked using components versions.', function(done) {
      app.config('components', {
        foo: '0.1.0',
        bar: '0.2.0'
      })

      app.boot().on('ready', function() {
        var foo = this.find('thx.prod/foo')
        var bar = this.find('thx.prod/bar')

        expect(foo.get('name')).to.equal('thx.prod/foo')
        expect(bar.get('name')).to.equal('thx.prod/bar')
        done()
      })
    })

    it('can specify components with or without css.', function() {
      app.config('components', {
        foo: '0.1.0/js',
        bar: '0.2.0'
      })

      app.bootStyle(function() {
        app.boot()
      })
    })
  })
})