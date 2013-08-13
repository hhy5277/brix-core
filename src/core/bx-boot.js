KISSY.add('brix/core/bx-boot', function(S, appConfig, Promise, DOM) {
    var Third
    var exports = {
        /**
         * 处理boot参数
         * @param  {Node}   el      节点
         * @param  {Object} data 传入数据
         * @return {Object|Array|String|Boolean|Number}  处理完后的类的参数
         */
        bxBootOptions: function(el,data) {
            var self = this
            var options
            if (S.isPlainObject(el)) {
                data = null
                options = el
            }
            else {
                options = {
                    el: el
                }
                if (data) {
                    options.data = data
                }
            }
            el = S.one(options.el || '[bx-app]')
            var config = self.bxHandleConfig(el)

            var ancestor = self.bxGetBrickAncestor(self)
            var overrides
            if (S.isArray(config)) {
                //options = [];
                //self.bxMixArgument(options, config)
                while (ancestor) {
                    overrides = ancestor.get('config')

                    if (overrides) {
                        self.bxMixArgument(config, overrides[el.attr('id')])
                        self.bxMixArgument(config, overrides[el.attr('name')])
                    }

                    ancestor = ancestor.bxParent && self.bxGetBrickAncestor(ancestor.bxParent)
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

                    ancestor = ancestor.bxParent && self.bxGetBrickAncestor(ancestor.bxParent)
                }
                options.el = el
            } else {
                options = config
            }
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
            self.bxUniqueId(el)
            // We are booting this brick. There's no reason that it remains deferred.
            el.removeAttr('bx-defer')
            var bothFn = function() {
                if (renderedFn) renderedFn()
                if (activatedFn) activatedFn()
            }

            if (!(el && DOM.contains(document, el[0]))) {
                return bothFn()
            }
            var inst
            var isExtendBrick = false
            if (!S.isFunction(Klass)) {
                inst = Klass
                S.mix(inst, Third)
            } else {
                if (!self.bxIsExtendBrickClass(Klass)) {
                    Third = Third || appConfig.config('Third')
                    S.augment(Klass, Third)
                } else {
                    isExtendBrick = true
                }
                if (S.isArray(options)) {
                    delete options.el;
                    inst = self.bxConstruct(Klass, options);
                } else {
                    inst = new Klass(options)
                }
            }

            inst.bxId = el.attr('id')
            inst.bxName = el.attr('bx-name')
            inst.bxChildren = []
            inst.bxParent = self;

            var children = self.bxChildren
            children.push(inst)


            if (isExtendBrick) {
                // 只检查一次，增加计数器之后即将 check 剥离 rendered 事件监听函数列表。
                if (renderedFn) inst.once('rendered', renderedFn)
                if (activatedFn) inst.once('ready', activatedFn)
                // 如果组件在实例化过程中被销毁了
                inst.once('destroy', bothFn)
            } else {
                //将el节点持有
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
            var opts = self.bxBootOptions(el, data)
            var d = new Promise.Defer()

            el = opts.el

            var brick = this.bxFind('#' + el.attr('id'))
            if (brick) {
                S.later(function() {
                    d.resolve(brick)
                })
            } else {
                var name = this.bxBootName(el)
                self.bxBootUse([name], function(Klasses) {
                    var brick = self.bxIBoot(el, opts, Klasses[0])
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
    requires: ['brix/app/config', 'promise', 'dom']
})