KISSY.add('brix/core/bx-tpl', function(S, app, IO) {

    var exports = {
        bxHandleTpl: function(callback) {
            var self = this
            var el = self.get('el')
            var source = self.get('tpl') || el.attr('bx-tpl')

            if (!source) {
                // 不需要在前端渲染模板
                callback()
            }
            else if (source.charAt(0) === '#') {
                self.bxScriptTpl(source, callback)
            }
            else if (source === '.') {
                self.bxHereTpl(el, callback)
            }
            else if (/^\.\//.test(source)) {
                self.bxRemoteTpl(
                    el.attr('bx-name').replace(/\/?$/, '') + source.substr(1),
                    callback
                )
            }
            else if (source === 'cached') {
                var withinEach = false
                var parent = el

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
                var subTpls = self.get('parent').get('subTplsCache')

                callback(withinEach ? subTpls[0] : subTpls.shift())
            }
            else {
                // 模板是直接传进来的，不需做处理
                callback(source)
            }
        },

        bxScriptTpl: function(selector, callback) {
            callback(S.one(selector).html())
        },

        bxHereTpl: function(el, callback) {
            callback(el.html())
        },

        bxRemoteTpl: function(mod, callback) {
            if (app.config('debug')) {
                this.bxXhrTpl(mod, callback)
            }
            else {
                S.use(mod, function(S, tpl) {
                    callback(tpl)
                })
            }
        },

        bxXhrTpl: function(mod, callback) {
            if (!/^http/.test(location.href)) {
                throw Error('Cannot load tpl via xhr in current mode.')
            }

            IO.get(this.bxResolveModule(mod, '.html'), callback)
        }
    }

    return exports
}, {
    requires: [
        'brix/app/config',
        'ajax',
        'node',
        'sizzle'
    ]
})