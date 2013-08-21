KISSY.add("thx.test/watcher-foo/index", function(S, Brick) {

	var WatcherFoo = Brick.extend({
		dirtyCheckFoo: function(firstName, lastName) {
			var data = this.get('data')
			data.text = firstName + '_' + lastName
		},
		bind: function() {

		}
	}, {
		ATTRS: {
			data: {
				value: {
					image: {
						src: 'http://img01.taobaocdn.com/bao/uploaded/i1/13713024047600610/T1MB93XwdaXXXXXXXX_!!0-item_pic.jpg_160x160.jpg'
					}
				}
			}
		},
		EVENTS: {
			'.input31': {
				click: function(e) {
					var self = this
					//直接从e对象中获取data
					var data = e.brixData
					data.text = '我改变了'

					self.fire(WatcherFoo.FIRES.customEvent, {
						fireName: 'myfire3'
					})
				}
			},
			'#q':{
				valuechange:function(e){
					var data = e.brixData
					data.text = e.currentTarget.value
					data.image.src = 'http://a.tbcdn.cn/s/kissy/' + e.currentTarget.value + '.png'
				}
			}
		},
		FIRES: {
			customEvent: 'barEvent'
		}
	}, 'WatcherFoo')

	return WatcherFoo
}, {
	requires: ["brix/base"]
})