var app
var Brick

var S = KISSY


describe('brix/base', function() {

  before(function(done) {
    KISSY.use('brix/app,brix/base', function(S, _app, _Brick) {
      app = _app
      Brick = _Brick

      app.config('components', 'thx.test')

      done()
    })
  })


  // Same as app.boot
  // only the booted bricks goes to the brick that called #boot method.
  describe('#boot', function() {

    var rootBrick

    before(function(done) {
      app.boot('#fixture0').on('ready', function() {
        rootBrick = this
        done()
      })
    })

    it('same as app.boot', function() {
      expect(rootBrick).to.be.a(Brick)
      expect(rootBrick.boot('#fixture1')).to.be.a(Brick)
    })

    it('the parent of booted bricks will be different', function(done) {
      rootBrick.boot('#fixture2').on('ready', function() {
        expect(this.get('parent')).to.equal(rootBrick)
        expect(this.get('parent').get('parent')).to.equal(app)
        done()
      })
    })

    it('use brix/base if bx-naked', function() {
      expect(rootBrick.boot('#fixture3').constructor).to.equal(Brick)
    })

    it('receives arbitrary arguments too', function(done) {
      rootBrick
        .boot({
          el: '#fixture4',
          tpl: '<p>Hello {{world}}!</p>',
          data: {
            world: 'earth'
          }
        })
        .on('ready', function() {
          expect(this.get('tpl')).to.equal('<p>Hello {{world}}!</p>')
          expect(this.get('data')).to.eql({
            world: 'earth'
          })
          expect(this.get('el').html()).to.equal('<p>Hello earth!</p>')
          done()
        })
    })
  })


  describe('#bootAsync', function() {
    var rootBrick

    before(function(done) {
      app.boot('#fixture7').on('ready', function() {
        rootBrick = this
        done()
      })
    })

    it('shall boot bricks that require async module loading', function(done) {
      expect(rootBrick.get('children')).to.be.empty()
      rootBrick
        .bootAsync({
          el: '#fixture8',
          bar: true
        })
        .then(function(brick) {
          expect(brick.get('name')).to.equal('thx.test/base-boot-async')
          expect(brick.get('bar')).to.be(true)
          return brick
        })
        .then(function(brick) {
          expect(rootBrick.get('children')[0]).to.equal(brick)
          done()
        })
    })
  })


  describe('promise', function() {
    it('supports async procedures in event listeners', function() {
      var code = 0

      app
        .boot('#fixture5')
        .on('getTpl', function() {
          return S.later(function() {
            code += 1
          }, 10)
        })
        .on('getData', function() {
          return S.later(function() {
            code += 10
          }, 10)
        })
        .on('ready', function() {
          expect(code).to.equal(11)
        })
    })

    it('make sure the render and activate procedure is separated', function(done) {
      var code = 0

      app
        .boot('#fixture6')
        .on('rendered', function() {
          var foo = this.find('thx.test/promise-foo')

          // child bricks will be ready first
          foo.on('ready', function() {
            code +=1
            expect(code).to.be(1)
          })
        })
        .on('ready', function() {
          code += 10
          expect(code).to.be(11)

          done()
        })
    })
  })


  describe('#find', function() {

    var rootBrick

    before(function(done) {
      app.boot('#fixture9').on('ready', function() {
        rootBrick = this
        done()
      })
    })

    it('find by #id', function() {
      var foo = rootBrick.find('#fixture10')

      expect(foo.get('name')).to.equal('thx.test/find-foo')
    })

    it('find by family/name', function() {
      var bar = rootBrick.find('thx.test/find-bar')

      expect(bar.get('id')).to.equal('fixture11')
    })
  })

  describe('#where', function() {

    var rootBrick

    before(function(done) {
      app.boot('#fixture12').on('ready', function() {
        rootBrick = this
        done()
      })
    })

    it('where name equals family/name', function() {
      var bricks = rootBrick.where({ name: 'thx.test/where-foo' })

      expect(bricks.length).to.be(2)
    })
  })
})