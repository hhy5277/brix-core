var app
var Brick
var S = KISSY


describe('brix/base', function() {

  this.timeout(5000)

  before(function(done) {
    KISSY.use('brix/app,brix/base', function(S, _app, _Brick) {
      app = _app
      Brick = _Brick

      done()
    })
  })

  describe('#bxGetData', function() {

    it('via jsonp', function(done) {
      app.prepare('#fixture1').then(function(brick) {
        expect(brick.get('data').columns).to.eql(['ds_title', 'ds_clickurl', 'ds_hot'])
        done()
      })
    })

    if (/^http/.test(location.href)) {
      it('via xhr in debug mode', function(done) {
        app.prepare('#fixture2').then(function(brick) {
          expect(brick.get('data').books.length).to.equal(3)
          done()
        })
      })
    }

    it('via kissy module in prod', function(done) {
      KISSY.config('packages')['thx.test'].debug = false
      app.prepare('#fixture3').then(function(brick) {
        expect(brick.get('data').players).to.eql(['Kobe Bryant', 'Tracy McGrady'])
        done()
      })
    })

  })
})