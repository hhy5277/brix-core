/*jshint asi:true */
KISSY.add('brix/core/bx-template', function(S, app) {

    var exports = {
        bxHandleTemplate: function(callback) {
            var self = this
            var el = self.get('el')
            var source = self.get('tmpl') || el.attr('bx-template')

            if (!source) {
                // 不需要在前端渲染模板
                callback()
            }
            else if (source.charAt(0) === '#') {
                self.bxScriptTemplate(source, callback)
            }
            else if (source === '.') {
                self.bxHereTemplate(el, callback)
            }
            else if (/^\.\//.test(source)) {
                self.bxRemoteTemplate(
                    el.attr('bx-name').replace(/\/?$/, '') + source.substr(1),
                    callback
                )
            }
            else if (source === 'cached') {
                var withinEach = false
                var parent = el

                /*jshint boss:true*/
                while ((parent = parent.parent()) && parent !== el) {
                    if (parent.attr('bx-each')) {
                        withinEach = true
                        break
                    }
                    // if found parent with [bx-name] first, then self brick is
                    // not within each.
                    else if (parent.attr('bx-name')) {
                        break
                    }
                }
                var subTemplets = self.bxParent.bxCachedSubTemplets

                self.set('tmpl', withinEach ? subTemplets[0] : subTemplets.shift())
            }
            else {
                // 模板是直接传进来的，不需做处理
                callback()
            }
        },

        bxScriptTemplate: function(selector, callback) {
            this.set('tmpl', S.one(selector).html())
            callback()
        },

        bxHereTemplate: function(el, callback) {
            this.set('tmpl', el.html())
            callback()
        },

        bxRemoteTemplate: function(mod, callback) {
            if (app.config('debug')) {
                this.bxXhrTemplate(mod, callback)
            }
            else {
                var self = this

                S.use(mod, function(S, template) {
                    self.set('tmpl', template)
                    callback()
                })
            }
        },

        bxXhrTemplate: function(mod, callback) {
            if (!/^http/.test(location.href)) {
                throw Error('Cannot load template via xhr in current mode.')
            }
            var parts = mod.split('/')
            var ns = parts.shift()
            var name = parts.shift()
            var file = parts.shift()
            var base = S.config('packages')[ns].base
            var imports = app.config('imports')

            if (!(new RegExp(ns + '\\/?$')).test(base)) {
                parts.push(ns)
            }
            if (imports[ns]) {
                parts.push(name)
                parts.push(imports[ns][name])
            }
            else {
                parts.push(name)
            }
            parts.push(file + '.html')

            var self = this
            S.IO.get(base + parts.join('/'), function(template) {
                self.set('tmpl', template)
                callback()
            })
        }
    }

    return exports
}, {
    requires: [
        'brix/app/config',
        'node',
        'ajax',
        'sizzle'
    ]
})