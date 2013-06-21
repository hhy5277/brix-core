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
        .boot({
          el: '#fixture1',
          tpl: '<div class="foo"></div>'
        })
        .on('ready', function() {
          expect(this.get('tpl')).to.equal('<div class="foo"></div>')
          done()
        })
    })

    it('from script tag', function(done) {
      app.boot('#fixture2').on('ready', function() {
        expect(S.Node(this.get('tpl')).hasClass('foo-tpl')).to.equal(true)
        done()
      })
    })

    if (/^http/.test(location.href)) {
      it('from xhr', function(done) {
        app.boot('#fixture3').on('ready', function() {
          expect(this.get('tpl')).to.equal('<div class="egg"></div>')
          done()
        })
      })
    }

    it('from module', function(done) {
      app
        .config('debug', false)
        .boot('#fixture4')
        .on('ready', function() {
          expect(this.get('tpl')).to.equal('<div class="ham"></div>')
          done()
        })
    })
  })
})