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

  // 本来可以把整个都放进 KISSY.use 的回调里面，但是这样的话，何时触发 mocha.run 又成了问题。
  //
  // 在 grunt-mocha 里，提供了自动调用 mocha.run 的方式，但不支持人肉在某个自定义的回调中调用。
  // 所以最方便的解决办法，就是把执行铺平，利用 beforeEach 也支持异步风格的特性。

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
