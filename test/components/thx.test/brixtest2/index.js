KISSY.add("thx.test/brixtest2/index", function(S, Brick) {

	var BrixTest2 = Brick.extend({
		constructor: function BrixTest2() {
			//可以重新定义构成函数，如果定义，必须显示调用父类的构造函数
			BrixTest2.superclass.constructor.apply(this, arguments);
			S.log('constructor2');
		},
		initializer: function() {
			S.log('initializer2');
		},
		bindUI: function() {
			//和老版本的initialize作用相同
			S.log('bindUI2');
		},
		syncUI:function(){
			this.get('el').one('#brix3_1').one('span').css('color','red');
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
				}
			},
			'#input22': {
				click: function(e) {
					var self = this;
					self.setChunkData('b', 'bbb' + S.guid(), {
						renderType: 'prepend'
					});
				}
			},
			'#input23': {
				click: function(e) {
					var self = this;
					self.setChunkData('c', 'ccc' + S.guid(), {
						renderType: 'append'
					});
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