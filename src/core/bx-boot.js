KISSY.add('brix/core/bx-boot', function(S, Promise, app) {

    var Brick

    var exports = {
        bxBootOptions: function(el, data) {
            var options

            // Boot as child:
            //
            //     .boot({ el: el, tpl: tpl, data: data })
            //
            // Boot self:
            //
            //     .boot({ data: data })
            //
            if (S.isPlainObject(el)) {
                data = null
                options = el
            }
            // .boot('#page')
            else if (S.isString(el)) {
                options = {
                    el: el,
                    data: data
                }
            }
            // .boot()
            else {
                options = {}
            }
            el = options.el

            if (S.isString(el)) options.el = el = S.one(el)
            if (el) options.parent = this

            return options
        },

        bxBoot: function(options, Klass) {
            var children = this.get('children')
            var el = options.el

            if (!children) {
                children = []
                this.set('children', children)
            }

            var brick = this.find('#' + el.attr('id'))

            if (!brick) {
                brick = new Klass(options)
                children.push(brick)
            }

            return brick
        },

        boot: function(el, data) {
            var self = this
            var options = self.bxBootOptions(el, data)

            if (options.el) {
                return self.bxBoot(options, Brick || app.config('Brick'))
            }
            else if (self.get('defer')) {
                return self.bxIgnite()
            }
            else {
                return self
            }
        },

        bootAsync: function(el, data) {
            var self = this
            var options = this.bxBootOptions(el, data)
            var d = new Promise.Defer()

            el = options.el

            // We are booting this brick. There's no reason that it remains deferred.
            el.removeAttr('bx-defer')

            var name = el.attr('bx-name')
            var naked = el.hasAttr('bx-naked') && (el.attr('bx-naked') || 'all')

            if (name && naked !== 'all' && naked !== 'js') {
                name = name.split('/').length > 2 ? name : (name + '/index')
            }
            else {
                name = 'brix/base'
            }

            S.use(name, function(S, Klass) {
                d.resolve(self.bxBoot(options, Klass))
            })

            return d.promise
        }
    }

    return exports
}, {
    requires: ['promise', 'brix/app/config']
})