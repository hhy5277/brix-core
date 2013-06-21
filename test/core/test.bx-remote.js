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

  describe('#bxGetData', function() {

    it('via jsonp', function(done) {
      app.boot('#fixture1').on('ready', function() {
        expect(this.get('data').columns).to.eql(['ds_title', 'ds_clickurl', 'ds_hot'])
        done()
      })
    })

    if (/^http/.test(location.href)) {
      it('via xhr in debug mode', function(done) {
        app.boot('#fixture2').on('ready', function() {
          expect(this.get('data').books.length).to.equal(3)
          done()
        })
      })
    }

    it('via kissy module in prod', function(done) {
      app.config('debug', false)
      app.boot('#fixture3').on('ready', function() {
        expect(this.get('data').players).to.eql(['Kobe Bryant', 'Tracy McGrady'])
        done()
      })
    })
  
  })
})