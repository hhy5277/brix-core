KISSY.add("thx.test/delegate-bar/index", function(S, Brick) {

	var DelegateBar = Brick.extend({}, {
		ATTRS: {
			data:{
				value:{
					text: '我是test3'
				}
			}
		},
		EVENTS: {
			'.input31': {
				click: function(e) {
					var self = this
					e.brixData.text = '我改变了' + S.guid()
					//self.setChunkData({ text: '我改变了' + S.guid() })

					self.fire(DelegateBar.FIRES.customEvent, {
						fireName: 'myfire3'
					})
				}
			}
		},
		FIRES:{
			customEvent: 'barEvent'
		}
	}, 'DelegateTest3')

	return DelegateBar
}, {
	requires: ["brix/base"]
})