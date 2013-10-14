KISSY.add("thx.demo/brixtest2/index", function(S, Brick) {

	var BrixTest2 = Brick.extend({
		constructor: function BrixTest2() {
			//可以重新定义构成函数，如果定义，必须显示调用父类的构造函数
			BrixTest2.superclass.constructor.apply(this, arguments);
			S.log('constructor2');
		},
		initializer: function() {
			S.log('initializer2');
		},
		bind: function() {
			//和老版本的initialize作用相同
			S.log('bind 2');
		},
		sync:function(){
			this.get('el').one('#brixtest3').one('span').css('color','red');
		},
		destructor: function() {
			S.log('destructor2');
		}
	}, {
		ATTRS: {
			b: {
				value: 4
			},
			data:{
				value:{
					g:1234
				}
			}
		},
		EVENTS: {
			'#input21': {
				click: function(e) {
					this.bxRefresh = false
					this.bxData.a = 'aaaa' + S.guid()
					this.bxData.c = 'ccc' + S.guid()
					this.fire(BrixTest2.FIRES.myfire);
				}
			},
			'#input22': {
				click: function(e) {
					this.bxData.b = 'bbb' + S.guid()
				}
			},
			'#input28': {
				click: function(e) {
					var self = this;
					this.bxData.a = 'xxx'+S.guid();
				}
			}
		},
		FIRES: {
			myfire: 'myfire'
		},
		METHODS: {
			testMethod: function() {
				return 'test'
			}
		}
	}, 'BrixTest2');
	S.augment(BrixTest2, BrixTest2.METHODS);
	return BrixTest2;
}, {
	requires: ["brix/base"]
});