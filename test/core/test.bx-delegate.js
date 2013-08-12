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

  describe('delegate', function() {

    afterEach(function() {
      var children = app.bxChildren
      if(children){
        for (var i = 0; i < children.length; i++) {
          children[i].destroy()
        }
      }
    })

    it('by id', function(done) {
      app
        .prepare({
          el: '#fixture1',
          destroyAction: 'none'
        })
        .then(function(brick) {
          var firedCount = 0

          brick.delegate('#fixture1-foo', 'fooEvent', function(){
            firedCount++
          })

          brick.find('#fixture1-foo').fire('fooEvent')

          expect(firedCount).to.equal(1)
          done()
        })
    })

    it('by name', function(done) {
      app
        .prepare({
          el: '#fixture2',
          destroyAction: 'none'
        })
        .then(function(brick) {
          var firedCount = 0

          brick.delegate('thx.test/delegate-bar', 'barEvent',  function() {
            firedCount++
          })

          // both #child2 and #grandChild are instances of thx.test/delegate-bar
          brick.find('thx.test/delegate-bar').fire('barEvent')
          expect(firedCount).to.equal(1)
          done()
        })
    })

    it('complicated', function(done) {
      app
        .prepare({
          el: '#fixture3',
          destroyAction: 'none'
        })
        .then(function(brick) {
          var firedCount = 0

          brick.delegate('thx.test/delegate-foo', 'fooEvent', function(){
            firedCount++
          })
          brick.delegate('#grandChild', 'barEvent', function() {
            firedCount++
          })

          var child1 = brick.find('thx.test/delegate-foo')
          var child2 = child1.find('#grandChild')

          //child1.fire('fooEvent')
          //child2.fire('barEvent')

          // expect(firedCount).to.equal(2)

          var input21 = child1.get('el').one('#input21')

          // input21.fire('click')
          // expect(firedCount).to.equal(3)

          input21.fire('click')
          expect(firedCount).to.equal(1)
          //debugger
          //局部刷新后还拿不到他的子组件
          child1.on('ready',function(){
            //debugger
            child1.find('#grandChild').fire('barEvent')
            expect(firedCount).to.equal(2)
            done()
          })
        })
    })
  })
})