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

    it('delegate id', function(done) {
      var brick = app.boot({el:'#fixture1', destroyAction: 'none'}).on('ready', function() {
        var firedCount = 0

        this.delegate('#brix2_1','myfire',function(){
          firedCount++
        })
        this.delegate('#brix3_1','myfire',function(){
          firedCount++
        })
        this.delegate('#brix3_2','myfire',function(){
          firedCount++
        })

        var brix2_1 = this.find('#brix2_1')
        var brix3_2 = this.find('#brix3_2')
        
        brix2_1.fire('myfire')
        brix3_2.fire('myfire')
        
        expect(firedCount).to.equal(2)

        brix2_1.get('el').one('#input21').fire('click');
        //debugger
        expect(firedCount).to.equal(3)

        brix3_2.get('el').one('.input31').fire('click')
        expect(firedCount).to.equal(4)

        //局部刷新后还拿不到他的子组件
        brix2_1.on('rendered',function(){
          var brix3_1 = brix2_1.find('#brix3_1')
          brix3_1.fire('myfire')
          expect(firedCount).to.equal(5)
          brick.destroy();
          done()
        })
      })
    })


    it('delegate name', function(done) {
      var brick = app.boot('#fixture1').on('ready', function() {
        var firedCount = 0

        this.delegate('thx.test/brixtest2/','myfire',function(){
          firedCount++
        })
        this.delegate('thx.test/brixtest3/','myfire',function(){
          firedCount++
        })

        var brix2_1 = this.find('#brix2_1')
        var brix3_2 = this.find('#brix3_2')

        brix2_1.fire('myfire')
        brix3_2.fire('myfire')

        expect(firedCount).to.equal(2)

        brix2_1.get('el').one('#input21').fire('click');
        //debugger
        expect(firedCount).to.equal(3)

        brix3_2.get('el').one('.input31').fire('click')
        expect(firedCount).to.equal(4)

        //局部刷新后还拿不到他的子组件
        brix2_1.on('rendered',function(){
          var brix3_1 = brix2_1.find('#brix3_1')
          
          brix3_1.fire('myfire')
          expect(firedCount).to.equal(5)
          brick.destroy();
          done()
        })
      })
    })
  
  })
})