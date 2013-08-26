var app
var Brick

var S = KISSY



describe('brix/base', function() {

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

  describe('#bxGetTemplate', function() {
    it('from parameter', function(done) {
      app
        .prepare({
          el: '#fixture1',
          tpl: '<div class="foo"></div>'
        })
        .then(function(brick) {
          expect(brick.get('tpl')).to.equal('<div class="foo"></div>')
          done()
        })
    })

    it('from script tag', function(done) {
      app.prepare('#fixture2').then(function(brick) {
        expect(S.Node(brick.get('tpl')).hasClass('foo-tpl')).to.equal(true)
        done()
      })
    })

    if (/^http/.test(location.href)) {
      it('from xhr', function(done) {
        app.prepare('#fixture3').then(function(brick) {
          expect(brick.get('tpl')).to.equal('<div class="egg"></div>')
          done()
        })
      })
    }

    it('from module', function(done) {
      KISSY.config('packages')['thx.test'].debug =  false

      app
        .prepare('#fixture4')
        .then(function(brick) {
          expect(brick.get('tpl')).to.equal('<div class="ham"></div>')
          done()
        })
    })
  })
})