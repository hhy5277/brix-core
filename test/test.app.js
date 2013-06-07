KISSY.config({
  packages: {
    brix: {
      ignorePackageNameInUri: true,
      base: '../src'
    }
  }
})


var app

describe('brix/app', function() {
  beforeEach(function(done) {
    KISSY.use('brix/app', function(S, _app) {
      app = _app
      done()
    })
  })

  describe('#config', function() {

    it('return itself', function() {
      expect(app.config({ foo: 1 })).equal(app)
      expect(app.config()).equal(app)
    })

    it('get configuration', function() {
      expect(app.config('foo')).equal(1)
    })

    it('set configuration', function() {
      expect(app.config('bar', 'ham').config('bar')).equal('ham')
    })

    it('set configuration in batch', function() {
      app.config({ foo: 4338, bar: 'egg' })

      expect(app.config('foo')).equal(4338)
      expect(app.config('bar')).equal('egg')
    })

  })
})
