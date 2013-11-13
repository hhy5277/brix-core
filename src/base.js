KISSY.add("brix/base",
    function(S, Interface, Core, Promise, Base, XTemplate, DOM) {
        var noop = S.noop
        var __getHook = Base.prototype.__getHook

        var DESTROY_ACTIONS = ['remove', 'empty']

        var Brick = Base.extend({
            /**
             * 初始化函数
             * @protected
             */
            initializer: function() {
                var self = this
                var d = new Promise.Defer()
                var promise = d.promise

                promise = promise
                    .then(function() {
                        return self.bxGetData()
                    })
                    .then(function() {
                        return self.bxAfterGetData()
                    })
                    .then(function() {
                        return self.bxBuildData()
                    })
                    .then(function() {
                        return self.bxGetTpl()
                    })
                    .then(function() {
                        return self.bxAfterGetTpl()
                    })
                    .then(function() {
                        return self.bxBuildTpl()
                    })
                    .then(function() {
                        //初始化完成，可以获取组件实例，调用render和active
                        self.fire('initialized')
                    })
                    .then(function() {
                        if (self.get('autoRender')) {
                            return self.bxRender()
                        }
                    })
                    .fail(function(err) {
                        if (err.message !== 'el is removed') {
                            throw err
                        }
                    })

                if (!self.get('passive') && self.get('autoActivate')) {
                    promise.then(function() {
                        return self.bxActivate()
                    })
                }


                // 将初始化过程变成异步，从而允许这样的写法：
                //
                //     new Brick({ ... }).on('ready', function() {
                //         // 监听 ready 事件
                //     })
                //
                // 不然如果实例化过程是同步的，来不及监听 ready 事件。
                //
                S.later(function() {
                    try {
                        if (self.get('el')) {
                            d.resolve(true)
                        }
                    } catch (e) {
                        //
                    }

                }, 0)

                return self
            },
            /**
             * 绑定用户界面
             * @protected
             */
            bind: noop,

            /**
             * 同步属性与用户界面
             * @protected
             */
            sync: noop,

            /**
             * 获取模板
             * @private
             */
            bxGetTpl: function() {
                var d = new Promise.Defer()
                var self = this

                self.bxHandleTpl(function(tpl) {
                    if (tpl) {
                        self.set('tpl', tpl)
                    }
                    d.resolve(tpl)
                })

                return d.promise
            },
            /**
             * 获取模板后触发getTpl事件
             * @private
             */
            bxAfterGetTpl: function() {
                var self = this
                var d = new Promise.Defer()

                // 开发者获取模板后，调用next方法
                // fn 留作扩展使用
                var fn = self.fire('getTpl', {
                    next: function(tpl) {
                        if (tpl)
                            self.set('tpl', tpl)
                        d.resolve(tpl)
                    }
                })

                if (fn) return d.promise
            },

            /**
             * 编译模板
             * @private
             */
            bxBuildTpl: function() {
                if (this.bxIBuildTpl) this.bxIBuildTpl()
            },
            /**
             * 获取数据
             * @private
             */
            bxGetData: function() {
                var d = new Promise.Defer()
                var self = this

                self.bxHandleRemote(function(data) {
                    if (data) {
                        self.set('data', data)
                    }

                    d.resolve(data)
                })

                return d.promise
            },

            /**
             * 获取数据后触发getData事件
             * @private
             */
            bxAfterGetData: function() {
                var d = new Promise.Defer()
                var self = this

                //开发者获取数据后，调用next方法
                //fn 留作扩展使用
                var fn = self.fire('getData', {
                    next: function(data) {
                        if (data) self.set('data', data)
                        d.resolve(data)
                    }
                })

                if (fn) return d.promise
            },

            /**
             * 编译数据
             * @private
             */
            bxBuildData: function() {

                if (this.bxIBuildData) this.bxIBuildData()
            },

            /**
             * 将模板渲染到页面
             * @private
             */
            bxRender: function() {
                var self = this

                if (self.bxRendering || self.bxRendered) {
                    return
                }
                self.bxRendering = true
                var d = new Promise.Defer()

                /**
                 * @event beforeRender
                 * fired when root node is ready
                 * @param {KISSY.Event.CustomEventObject} e
                 */
                self.fire('beforeRender')

                var tpl = self.get('tpl')

                var el = self.get('el')
                if (tpl) {
                    var data = self.bxGetAncestorWithData().data || {}
                    var html = S.trim(self.bxRenderTpl(tpl, data))
                    el.html(html)
                }

                self.bxDelegate()

                self.once('rendered', function resolve() {
                    /**
                     * @event afterRender
                     * fired after root node is rendered into dom
                     * @param {KISSY.Event.CustomEventObject} e
                     */
                    self.fire('afterRender')

                    d.resolve()
                })
                self.bxChildren = [];
                // 初始化子组件
                self.bxHandleName(el, function() {
                    delete self.bxRendering;
                    self.bxRendered = true
                    self.fire('rendered')
                })

                return d.promise
            },


            /**
             * 模板和数据渲染成字符串
             * @param  {Object} data 数据
             * @return {String} html片段
             * @private
             */
            bxRenderTpl: function(tpl, data) {
                var self = this
                var tplEngine = self.get('tplEngine')

                // 根据模板引擎，选择渲染方式
                if (typeof tplEngine === 'function') {
                    var commands = self.get('commands')

                    return new tplEngine(tpl, {
                        commands: commands || {}
                    }).render(data)
                } else {
                    return tplEngine.render(tpl, data)
                }
            },

            /**
             * 给组件添加行为
             */
            bxActivate: function() {
                var self = this

                if (self.bxActivating ||
                    self.bxActivated || // activated before,
                    !self.bxRendered) { // or not rendered yet.
                    return
                }
                self.bxActivating = true;
                self.bxBind()
                self.bxSync()

                if (self.bxIActivate) self.bxIActivate()

                // bxActivate 过程是否需要支持异步？
                // 如果支持异步，是否需要两个状态属性，例如：
                //
                // - bxActivateCalled 用来标识 bxActivate 方法已被调用
                // - activated 用来标识已经添加行为成功
                //
                // 目前是直接拿 activated 来判断是否已调用方法，用 .on('activated')
                // 事件来在添加行为完毕之后做其它操作。


                var children = self.bxChildren

                if (children.length === 0) {
                    S.later(
                        function() {
                            activated()
                        }, 0)
                    return
                }
                var total = children.length
                var counter = 0;

                function activated() {
                    delete self.bxActivating;
                    self.bxActivated = true
                    self.fire('ready')
                }

                function check() {
                    if (++counter === total) activated()
                }

                for (var i = 0; i < children.length; i++) {
                    var child = children[i]
                    if (!child.bxIsBrickInstance()) {
                        child.bxListenReady(check)
                    } else {
                        child.once('ready', check)
                        child.once('destroy', check)
                    }
                    child.bxActivate()
                }
            },

            bxBind: function() {
                var self = this

                /**
                 * @event beforeBind
                 * fired before component 's internal event is bind.
                 * @param {KISSY.Event.CustomEventObject} e
                 */
                self.fire('beforeBind')

                Brick.superclass.bindInternal.call(self)
                //debugger
                self.bind();

                // self.callMethodByHierarchy("bind", "__bind")

                /**
                 * @event afterBind
                 * fired when component 's internal event is bind.
                 * @param {KISSY.Event.CustomEventObject} e
                 */
                self.fire('afterBind')
            },

            bxSync: function() {
                var self = this

                /**
                 * @event beforeSync
                 * fired before component 's internal state is synchronized.
                 * @param {KISSY.Event.CustomEventObject} e
                 */
                self.fire('beforeSync')

                Brick.superclass.syncInternal.call(self)

                self.sync();
                //self.callMethodByHierarchy("sync", "__sync")

                /**
                 * @event afterSync
                 * fired after component 's internal state is synchronized.
                 * @param {KISSY.Event.CustomEventObject} e
                 */

                self.fire('afterSync')
            },

            /**
             * 析构函数，销毁资源
             * @protected
             */
            destructor: function() {
                var self = this

                //需要销毁子组件
                var children = self.bxChildren
                var i
                for (i = children.length - 1; i >= 0; i--) {
                    children[i].bxDestroy()
                }
                self.bxChildren = [];


                var parent = self.bxParent

                // 如果存在父组件，则移除
                if (parent) {
                    var siblings = parent.bxChildren
                    var id = self.bxId

                    for (i = siblings.length - 1; i >= 0; i--) {
                        if (siblings[i].bxId === id) {
                            siblings.splice(i, 1)
                            break
                        }
                    }
                }

                if (self.bxRendered) {
                    var el = self.get('el')

                    self.bxUndelegate()

                    if (el && DOM.contains(document, el[0])) {
                        var action = self.get('destroyAction')

                        if (S.inArray(action, DESTROY_ACTIONS)) {
                            el[action]()
                        }
                    }
                }
            }
        }, {
            __hooks__: {
                bind: __getHook('__bind'),
                sync: __getHook('__sync')
            },
            name: 'Brick',
            ATTRS: S.mix({
                /**
                 * 模板
                 * @cfg {Object}
                 */
                tpl: {
                    value: null
                },

                /**
                 * 数据
                 * @cfg {Object}
                 */
                data: {
                    value: null
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
                        if (!s) {
                            throw new Error('el is removed')
                        }
                        return s
                    },
                    setter: function(el) {
                        return '#' + this.bxUniqueId(el)
                    }
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
                autoActivate: {
                    value: true
                },

                /**
                 * 被动模式，在父组件渲染时开启，详见 core/bx-name
                 * @cfg {Boolean}
                 */
                passive: {
                    value: false
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
                tplEngine: {
                    value: XTemplate
                },

                /**
                 * 销毁操作时候的动作，默认remove。
                 * 可选none:什么都不做，empty:清空内部html
                 * @cfg {String}
                 */
                destroyAction: {
                    value: 'none'
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

                }
            }, Interface.ATTRS)
        })

        S.augment(Brick, Core, Interface.METHODS)

        return Brick
    }, {
        requires: [
            'brix/interface/index',
            'brix/core/index',
            'promise',
            'base',
            'xtemplate',
            'dom',
            'node'
        ]
    })