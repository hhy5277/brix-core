var app
var Brick

var S = KISSY


describe('brix/class', function() {

  before(function(done) {
    KISSY.use('brix/app,brix/base', function(S, _app, _Brick) {
      app = _app
      Brick = _Brick

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
    it('class all load', function() {
      expect(rootBrick.bxChildren.length).to.equal(7)
    })
    it('class multiple arguments', function() {
      var foo = rootBrick.find('#fixture1')
      expect(foo.xx).to.equal('xx')
      expect(foo.yy.b).to.equal(2)
      expect(foo.zz).to.equal('z')
      expect(foo.bxChildren.length).to.equal(1)
    })
    it('class one object arguments', function() {
      var foo = rootBrick.find('#fixture2')
      expect(foo.xx.x).to.equal(1)
    })

    it('class one simple arguments', function() {
      var foo = rootBrick.find('#fixture3')
      expect(foo.xx).to.equal(1)
    })

    it('class is num', function() {
      var foo = rootBrick.find('#fixture4')
      expect(foo.bxKlass).to.equal(123)
      expect(foo.bxChildren.length).to.equal(1)
    })

    it('class is nil', function() {
      var foo = rootBrick.find('#fixture5')
      expect(foo.bxKlass).to.equal(undefined)
      expect(foo.bxChildren.length).to.equal(2)
    })

    it('class is obj', function() {
      var foo = rootBrick.find('#fixture6')
      expect(foo.xxx).to.equal(1)
      expect(foo.bxChildren.length).to.equal(1)
    })
  })



})