var app
var Brick
var Promise

var S = KISSY


describe('brix/app', function() {

  this.timeout(5000)

  // 本来可以把整个都放进 KISSY.use 的回调里面，但是这样的话，何时触发 mocha.run 又成了问题。
  //
  // 在 grunt-mocha 里，提供了自动调用 mocha.run 的方式，但不支持人肉在某个自定义的回调中调用。
  // 所以最方便的解决办法，就是把执行铺平，利用 before 支持异步风格的特性。

  before(function(done) {
    KISSY.use('brix/app,brix/base,promise', function(S, _app, _Brick, _Promise) {
      app = _app
      Brick = _Brick
      Promise = _Promise
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

      // .be and .equal are the same
      // https://github.com/LearnBoost/expect.js/#api
      expect(app.config('foo')).to.be(4338)
      expect(app.config('bar')).to.be('egg')
    })

  })

  describe('#get', function() {
    it('get configuration via getter', function() {
      expect(app.get('foo')).to.be(4338)
      expect(app.get('bar')).to.be('egg')
    })
  })

  describe('#set', function() {
    it('set configuration via setter', function() {
      app.set('egg', { type: 'chicken' })

      expect(app.get('egg')).to.eql({ type: 'chicken' })
    })
  })

  describe('#prepare', function() {

    var promise

    before(function() {
      promise = app.prepare('#fixture1')
    })

    it('returns a promise', function() {
      expect(promise).to.be.a(Promise)
    })

    it('resolved when ready', function(done) {
      promise.then(function(brick) {
        expect(brick).to.be.a(Brick)
        expect(brick.bxRendered).to.be(true)
        expect(brick.bxActivated).to.be(true)
        done()
      })
    })

    it('goes into the children of app', function(done) {
      promise.then(function(brick) {
        expect(S.indexOf(brick, app.bxChildren)).to.not.be.below(0)
        done()
      })
    })

    it('has it\'s parent point to app', function(done) {
      promise.then(function(brick) {
        expect(brick.bxParent).to.equal(app)
        done()
      })
    })

    // For more testcases on Brick, see test.base.js
  })

  // In magix apps, the app.boot might be used in some kind of misplaced way.
  // Given HTML like this:
  //
  //     <div id="dialog">
  //       <div bx-name="mux.nb/toppanel"></div>
  //     </div>
  //
  // The #dialog itself is booted by app, so it's gonna be a child of app.
  // Then the content of #dialog is booted app also. Because the content is
  // prepared by magix framework, and the latter will call something like:
  //
  //     app.boot('[bx-name="mux.nb/toppanel"]')
  //
  // Well, logically the brick mux.nb/toppanel should be children of #dialog.
  // Hence the second app.boot is a misplaced boot. The boot process shall be
  // started by the brick #dialog itself.
  //
  // But we shall support this usage because changing magix logic requires a lot
  // of work.
  describe('misplaced #prepare', function() {
    it('shall be children of app regardless of the DOM structure', function() {
      app.config('components', 'thx.test')
      app.prepare('#fixture2').then(function(brick) {
        brick.get('el').html('<div id="fixture2-vframe"></div>')
        app.prepare({
          el: '#fixture2-vframe',
          tpl: '<div bx-name="thx.test/app-foo"></div>'
        }).then(function(brick) {
          expect(brick.bxChildren.length).to.be(1)

          var children = app.bxChildren
          var ids = ['fixture1', 'fixture2', 'fixture3', 'fixture2-vframe']

          for (var i = 0; i < children.length; i++) {
            expect(ids).to.contain(children[i].bxId)
          }
        })
      })
    })
  })

  // Sometimes we need to boot nodes likes this:
  //
  //     <div id="page1" bx-name="thx.test/app-boot-async"></div>
  //
  // which has a corresponding constructor extended from Brick. In this case,
  // We shall boot this node until the KISSY module `thx.test/app-boot-async/index`
  // is ready.
  //
  //     KISSY.use('thx.test/app-boo-async/index', function(S, AsyncBrick) {
  //         app.boot('#page1')
  //     })
  //
  // brix/app solves this problem by returning an promise via app.bootAsync call.
  //
  //     app.boot('#page1').then(function(page) {
  //         // now you've got the page, which is an instance of class thx.test/app-boot-async
  //     })
  //
  describe('#boot', function() {
    var brick

    before(function(done) {
      app.config('components', 'thx.test')
      app.boot('#fixture3').then(function(b) {
        brick = b
        done()
      })
    })

    it('shall prepare the constructor of the brick before booting', function(done) {
      expect(brick.bxName).to.equal('thx.test/app-boot-async')

      brick.on('ready', function() {
        expect(this.bxId).to.equal('fixture3')
        expect(this.get('foo')).to.equal(1)
        done()
      })
    })
  })
})
