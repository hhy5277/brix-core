var app
var Brick

var S = KISSY


describe('brix/class', function() {

  before(function(done) {
    KISSY.use('brix/app,brix/base', function(S, _app, _Brick) {
      app = _app
      Brick = _Brick

      app.config({
        components: 'thx.test',
        base: '../'
      })

      done()
    })
  })


  describe('#class', function() {

    var rootBrick

    before(function(done) {
      app.prepare({
        el: '#fixture0',
        config: {
          fixture1: [null, {
            b: 2
          },'z']
        }
      }).then(function(brick) {
        rootBrick = brick
        done()
      })
    })

    it('class multiple arguments', function() {
      var foo = rootBrick.find('#fixture1')
      expect(foo.xx).to.equal('xx')
      expect(foo.yy.b).to.equal(2)
      expect(foo.zz).to.equal('z')
    })
    it('class one object arguments', function() {
      var foo = rootBrick.find('#fixture2')
      expect(foo.xx.x).to.equal(1)
    })

    it('class one simple arguments', function() {
      var foo = rootBrick.find('#fixture3')
      expect(foo.xx).to.equal(1)
    })
  })



})