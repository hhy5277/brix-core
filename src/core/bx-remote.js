KISSY.add('brix/core/bx-remote', function(S, IO, Uri) {

	var exports = {

		bxHandleRemote: function(callback) {
			var self = this
			var el = self.get('el')
			var data = self.get('data')

			if (data) return callback(data)
			
			var remote = el.attr('bx-remote')
			
			if (!remote) return callback()
			
			var uri = new Uri(remote)

			if (/^http/.test(remote) && !uri.isSameOriginAs(new Uri(location.href))) {
				var query = uri.getQuery()
				var keys = query.keys()
				var jsonp

				for (var i = 0; i < keys.length; i++) {
					var key = keys[i]

					if (key === 'callback' || query.get(key) === 'callback') {
						jsonp = key
						query.remove(key)
						break
					}
				}

				IO({
					dataType: 'jsonp',
					url: uri.toString(),
					jsonp: jsonp,
					success: callback
				})
			}
			else {
				return callback()
			}
		}
	}

	return exports
}, {
	requires: [
		'ajax',
		'uri'
	]
})