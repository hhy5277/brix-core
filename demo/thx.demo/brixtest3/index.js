KISSY.add("thx.demo/brixtest3/index", function(S, Brick) {

	var BrixTest3 = Brick.extend({
		constructor: function BrixTest3() {
			//可以重新定义构成函数，如果定义，必须显示调用父类的构造函数
			BrixTest3.superclass.constructor.apply(this, arguments);
			S.log('constructor3');
		},
		initializer: function() {
			S.log('initializer3');
		},
		bind: function() {
			//和老版本的initialize作用相同
			S.log('bind 3');
			var self = this
			this.dirtyCheck(this.myFn,'myFn');
			var q = self.get('el').one('#q');
			if(q){
				q.on('valuechange',function(e){
				var data = self.get('data')
				data.text = e.currentTarget.value
				self.digest()
			})
			}
				



		},

		myFn :function(name){
			var data = this.get('data')
			data.text = name
		},
		destructor: function() {
			S.log('destructor3');
		}
	}, {
		ATTRS: {
			b: {
				value: 4
			},
			data:{
				value:{
					text:'我是test3'
				}
			}
		},
		EVENTS: {
			'.input31': {
				click: function(e) {
					var self = this;
					var data = self.get('data')
					data.text = '我改变了'+S.guid()
					// self.setChunkData({
					// 	text:'我改变了'+S.guid()
					// });
					self.fire(BrixTest3.FIRES.myfire,{fireName:'myfire3'});
				}
			}
		},
		FIRES:{
			myfire:'myfire'
		},
		METHODS: {
			testMethod: function() {
				return 'test';
			}
		}
	}, 'BrixTest3');
	S.augment(BrixTest3, BrixTest3.METHODS);
	return BrixTest3;
}, {
	requires: ["brix/base"]
});