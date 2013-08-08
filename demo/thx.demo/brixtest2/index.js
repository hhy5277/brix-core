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
					var self = this;
					self.setChunkData({
						a: 'aaaa' + S.guid(),
						c: 'ccc' + S.guid()
					});
					self.fire(BrixTest2.FIRES.myfire);
					return false;
				}
			},
			'#input22': {
				click: function(e) {
					var self = this;
					self.setChunkData('b', 'bbb' + S.guid(), {
						renderType: 'prepend'
					});
					return false
				}
			},
			'#input23': {
				click: function(e) {
					var self = this;
					self.setChunkData('c', 'ccc' + S.guid(), {
						renderType: 'append'
					});
					return false
				}
			},
			'#input24': {
				click: function(e) {
					var self = this;
					self.setChunkData('d', [{
							d1: S.guid()
						}, {
							d1: S.guid()
						}, {
							d1: S.guid()
						}
					]);
				}
			},
			'#input25': {
				click: function(e) {
					var self = this;
					self.setChunkData('e', !self.pagelet.get('data').e);
				}
			},
			'#input26': {
				click: function(e) {
					this.pagelet.destroy();
				}
			},
			'#input27': {
				click: function(e) {
					var self = this;
					//这个有问题啊。bx-tmpl应该唯一键值。可以考虑加上组件名称前缀
					self.pagelet.setChunkData('startDay', 'startDay' + S.guid());
				}
			},
			'#input28': {
				click: function(e) {
					var self = this;
					var data = self.get('data');
					data.a = 'xxx'+S.guid();
				}
			},
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