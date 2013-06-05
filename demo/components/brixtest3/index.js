KISSY.add("components/brixtest3/index", function(S, Brick) {
	var module = this;
	var BrixTest3 = Brick.extend({
		constructor: function BrixTest() {
			//可以重新定义构成函数，如果定义，必须显示调用父类的构造函数
			BrixTest.superclass.constructor.apply(this, arguments);
			S.log('constructor3');
		},
		initializer: function() {
			S.log('initializer3');
		},
		bindUI: function() {
			//和老版本的initialize作用相同
			S.log('bindUI3');
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
			},
			listeners: {
				value: {
					getTemplate: function(e) {
						Brick.getTemplate(module,'index.html',e);
						return true;
					}
				}
			}
		},
		EVENTS: {
			'.input31': {
				click: function(e) {
					var self = this;
					self.setChunkData({
						text:'我改变了'+S.guid()
					});
				}
			}
		},
		DOCEVENTS:{
			'':{
				click:function(){
					S.log('点击了document');
				}
			}
		},
		WINEVENTS:{
			scroll:function(){
				S.log('scroll_'+S.guid());
			},
			resize:function(){
				S.log('resize_'+S.guid());
			}
		},
		FIRES:{
			myfire:'myfire'
		},
		METHODS: {
			testMethod: function() {
				return 'test'
			}
		}
	}, 'BrixTest3');
	S.augment(BrixTest3, BrixTest3.METHODS);
	return BrixTest3;
}, {
	requires: ["brix/core/brick"]
});