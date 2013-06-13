/*jshint asi:true */
KISSY.add("brix/base",
          function(S, app,
                      bxTemplate, bxName, bxDelegate, bxConfig,
                      IZuomo,
                      Promise, RichBase, XTemplate) {

    var noop = S.noop


    var Brick = RichBase.extend({
        initializer: function() {
            var self = this
            var d = new Promise.Defer()
            var promise = d.promise

            promise
                .then(function() {
                    self.on('ready', function() {
                        //需要在自己完成后调用什么方法呢？
                    })
                })
                .then(function() {
                    return self.bxGetTemplate()
                })
                .then(function() {
                    return self.bxFireGetTemplate()
                })
                .then(function() {
                    return self.bxBuildTemplate()
                })
                .then(function() {
                    return self.bxGetData()
                })
                .then(function() {
                    return self.bxBuildData()
                })
                .then(function() {
                    if (self.get('autoRender')) {
                        return self.bxRender()
                    }
                })
                .then(function() {
                    if (self.get('autoBehavior')) {
                        return self.bxEnable()
                    }
                })
                .then(function() {
                    self.fire('ready')
                })

            // 将初始化过程变成异步，从而允许这样的写法：
            //
            //     var brick = new Brick({ ... })
            //
            //     brick.on('ready', function() {
            //         // 监听 ready 事件
            //     })
            //
            // 不然如果实例化过程是同步的，来不及监听 ready 事件。
            //
            S.later(function() {
                d.resolve(true)
            }, 0)
        },

        bindUI: noop,

        /**
         * 同步属性与用户界面
         * @protected
         * @method
         */
        syncUI: noop,

        /**
         * 获取模板
         */
        bxGetTemplate: function() {
            var d = new Promise.Defer()
            var self = this

            self.bxHandleTemplate(function(tmpl) {
                self.set('tmpl', tmpl)
                d.resolve(tmpl)
            })

            return d.promise
        },

        bxFireGetTemplate: function() {
            var self = this
            var d = new Promise.Defer()

            //开发者获取模板后，调用next方法
            //fn 留作扩展使用
            var fn = self.fire('getTemplate', {
                next: function(tmpl) {
                    d.resolve(tmpl)
                }
            })

            if (!fn) {
                d.resolve(self.get('tmpl'))
            }

            return d.promise
        },

        /**
         * 编译模板
         */
        bxBuildTemplate: noop,

        /**
         * 获取数据
         */
        bxGetData: function() {
            var d = new Promise.Defer()
            var self = this

            //开发者获取数据后，调用next方法
            //fn 留作扩展使用
            var fn = self.fire('getData', {
                next: function(data) {
                    self.set('data', data)
                    d.resolve()
                }
            })
            if (!fn) {
                d.resolve()
            }

            return d.promise
        },

        /**
         * 编译数据
         * @param  {Objcet} data 数据
         */
        bxBuildData: function() {
            var self = this
            var data = self.get('data')

            if (data) {
                return true
            }
            else {
                // 是否需要拷贝父亲的数据
                // if (self.get('tmpl')) {
                //     var parent = self
                //     var newData
                //     while (parent) {
                //         if (newData = parent.get('data')) {
                //             self.setInternal('data', newData)
                //             break
                //         }
                //         parent = parent.get('parent')
                //     }
                // }
            }
        },

        /**
         * 将模板渲染到页面
         */
        bxRender: function() {
            var self = this

            if (self.get("rendered")) {
                return
            }

            var d = new Promise.Defer()

            /**
             * @event beforeRenderUI
             * fired when root node is ready
             * @param {KISSY.Event.CustomEventObject} e
             */
            self.fire('beforeRenderUI')

            var tmpl = self.get('tmpl')
            var el = self.get('el')

            if (tmpl) {
                var html = S.trim(self.bxRenderTemplate(tmpl, self.get('data')))

                el.html(html)
            }

            self.bxDelegate()

            // 初始化子组件
            self.bxHandleName(el)

            console.log('bxRender', self.get('name'))

            self.on('rendered', function() {
                /**
                 * @event afterRenderUI
                 * fired after root node is rendered into dom
                 * @param {KISSY.Event.CustomEventObject} e
                 */
                self.fire('afterRenderUI')

                console.log('bxRender rendered', self.get('name'))
                self.setInternal("rendered", true)

                d.resolve()
            })

            return d.promise
        },


        /**
         * 模板和数据渲染成字符串
         * @param  {Object} data 数据
         * @return {String} html片段
         * @private
         */
        bxRenderTemplate: function(tmpl, data) {
            var self = this
            var templateEngine = self.get('templateEngine')

            //根据模板引擎，选择渲染方式
            if (typeof templateEngine === 'function') {
                return new templateEngine(tmpl).render(data)
            }
            else {
                return templateEngine.render(tmpl, data)
            }
        },

        /**
         * 给组件添加行为
         */
        bxEnable: function() {
            var self = this

            if (!self.get('rendered') && self.get('enabled')) {
                // enabled before,
                // or not rendered yet.
                return
            }

            self.bxBind()
            self.bxSync()

            // 应该移动到 interface/zuomo 里
            // 局部刷新事件监听
            self.on('beforeRefreshTmpl', function(e) {
                if (e.renderType === 'html') {
                    var children = self.bxDirectChildren(e.node)

                    for (var i = 0; i < children.length; i++) {
                        self.bxFind('#' + children[i].attr('id')).destroy()
                    }
                }
            })

            self.on('afterRefreshTmpl', function(e) {
                self.bxHandleName(e.node)
            })

            self.on('enabled', function() {
                self.set('enabled', true)
            })

            var children = self.get('children')
            var total = children.length
            var counter = 0

            function check() {
                counter++
                if (counter === total) {
                    self.fire('enabled')
                }
            }

            for (var i = 0; i < children.length; i++) {
                var child = children[i]

                child.on('enabled', check)
                child.bxEnable()
            }

            if (!children || children.length === 0) {
                S.later(function() {
                    self.fire('enabled')
                }, 0)
            }
        },

        bxBind: function() {
            var self = this

            /**
             * @event beforeBindUI
             * fired before component 's internal event is bind.
             * @param {KISSY.Event.CustomEventObject} e
             */
            self.fire('beforeBindUI')

            self.constructor.superclass.bindInternal.call(self)

            self.callMethodByHierarchy("bindUI", "__bindUI")

            // 兼容老的brix render后的初始化函数
            // self.callMethodByHierarchy("initialize", "constructor")

            /**
             * @event afterBindUI
             * fired when component 's internal event is bind.
             * @param {KISSY.Event.CustomEventObject} e
             */
            self.fire('afterBindUI')
        },

        bxSync: function() {
            var self = this

            /**
             * @event beforeSyncUI
             * fired before component 's internal state is synchronized.
             * @param {KISSY.Event.CustomEventObject} e
             */
            self.fire('beforeSyncUI')

            Brick.superclass.syncInternal.call(self)

            self.callMethodByHierarchy("syncUI", "__syncUI")

            /**
             * @event afterSyncUI
             * fired after component 's internal state is synchronized.
             * @param {KISSY.Event.CustomEventObject} e
             */

            self.fire('afterSyncUI')
        },

        /**
         * 析构函数，销毁资源
         * @return {[type]} [description]
         */
        destructor: function() {
            var self = this

            //需要销毁子组件
            var children = self.get('children')
            var i

            for (i = children.length - 1; i >= 0; i--) {
                children[i].destroy()
            }

            self.set('children', [])

            var parent = self.get('parent')

            // 如果存在父组件，则移除
            if (parent) {
                var siblings = parent.get('children')
                var id = self.get('id')

                for (i = siblings.length - 1; i >= 0; i--) {
                    if (siblings[i].get('id') === id) {
                        siblings.splice(i, 1)
                        break
                    }
                }
            }

            if (self.get('rendered')) {
                var el = self.get('el')

                self.bxUndelegate()

                switch (self.get('destroyAction')) {
                    case 'remove':
                        el.remove()
                        break
                    case 'empty':
                        el.empty()
                        break
                }
            }

            self.set('destroyed', true)
        },

        // 原有事件绑定做记录？？？
        on: function() {
            var self = this

            Brick.superclass.on.apply(self, arguments)
        }
    }, {
        ATTRS: {
            /**
             * 模板
             * @cfg {Object}
             */
            tmpl: {
                value: false
            },
            /**
             * 数据
             * @cfg {Object}
             */
            data: {
                value: false
            },
            /**
             * 是否已经渲染
             * @type {Boolean}
             */
            rendered: {
                value: false
            },
            /**
             * 是否已经添加行为
             * @type {Object}
             */
            addBehaviored: {
                value: false
            },
            /**
             * 组件根节点
             * @cfg {Node}
             */
            el: {
                getter: function(s) {
                    if (S.isString(s)) {
                        s = S.one(s)
                    }

                    return s
                },

                setter: function(el) {
                    if (S.isString(el)) {
                        el = S.one(el)
                    }
                    if (!el.attr('id')) {
                        var id

                        // 判断页面id是否存在，如果存在继续随机。
                        while ((id = S.guid('brix-brick-')) && S.one('#' + id)) {}

                        el.attr('id', id)
                    }

                    return '#' + el.attr('id')
                }
            },
            /**
             * 子模板
             * @type {Array}
             */
            subTmpls: {
                value: []
            },
            /**
             * 存储模板
             * @type {Array}
             */
            storeTmpls: {
                value: []
            },
            /**
             * 是否自动渲染
             * @cfg {Boolean}
             */
            autoRender: {
                value: true
            },
            /**
             * 自动添加组件行为
             * @cfg {Boolean}
             */
            autoBehavior: {
                value: true
            },
            /**
             * brick对子组件的配置增强,示例：{id:{xx:{},yy:{}},name{xx:{},yy:{}}}
             * @cfg {Object}
             */
            config: {
                value: {}
            },
            /**
             * 模板引擎,默认xTemplate
             * @cfg {Object}
             */
            templateEngine: {
                value: XTemplate
            },
            /**
             * 是否已经销毁
             * @type {Object}
             */
            destroyed: {
                value: false
            },
            /**
             * 销毁操作时候的动作，默认remove。
             * 可选none:什么都不做，empty:清空内部html
             * @cfg {String}
             */
            destroyAction: {
                value: 'remove'
            },
            /**
             * 后期事件代理
             * {
             *     'selector':{
             *         eventType:function(){
             *         }
             *     }
             * }
             * @type {Object}
             */
            events: {

            },
            /**
             * 存储所有子组件
             * @type {Array}
             */
            children: {
                value: []
            },
            /**
             * 组件的父组件实例对象
             * @cfg {Object}
             */
            parent: {
                value: false
            },
            /**
             * 子模板嵌套的级别
             * @cfg {Number}
             */
            level: {
                value: 4
            },
            /**
             * 是否完整自身子组件渲染
             * @type {Object}
             */
            isReady: {
                value: false
            },

            /**
             * 组件的分析模板，不进入渲染逻辑
             * @type {String}
             */
            brickTmpl: {
                value: false
            },
            /**
             * 存储组件模板集合
             * @type {Object}
             */
            brickTmpls: {
                value: {}
            },
            /**
             * 已经完成渲染的子组件计数器
             * @type {Number}
             */
            counter: {
                value: 0
            }
        }
    }, 'Brick')

    var INTERFACE_MAP = {
        zuomo: IZuomo
    }
    var Interface = INTERFACE_MAP[app.config('interface')]

    S.augment(Brick, bxTemplate, bxName, bxDelegate, bxConfig, Interface)

    /**
     * 静态方法集合
     */

    Brick.MARK = 'Brix'

    return Brick
}, {
    requires: [
        'brix/app/config',
        'brix/core/bx-template',
        'brix/core/bx-name',
        'brix/core/bx-delegate',
        'brix/core/bx-config',
        'brix/interface/zuomo',
        'promise',
        'rich-base',
        'xtemplate',
        'node',
        'event',
        'sizzle'
    ]
})