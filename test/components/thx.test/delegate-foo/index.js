KISSY.add("thx.test/delegate-foo/index", function(S, Brick) {

	var DelegateFoo = Brick.extend({}, {
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
					var self = this
					self.setChunkData({
						a: 'aaaa' + S.guid(),
						c: 'ccc' + S.guid()
					})
					self.fire(DelegateFoo.FIRES.customEvent)
				}
			}
		},
		FIRES: {
			customEvent: 'fooEvent'
		}
	}, 'DelegateTest2')

	return DelegateFoo
}, {
	requires: ["brix/base"]
})