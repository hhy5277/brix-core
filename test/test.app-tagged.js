var app

describe('brix/app tagged', function() {


  before(function(done) {
    KISSY.use('brix/app', function(S, _app, _Brick) {
      app = _app
      done()
    })
  })

  describe('config timestamp', function() {

    it('can be tagged with timestamp', function(done) {
      app.config({
        components: 'thx.tagged',
        timestamp: '20130627'
      })
      app.boot().on('ready', function() {
        var foo = this.find('thx.tagged/foo')

        expect(foo.get('name')).to.equal('thx.tagged/foo')
        done()
      })
    })
  })
})