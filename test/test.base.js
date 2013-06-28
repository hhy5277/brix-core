var app
var Brick

var S = KISSY


describe('brix/base', function() {

  before(function(done) {
    KISSY.use('brix/app,brix/base', function(S, _app, _Brick) {
      app = _app
      Brick = _Brick

      app.config('namespace', 'thx.test')

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
})