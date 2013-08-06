KISSY.add('brix/core/bx-boot', function(S, Promise) {

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
            el = options.el || '[bx-app]'

            if (S.isString(el)) options.el = el = S.one(el)
            if (el) options.parent = this

            el = options.el

            // We are booting this brick. There's no reason that it remains deferred.
            el.removeAttr('bx-defer')

            return options
        },

        bxBootName: function(el) {
            var name = el.attr('bx-name')
            var naked = el.hasAttr('bx-naked') && (el.attr('bx-naked') || 'all')

            if (name && naked !== 'all' && naked !== 'js') {
                name = name.split('/').length > 2 ? name : (name + '/index')
            }
            else {
                name = 'brix/base'
            }

            return name
        },

        bxBoot: function(options, Klass) {
            var children = this.get('children')
            var el = options.el

            if (!children) {
                children = []
                this.set('children', children)
            }

            var brick = this.find('#' + el.attr('id'))

            if (brick) brick.destroy()

            brick = new Klass(options)
            children.push(brick)

            return brick
        },

        boot: function(el, data) {
            var self = this
            var options = self.bxBootOptions(el, data)
            var d = new Promise.Defer()
            var name = this.bxBootName(options.el)

            S.use(name, function(S, Klass) {
                d.resolve(self.bxBoot(options, Klass))
            })

            return d.promise
        },

        prepare: function(el, data) {
            var d = new Promise.Defer()

            this.boot(el, data).then(function(brick) {
                brick.once('ready', function() {
                    d.resolve(this)
                })
            })

            return d.promise
        }
    }

    return exports
}, {
    requires: ['promise']
})