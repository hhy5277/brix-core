KISSY.add("thx.test/delegate-foo/index", function(S, Brick) {

	var DelegateFoo = Brick.extend({}, {
		ATTRS: {
			b: {
				value: 4
			},
			data:{
				value:{
					a:1,
					c:2,
					g:1234
				}
			}
		},
		EVENTS: {
			'#input21': {
				click: function(e) {
					var self = this
					this.bxRefresh = false
					this.bxData.a = 'aaaa' + S.guid()
					this.bxData.c = 'cccc' + S.guid()

					self.fire(DelegateFoo.FIRES.customEvent)
					return true
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