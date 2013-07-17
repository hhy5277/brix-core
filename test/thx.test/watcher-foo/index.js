KISSY.add("thx.test/watcher-foo/index", function(S, Brick) {

	var WatcherFoo = Brick.extend({
		dirtyCheckFoo: function(firstName, lastName) {
			var data = this.get('data')
			data.text = firstName + '_' + lastName
		},
		bind: function() {
			var self = this
			var q = self.get('el').one('#q')
			if (q) {
				q.on('valuechange', function(e) {
					//自己注册的方法，需要从ATTRS中获取data，并执行watcher的digest方法
					var data = self.get('data')
					data.text = e.currentTarget.value
					data.image.src = 'http://a.tbcdn.cn/s/kissy/' + e.currentTarget.value + '.png'
					var watcher = self.get('watcher');
					watcher.digest()
				})
			}


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