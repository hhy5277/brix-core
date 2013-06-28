var app
var Brick

var S = KISSY


describe('brix/app', function() {

  // 本来可以把整个都放进 KISSY.use 的回调里面，但是这样的话，何时触发 mocha.run 又成了问题。
  //
  // 在 grunt-mocha 里，提供了自动调用 mocha.run 的方式，但不支持人肉在某个自定义的回调中调用。
  // 所以最方便的解决办法，就是把执行铺平，利用 before 支持异步风格的特性。

  before(function(done) {
    KISSY.use('brix/app,brix/base', function(S, _app, _Brick) {
      app = _app
      Brick = _Brick
      done()
    })
  })

  describe('#config', function() {

    it('return itself', function() {
      expect(app.config({ foo: 1 })).to.equal(app)
      expect(app.config()).to.equal(app)
    })

    it('get configuration', function() {
      expect(app.config('foo')).to.equal(1)
    })

    it('set configuration', function() {
      expect(app.config('bar', 'ham').config('bar')).to.equal('ham')
    })

    it('set configuration in batch', function() {
      app.config({ foo: 4338, bar: 'egg' })

      expect(app.config('foo')).to.equal(4338)
      expect(app.config('bar')).to.equal('egg')
    })

  })

  describe('#boot', function() {

    var brick

    before(function() {
      brick = app.boot()
    })

    it('return a new brick', function() {
      expect(brick).to.be.a(Brick)
    })

    it('use [bx-app] as default el', function() {
      expect(brick.get('el').hasAttr('bx-app')).to.be(true)
    })
    
    it('fires ready when... ready', function(done) {
      brick.on('ready', function() {
        expect(this).to.be.a(Brick)
        expect(this.get('rendered')).to.be(true)
        expect(this.get('activated')).to.be(true)
        done()
      })
    })
    
    it('goes into the children of app', function() {
      expect(S.indexOf(brick, app.get('children'))).to.not.be.below(0)
    })

    it('has it\'s parent point to app', function() {
      expect(brick.get('parent')).to.equal(app)
    })

    // For more testcases on Brick, see test.base.js
  })
})
