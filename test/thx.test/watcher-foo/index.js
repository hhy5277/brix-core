KISSY.add("thx.test/watcher-foo/index", function(S, Brick) {

	var WatcherFoo = Brick.extend({
		dirtyCheckFoo:function(firstName,lastName){
			var data = this.get('data')
			data.text = firstName+'_'+lastName
		},
		bind:function(){
			var self = this
			self.get('el').one('#q').on('valuechange',function(e){
				var data = self.get('data')
				data.text = e.currentTarget.value
				var watcher = self.get('watcher');
				watcher.digest()
			})	
		}
	}, {
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
					var self = this;
					var data = self.get('data')
					data.text = '我改变了'

					self.fire(WatcherFoo.FIRES.customEvent, {
						fireName: 'myfire3'
					})
				}
			}
		},
		FIRES:{
			customEvent: 'barEvent'
		}
	}, 'WatcherFoo')

	return WatcherFoo
}, {
	requires: ["brix/base"]
})