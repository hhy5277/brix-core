KISSY.add("thx.demo/brixtest/index", function(S, Brick) {
	var BrixTest = Brick.extend({
		constructor: function BrixTest() {
			//可以重新定义构成函数，如果定义，必须显示调用父类的构造函数
			BrixTest.superclass.constructor.apply(this, arguments);
			S.log('constructor');
		},
		initializer: function() {
			S.log('initializer');
		},
		bind: function() {
			//和老版本的initialize作用相同
			S.log('bind');
		},
		destructor: function() {
			S.log('destructor');
		}
	}, {
		ATTRS: {
			b: {
				value: 4
			}
		},
		EVENTS: {
			'#input1': {
				click: function(e) {
					var self = this;
					self.setChunkData({
						a: 'aaaa' + S.guid(),
						c: 'ccc' + S.guid()
					});
					self.fire(BrixTest.FIRES.myfire);
					return false
				}
			},
			'#input2': {
				click: function(e) {
					var self = this;

					self.setChunkData('b', 'bbb' + S.guid(), {
						renderType: 'prepend'
					});
					return false
				}
			},
			'#input3': {
				click: function(e) {
					var self = this;
					self.setChunkData('c', 'ccc' + S.guid(), {
						renderType: 'append'
					});
					return false
				}
			},
			'#input4': {
				click: function(e) {
					var self = this;
					self.setChunkData('d', [{
						d1: S.guid()
					}, {
						d1: S.guid()
					}, {
						d1: S.guid()
					}]);
				}
			},
			'#input5': {
				click: function(e) {
					var self = this;
					self.setChunkData('e', Math.random()>0.5?true:false);
				}
			},
			'#input6': {
				click: function(e) {
					debugger
					//this.get('parent').destroyBrick(this.get('el').attr('id'));
					this.destroy();
				}
			},
			'#input7': {
				click: function(e) {
					var self = this;
					//这个有问题啊。bx-tmpl应该唯一键值。可以考虑加上组件名称前缀
					self.setChunkData('startDay', 'startDay' + S.guid());
				}
			},
			'#input8':{
				valuechange:function(e){
					S.log(e.currentTarget.value);
				},
				focusin:function(e){
					S.log(e.currentTarget.value);
				}
			},
			'img': {
				load: function(e){
					S.log('图片加载了');
				}
			},
			'document': {
				click: function() {
					S.log('点击了document');
					return false
				}
			},
			'window': {
				scroll: function() {
					 S.log(S.guid('scroll-'));
					 return false
				},
				resize: function() {
					 S.log(S.guid('resize-'));
					 return false
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
	}, 'BrixTest');

	S.augment(BrixTest, BrixTest.METHODS);

	return BrixTest;
}, {
	requires: ["brix/base"]
});