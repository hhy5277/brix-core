KISSY.add("brix/base",
          function(S, app, Interface,
                      bxUtil, bxTpl, bxName, bxEvent, bxDelegate, bxConfig, bxRemote, Watcher, Promise, RichBase, XTemplate) {

    var noop = S.noop

    var DOM = S.DOM

    var DESTROY_ACTIONS = ['remove', 'empty']

    var Brick = RichBase.extend({
        initializer: function() {
            var self = this
            //这里是否考虑同步执行？
            var el = self.get('el')

            //id和名称都用采用静默更新
            self.set('id', el.attr('id'), { silent : true })
            if (!self.get('name')) {
                self.set('name', el.attr('bx-name'), { silent : true })
            }

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
                    return self.bxRender()
                })

            if (!self.get('passive')) {
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
                d.resolve(true)
            }, 0)
        },

        bind: noop,

        /**
         * 同步属性与用户界面
         * @protected
         * @method
         */
        sync: noop,

        /**
         * 获取模板
         */
        bxGetTpl: function() {
            var d = new Promise.Defer()
            var self = this

            self.bxHandleTpl(function(tpl) {
                if(tpl){
                   self.set('tpl', tpl) 
                }
                d.resolve(tpl)
            })

            return d.promise
        },

        bxAfterGetTpl: function() {
            var self = this
            var d = new Promise.Defer()

            // 开发者获取模板后，调用next方法
            // fn 留作扩展使用
            var fn = self.fire('getTpl', {
                next: function(tpl) {
                    if(tpl)
                    self.set('tpl', tpl)
                    d.resolve(tpl)
                }
            })

            if (fn) return d.promise
        },

        /**
         * 编译模板
         */
        bxBuildTpl: function() {
            if (this.bxIBuildTpl) return this.bxIBuildTpl()
        },

        bxGetData: function() {
            var d = new Promise.Defer()
            var self = this

            self.bxHandleRemote(function(data) {
                if(data){
                   self.set('data', data) 
                }
                
                d.resolve(data)
            })

            return d.promise
        },

        /**
         * 获取数据
         */
        bxAfterGetData: function() {
            var d = new Promise.Defer()
            var self = this

            //开发者获取数据后，调用next方法
            //fn 留作扩展使用
            var fn = self.fire('getData', {
                next: function(data) {
                    if(data){
                        self.set('data', data)
                    }
                    d.resolve(data)
                }
            })

            if (fn) return d.promise
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
                // if (self.get('tpl')) {
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

            if (!self.get('autoRender') || self.get("rendered")) {
                return
            }

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
                var html = S.trim(self.bxRenderTpl(tpl, self.get('data')))

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

            // 初始化子组件
            self.bxHandleName(el, function() {
                self.setInternal("rendered", true)
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
            var TplEngine = self.get('TplEngine')

            // 根据模板引擎，选择渲染方式
            if (typeof TplEngine === 'function') {
                var commands = self.get('commands')

                return new TplEngine(tpl, { commands: commands || {} }).render(data)
            }
            else {
                return TplEngine.render(tpl, data)
            }
        },

        /**
         * 给组件添加行为
         */
        bxActivate: function() {
            var self = this

            if (!self.get('autoActivate') ||      // do not enable automatically
                    self.get('activated') ||      // activated before,
                    !self.get('rendered')) {      // or not rendered yet.
                return
            }

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
            self.setInternal('activated', true)

            var children = self.get('children')
            var total = children.length
            var counter = 0

            function activated() {
                self.setInternal('ready', true)
                self.fire('ready')
            }

            function check() {
                if (++counter === total) activated()
            }

            for (var i = 0; i < children.length; i++) {
                var child = children[i]

                child.once('ready', check)
                child.bxActivate()
            }

            if (!children || children.length === 0) {
                S.later(activated, 0)
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

            self.constructor.superclass.bindInternal.call(self)

            self.callMethodByHierarchy("bind", "__bind")

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

            self.callMethodByHierarchy("sync", "__sync")

            /**
             * @event afterSync
             * fired after component 's internal state is synchronized.
             * @param {KISSY.Event.CustomEventObject} e
             */

            self.fire('afterSync')
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

                if (el && DOM.contains(document, el[0])) {
                    var action = self.get('destroyAction')

                    if (S.inArray(action, DESTROY_ACTIONS)) {
                        el[action]()
                    }
                }
            }

            self.set('destroyed', true)
        },

        boot: function() {
            return this.constructor.boot.apply(this, arguments)
        },

        /**
         * 扩展组件的事件触发，或通知到所有父组件
         * @param  {String}  type       要触发的自定义事件名称
         * @param  {Object}  eventData  要混入触发事件对象的数据对象
         */
        // 因为用到了 Brick 变量，所以从 core/bx-delegate 搬到这里，有更好的办法么？
        fire: function(eventType, eventData, context) {
            var ret = Brick.superclass.fire.apply(this, arguments)

            //触发父组件的事件
            var parent = this.get('parent')

            if (parent) {
                context = context || this;
                if (context === this) {
                    var eventTypeId = '#' + context.get('id') + '_' + eventType
                    var eventTypeName = context.get('name') + '_' + eventType

                    parent.fire(eventTypeId, eventData, context)
                    parent.fire(eventTypeName, eventData, context)
                }
                else {
                    parent.fire(eventType, eventData, context)
                }
            }

            return ret
        },
        /**
         * 事件绑定执行一次
         * @param  {String}   eventType 事件名称
         * @param  {Function} fn        事件方法
         * @param  {Object}   context   当前上下文
         * @return {[type]}             [description]
         */
        once: function(eventType, fn, context) {
            var self = this
            var wrap = function() {
                self.detach(eventType, wrap)
                fn.apply(this, arguments)
            }

            self.on(eventType, wrap, context)
        },
        /**
         * 运行fn后增加数据dirty checking
         * @param  {Function|String} fn 需要执行的方法
         */
        dirtyCheck:function(fn){
            var self = this

            if(typeof fn !== 'function'){
                fn = self[fn];
            }
            if(fn){
                fn.apply(self,Array.prototype.slice.call(arguments,1))
                self.digest()
            }
            else{
                throw new Error('没有找到对应的函数')
            }
        }
    }, {
        ATTRS: S.mix(S.mix({
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
                value: {}
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
            activated: {
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
             * 组件的id
             * @type {String}
             */
            id:{
                value: null
            },

            /**
             * 组件名称
             * @type {String}
             */
            name: {
                value: null
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
            TplEngine: {
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
            }
        }, Interface.ATTRS),Watcher.ATTRS)
    }, 'Brick')

    S.augment(Brick, bxUtil, bxTpl, bxName, bxEvent, bxDelegate, bxConfig, bxRemote,Watcher, Interface.METHODS)

    S.mix(Brick, {
        boot: function(el, data) {
            var options

            if (S.isPlainObject(el)) {
                // .boot({ el: el, tpl: tpl })
                if (el.el) {
                    data = null
                    options = el
                }
                else {
                    options = {
                        data: el,
                        el: '[bx-app]'
                    }
                }
            }
            else if (S.isString(el)) {
                options = {
                    el: el,
                    data: data
                }
            }
            else {
                options = {}
            }
            el = options.el

            if (!el || S.isString(el)) el = S.one(el || '[bx-app]')
            if (!el) throw new Error('Cannot find el!')

            options.el = el
            options.parent = this

            var children = this.get('children')

            if (!children) {
                children = []
                this.set('children', children)
            }

            var brick = new Brick(options)

            children.push(brick)

            return brick
        }
    })

    return Brick
}, {
    requires: [
        'brix/app/config',
        'brix/interface/index',
        'brix/core/bx-util',
        'brix/core/bx-tpl',
        'brix/core/bx-name',
        'brix/core/bx-event',
        'brix/core/bx-delegate',
        'brix/core/bx-config',
        'brix/core/bx-remote',
        'brix/core/bx-watcher',
        'promise',
        'rich-base',
        'xtemplate',
        'node',
        'event',
        'sizzle'
    ]
})