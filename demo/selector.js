KISSY.config({
	packages: {
		brix: {
			ignorePackageNameInUri: true,
			base: '../src'
		},
		'thx.demo': {
			base: '../demo',
			debug: true
		}
	}
})

KISSY.use('brix/app', function(_, app) {
	debugger
	app.boot('#container')
		.then(function(container) {
			container.once('ready', function() {
				debugger
				var dropdown = this.find('#brixtest')
			})
		})
})