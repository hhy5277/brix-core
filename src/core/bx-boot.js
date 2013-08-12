KISSY.add('brix/core/bx-boot', function(S, appConfig, Promise) {
    var bxThird
    var exports = {

        bxBootOptions: function(el, data) {
            //这里的对外参数是否可以保持一致，只用一个object参数
            var self = this
            var options
            // Boot as child:
            //
            //     .boot({ el: el, tpl: tpl, data: data })
            //
            // Boot self:
            //
            //     .boot({ data: data })
            //
            if (S.isPlainObject(el) || S.isArray(el)) {
                data = null
                options = el
                el = options.el
            }
            // .boot('#page')
            else {
                options = {
                    el: el
                }
                if (data) {
                    options.data = data
                }
            }
            if (S.isArray(data)) {
                options = data;
                el = el
            } else {
                el = options.el
            }

            el = S.one(el || '[bx-app]')
            self.bxUniqueId(el)

            var config = self.bxHandleConfig(el)

            var ancestor = self.bxGetBrickAncestor(self)
            var overrides
            if (S.isArray(config)) {
                options = [];
                self.bxMixArgument(options, config)

                while (ancestor) {
                    overrides = ancestor.get('config')

                    if (overrides) {
                        self.bxMixArgument(config, overrides[el.attr('id')])
                        self.bxMixArgument(config, overrides[el.attr('name')])
                    }

                    ancestor = ancestor.bxParent && self.bxGetBrickAncestor(ancestor).bxParent
                }
                options = config
            } else if (S.isPlainObject(config)) {
                S.mix(options, config)
                while (ancestor) {
                    overrides = ancestor.get('config')

                    if (overrides) {
                        S.mix(options, overrides[el.attr('id')])
                        S.mix(options, overrides[el.attr('name')])
                    }

                    ancestor = ancestor.bxParent && self.bxGetBrickAncestor(ancestor).bxParent
                }
            } else {
                options = config
            }
            // We are booting this brick. There's no reason that it remains deferred.
            el.removeAttr('bx-defer')
            options.el = el
            return options
        },

        bxBootName: function(el) {
            var name = el.attr('bx-name')
            var naked = el.hasAttr('bx-naked') && (el.attr('bx-naked') || 'all')
            // the name might be
            //
            // - mosaics/wangwang
            // - mosaics/wangwang/
            // - mosaics/dropdown/large
            // - mosaics/calendar/twin
            //
            if (name && naked !== 'all' && naked !== 'js') {
                name = name.split('/').length > 2 ? name : (name + '/index')
            } else {
                name = 'brix/base'
            }

            return name
        },
        bxIBoot: function(el, options, Klass, renderedFn, activatedFn) {
            var self = this
            var DOM = S.DOM
            var bothFn = function() {
                if (renderedFn) renderedFn()
                if (activatedFn) activatedFn()
            }

            if (!(el && DOM.contains(document, el[0]))) {
                return bothFn()
            }
            var inst

            if (!S.isFunction(Klass)) {
                inst = Klass
            } else if (S.isArray(options)) {
                inst = self.bxConstruct(Klass, options);
            } else {
                inst = new Klass(options)
            }

            inst.bxId = el.attr('id')
            inst.bxName = el.attr('bx-name')
            inst.bxChildren = []
            inst.bxParent = self;

            var children = self.bxChildren
            children.push(inst)


            if (self.bxGetClass(inst)) {
                // 只检查一次，增加计数器之后即将 check 剥离 rendered 事件监听函数列表。
                if (renderedFn) inst.once('rendered', renderedFn)
                if (activatedFn) inst.once('ready', activatedFn)
                // 如果组件在实例化过程中被销毁了
                inst.once('destroy', bothFn)
            } else {
                //这里mix Brix的方法，实现组件的局部刷新等功能
                bxThird = bxThird || appConfig.config('bxThird')
                S.mix(inst, bxThird)
                inst.bxEl = el;
                inst.bxInit(renderedFn, activatedFn)
            }
            return inst;
        },
        bxBootUse: function(klasses, fn) {
            var self = this;
            KISSY.use(klasses.join(','), function(S) {
                var Klasses = S.makeArray(arguments)

                // remove the S in the arguments array
                Klasses.shift()
                if (fn) {
                    fn.call(self, Klasses)
                }
            })
        },
        bxBoot: function(el, data) {
            var self = this
            var options = self.bxBootOptions(el, data)
            var d = new Promise.Defer()

            el = options.el

            var brick = this.bxFind('#' + el.attr('id'))
            if (brick) {
                S.later(function() {
                    d.resolve(brick)
                })
            } else {
                var name = this.bxBootName(el)
                self.bxBootUse([name], function(Klasses) {
                    var brick = self.bxIBoot(el, options, Klasses[0])
                    //brick有可能为空
                    d.resolve(brick)
                })
            }

            return d.promise
        },
        bxPrepare: function(el, data) {
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
    requires: ['brix/app/config', 'promise']
})