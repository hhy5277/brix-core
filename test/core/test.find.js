var app
var Brick
var Promise

var S = KISSY


describe('brix/base', function() {

  before(function(done) {
    KISSY.use('brix/app,brix/base,promise', function(S, _app, _Brick, _Promise) {
      app = _app
      Brick = _Brick
      Promise = _Promise

      app.config('components', 'thx.test')

      done()
    })
  })


  describe('#find', function() {

    var rootBrick

    before(function(done) {
      app.prepare('#fixture0').then(function(brick) {
        rootBrick = brick
        done()
      })
    })

    it('find by #id', function() {
      var foo = rootBrick.find('#fixture1')

      expect(foo.bxName).to.equal('thx.test/find-foo')
    })

    it('find by family/name', function() {
      var bar = rootBrick.find('thx.test/find-bar')

      expect(bar.bxId).to.equal('fixture2')
    })
  })

  describe('#where', function() {

    var rootBrick

    before(function(done) {
      app.prepare('#fixture3').then(function(brick) {
        rootBrick = brick
        done()
      })
    })

    it('where name equals family/name', function() {
      var bricks = rootBrick.where('thx.test/where-foo')

      expect(bricks.length).to.be(2)
    })
  })

  describe('#one', function() {

    var rootBrick

    before(function(done) {
      app.prepare('#fixture6').then(function(brick) {
        rootBrick = brick
        done()
      })
    })

    it('one by name', function() {
      var brick = rootBrick.one('thx.test/one-foo')

      expect(brick.bxId).to.equal('fixture8')
    })
    it('one by #id', function() {
      var brick = rootBrick.one('#fixture9')

      expect(brick.bxName).to.equal('thx.test/one-foo')
    })
  })


  describe('#all', function() {

    var rootBrick

    before(function(done) {
      app.prepare('#fixture10').then(function(brick) {
        rootBrick = brick
        done()
      })
    })

    it('all by name', function() {
      var bricks = rootBrick.all('thx.test/all-foo')

      expect(bricks.length).to.be(2)
    })
  })

})