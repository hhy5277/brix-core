var app
var Brick
var S = KISSY


describe('brix/base', function() {

  before(function(done) {
    KISSY.use('brix/app,brix/base', function(S, _app, _Brick) {
      app = _app
      Brick = _Brick

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

  })
})