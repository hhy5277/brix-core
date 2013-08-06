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

  describe('watcher', function() {

    it('subTpls', function(done) {
      app
        .prepare({
          el: '#fixture1',
          tpl:'<input type="button" class="input31 btn btn-red btn-size25" value="刷新文字"><input id="q" type="text"><span id="show"  bx-datakey="text">{{text}}</span><input type="text" bx-datakey="text" value="{{text}}"/><img id="img" bx-datakey="src" src="{{{src}}}">'
        })
        .then(function(brick) {
          expect(brick.get('subTpls').length).to.equal(3)
          done()
        })
    })

  })
})