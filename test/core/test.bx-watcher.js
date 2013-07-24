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

    it('watcher selector function dirtyCheck', function(done) {
      app
        .boot({
          el: '#fixture1'
        })
        .on('ready', function() {
          var self = this
          var child = self.find('#fixture1-foo')
          var showEl = child.get('el').one('#show')

          //selector
          child.get('el').one('.input31').fire('click')
          expect(showEl.html()).to.equal('我改变了')

          //function
          var q = self.get('el').one('#q')
          q.val('logo')
          q.fire('valuechange')
          expect(showEl.html()).to.equal('logo')

          //dirtyCheck
          child.dirtyCheck("dirtyCheckFoo",'my','test')
          expect(showEl.html()).to.equal('my_test')

          done()
        })
    })

  })
})