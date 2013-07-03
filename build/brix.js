/**
 * Brix Core v3.0.0
 * 
 * http://github.com/thx/brix-core
 */
KISSY.add('brix/app', function(S, appConfig, Brick) {

    function BxApp() {
        BxApp.superclass.constructor.call(this)
    }

    S.extend(BxApp, S.Base)

    BxApp.ATTRS = {
        prepared: false
    }

    S.augment(BxApp, appConfig, {
        boot: function() {
            this.prepare()

            return Brick.boot.apply(this, arguments)
        },

        bootStyle: function(fn) {
            this.prepare()

            S.use(this.bxComboStyle().join(','), fn)
        },

        prepare: function() {
            // prepare only once.
            if (!this.get('prepared')) {
                this.bxMapImports()
                this.bxMapComponents()
                this.bxPackageImports()
                this.bxPackageComponents()
                this.set('prepared', true)
            }
        }
    })

    var app = new BxApp()

    return app
}, {
    requires: [
        'brix/app/config',
        'brix/base',
        'base'
    ]
});
KISSY.add('brix/app/config', function(S) {

    // A simple Class for brick declaration processing.
    //
    // A brick can be declared as:
    //
    // - 0.1.0
    // - 0.1.0/js
    // - 0.1.0/css
    //
    // A declaration instance can then check whether this declaration says 
    // anything about js, css requirements or not.
    //
    // var foo = new Declaration('0.1.0/js')
    //
    // foo.requires('css')        // ==> false
    //
    function Declaration(str) {
        var parts = str.split('/')

        this.version = parts[0]
        this.assets = parts[1] || 'all'
    }

    S.augment(Declaration, {
        naked: function(type) {
            return !this.requires(type)
        },

        requires: function(type) {
            return this.assets === 'all' || this.assets === type
        },

        toString: function() {
            return this.version
        }
    })

    var exports = {
        configData: {
            debug: true,

            base: '.',

            interface: 'zuomo',

            imports: {},

            components: null,

            namespace: null,

            timestamp: null
        },

        config: function(prop, data) {
            var _data = this.configData

            if (S.isPlainObject(prop)) {
                data = prop
                prop = null
            }
            else if (S.isString(prop)) {
                if (typeof data !== 'undefined') {
                    var newData = {}

                    newData[prop] = data
                    data = newData
                }
                else {
                    return _data[prop]
                }
            }

            if (data) {
                S.mix(_data, data)

                if ('components' in data) this.bxResolveComponents()
                if ('imports' in data) this.bxResolveImports()
            }

            return this
        },

        bxResolveComponents: function() {
            // resolve simplified components settings into verbose format.
            var components = this.config('components')

            if (S.isPlainObject(components)) {
                for (var name in components) {
                    components[name] = new Declaration(components[name])
                }
            }
        },

        bxResolveImports: function() {
            var imports = this.config('imports')

            for (var ns in imports) {
                var bricks = imports[ns]

                for (var name in bricks) {
                    bricks[name] = new Declaration(bricks[name])
                }
            }
        },

        bxMapImports: function() {
            this.bxMapModules(this.config('imports'))
        },

        bxMapComponents: function() {
            var tag = this.config('timestamp')
            var ns = this.config('namespace')
            var components = this.config('components')

            if (tag && ns) {
                var injectTag = function(m, name, file) {
                    return [ns, tag, name, file].join('/')
                }

                S.config('map', [
                    [new RegExp(ns + '\\/([^\\/]+)\\/([^\\/]+)$'), injectTag]
                ])
            }
            else if (S.isPlainObject(components)) {
                var obj = {}

                obj[ns] = components

                this.bxMapModules(obj)
            }
        },

        bxMapModules: function(lock) {
            function makeReplacer(ns) {
                return function(match, name, file) {
                    return [ns, name, lock[ns][name], file].join('/')
                }
            }
            var maps = []

            for (var ns in lock) {
                maps.push([new RegExp(ns + '\\/([^\\/]+)\\/([^\\/]+)$'), makeReplacer(ns)])
            }

            S.config('map', maps)
        },

        bxPackageImports: function() {
            var imports = this.config('imports')
            var importsBase = this.config('base') + '/imports'
            var ignoreNs = S.config('ignorePackageNameInUri')
            var packages = {}

            for (var p in imports) {
                packages[p] = {
                    base: importsBase + (ignoreNs ? '/' + p : '')
                }
            }

            S.config('packages', packages)
        },

        bxPackageComponents: function() {
            var ns = this.config('namespace')
            var base = this.config('base')
            var ignoreNs = S.config('ignorePackageNameInUri')
            var obj = {}

            obj[ns] = {
                base: base + '/components' + (ignoreNs ? '/' + ns : '')
            }
            S.config('packages', obj)
        },

        bxComboStyle: function() {
            var imports = this.config('imports') || {}
            var styles = []

            var checkStyle = function(ns, bricks) {
                for (var name in bricks) {
                    if (bricks[name].requires('css')) {
                        styles.push([ns, name, 'index.css'].join('/'))
                    }
                }
            }
            var ns

            for (ns in imports) {
                checkStyle(ns, imports[ns])
            }
            var components = this.config('components')

            ns = this.config('namespace')
            
            if (S.isPlainObject(components)) {
                checkStyle(ns, components)
            }
            else if (S.isArray(components)) {
                for (var i = 0; i < components.length; i++) {
                    styles.push([ns, components[i], 'index.css'].join('/'))
                }
            }

            return styles
        }
    }

    return exports
});
KISSY.add("brix/base",
          function(S, app, Interface,
                      bxUtil, bxTpl, bxName, bxEvent, bxDelegate, bxConfig, bxRemote,
                      Promise, RichBase, XTemplate) {

    var noop = S.noop

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

            promise
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
                    return self.bxGetData()
                })
                .then(function() {
                    return self.bxAfterGetData()
                })
                .then(function() {
                    return self.bxBuildData()
                })
                .then(function() {
                    return self.bxRender()
                })
                .then(function() {
                    return self.bxActivate()
                })
                .then(function() {
                    self.fire('ready')
                })

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
                d.resolve(tpl)
            })

            d.promise.then(function(tpl) {
                self.set('tpl', tpl)
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
                    d.resolve(tpl)
                }
            })

            d.promise.then(function(tpl) {
                self.set('tpl', tpl)
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
                d.resolve(data)
            })

            d.promise.then(function(data) {
                self.set('data', data)
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
                    d.resolve(data)
                }
            })

            d.promise.then(function(data) {
                self.set('data', data)
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

            function resolve() {
                /**
                 * @event afterRender
                 * fired after root node is rendered into dom
                 * @param {KISSY.Event.CustomEventObject} e
                 */
                self.fire('afterRender')

                d.resolve()
            }

            self.on('rendered', function() {
                resolve()
                self.detach('rendered', resolve)
            })

            // 初始化子组件
            self.bxHandleName(el)

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
                return new TplEngine(tpl).render(data)
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
                    !self.get('rendered')) {    // or not rendered yet.
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
                self.fire('activated')
            }

            function check(e) {
                if (++counter === total) activated()
                e.target.detach('activated', check)
            }

            for (var i = 0; i < children.length; i++) {
                var child = children[i]

                child.on('activated', check)
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
            Brick.superclass.fire.apply(this, arguments)

            //触发父组件的事件
            var parent = this.get('parent')
            if (parent) {
                context = context || this;
                if (context === this) {
                    var eventTypeId = '#' + context.get('id') + '_' + eventType
                    var eventTypeName = context.get('name') + '_' + eventType
                    parent.fire(eventTypeId, eventData, context)
                    parent.fire(eventTypeName, eventData, context)
                } else {
                    parent.fire(eventType, eventData, context)
                }

            }
        }
    }, {
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
                value:null
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
             * brick对子组件的配置增强,示例：{id:{xx:{},yy:{}},name{xx:{},yy:{}}}
             * @cfg {Object}
             */
            config: {
                value: {}
            },

            /**
             * 模板引擎,默认xTpl
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
            }
        }, Interface.ATTRS)
    }, 'Brick')

    S.augment(Brick, bxUtil, bxTpl, bxName, bxEvent, bxDelegate, bxConfig, bxRemote, Interface.METHODS)

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
        'promise',
        'rich-base',
        'xtemplate',
        'node',
        'event',
        'sizzle'
    ]
});
KISSY.add('brix/core/bx-config', function(S) {

    var exports = {

        /* use cases:
         *
         *     this.bxHandleConfig(el)            // get options of current brick
         *     this.bxHandleConfig(el, MyBrick)   // get options of MyBrick
         */
        bxHandleConfig: function(el, Klass) {
            // Compact config
            var config = el.attr('bx-config')

            if (config) {
                // http://jslinterrors.com/the-function-constructor-is-a-form-of-eval/
                /*jshint -W054 */
                return (new Function('return ' + config))();
            } else {
                return {};
            }

            Klass = Klass || this.constructor
            var optionList = []

            while (Klass) {
                if (S.isArray(Klass.OPTIONS)) {
                    optionList = optionList.concat(Klass.OPTIONS)
                }
                Klass = Klass.superclass ? Klass.superclass.constructor : null
            }

            el = el || this.get('el')
            var opts = {}

            for (var i = 0; i < optionList.length; i++) {
                var p = optionList[i]

                opts[p] = this.bxCastString(el.attr('data-' + p))
            }

            return opts
        },

        bxCastString: function(str) {
            str = S.trim(str)

            if (/^(?:true|false)$/.test(str)) {
                return str === 'true'
            }
            else if (/^\d+$/.test(str)) {
                return parseInt(str, 10)
            }
            else {
                return str
            }
        }
    }

    return exports
});
KISSY.add('brix/core/bx-delegate', function() {

    var exports = {
        /**
         * 为符合匹配的相应事件添加事件处理器, 并在该组件的子孙组件中匹配selector 的组件上触发事件时调用
         * @param {String} selector  选择器（暂时支持组件id和bx-name）
         * @param {String} eventType 代理事件名称
         * @param {Function} fn 当事件触发时的回调函数
         * @param {Object} context  回调函数的this值，如果不指定默认为绑定事件的当前元素
         */
        delegate: function(selector, eventType, fn, context) {
            this.on(selector + '_' + eventType, fn, context)
        },

        /**
         * 为符合匹配的相应事件移除事件代理
         * @param {String} selector  选择器（暂时支持组件id）
         * @param {String} eventType 代理事件名称
         * @param {Function} fn 当事件触发时的回调函数
         * @param {Object} context  回调函数的this值，如果不指定默认为绑定事件的当前元素
         */
        undelegate: function(selector, eventType, fn, context) {
            this.detach(selector + '_' + eventType, fn, context)
        }
    }

    return exports
}, {
    requires: ['event']
});
KISSY.add('brix/core/bx-event', function(S) {

    var exports = {

        bxDelegate: function() {

            var c = this.constructor
            while (c) {
                this.bxDelegateMap(c.EVENTS)
                c = c.superclass ? c.superclass.constructor : null
            }

            //外部动态传入的事件代理
            var events = this.get('events')
            if(events){
                this.bxDelegateMap(events)
            }
        },

        bxDelegateMap: function(eventsMap) {
            var el = this.get('el')
            var Event = S.Event

            for (var sel in eventsMap) {
                var events = eventsMap[sel]

                for (var type in events) {
                    var fn = events[type]

                    if (sel === 'self') {
                        el.on(type, fn, this)
                    }
                    else if (sel === 'window') {
                        Event.on(window, type, fn, this)
                    }
                    else if (sel === 'body') {
                        Event.on('body', type, fn, this)
                    }
                    else if (sel === 'document') {
                        Event.on(document, type, fn, this)
                    }
                    else {
                        el.delegate(type, sel, fn, this)
                    }
                }
            }
        },

        bxUndelegate: function() {
            var c = this.constructor

            while (c) {
                this.bxUndelegateMap(c.EVENTS)
                c = c.superclass ? c.superclass.constructor : null
            }
            //外部动态传入的事件代理
            var events = this.get('events')
            if(events){
                this.bxUndelegateMap(events)
            }
        },

        bxUndelegateMap: function(eventsMap) {
            var el = this.get('el')
            var Event = S.Event

            for (var sel in eventsMap) {
                var events = eventsMap[sel]

                for (var type in events) {
                    var fn = events[type]

                    if (sel === 'self') {
                        el.detach(type, fn, this)
                    }
                    else if (sel === 'window') {
                        Event.detach(window, type, fn, this)
                    }
                    else if (sel === 'body') {
                        Event.detach('body', type, fn, this)
                    }
                    else if (sel === 'document') {
                        Event.detach(document, type, fn, this)
                    }
                    else {
                        el.undelegate(type, sel, fn, this)
                    }
                }
            }
        }
    }

    return exports
}, {
    requires: ['event']
});
KISSY.add('brix/core/bx-name', function(S, Node) {

    var exports = {
        bxHandleName: function(root) {
            root = Node(root)
            var nodes = this.bxDirectChildren(root)
            var children = this.get('children') || []
            var i, j
            var node

            for (i = nodes.length - 1; i >= 0; i--) {
                node = nodes[i]

                for (j = 0; j < children.length; j++) {
                    if (children[j].get('id') === node.attr('id')) {
                        nodes.splice(i, 1)
                    }
                }
            }
            var counter = 0
            var self = this
            var total = nodes.length

            function check(e) {
                if (++counter === total) {
                    self.setInternal("rendered", true)
                    self.fire('rendered')
                }
                // 只检查一次，增加计数器之后即将 check 剥离 rendered 事件监听函数列表。
                e.target.detach('rendered', check)
            }

            if (total === 0) {
                S.later(function() {
                    self.setInternal('rendered', true)
                    self.fire('rendered')
                }, 0)
            }
            else {
                var klasses = []
                var naked

                for (i = 0; i < total; i++) {
                    node = Node(nodes[i])
                    naked = node.hasAttr('bx-naked') && (node.attr('bx-naked') || 'all')

                    if (naked === 'js' || naked === 'all')
                        klasses[i] = 'brix/base'
                    else 
                        klasses[i] = node.attr('bx-name').replace(/\/?$/, '/index')
                }

                KISSY.use(klasses.join(','), function(S) {
                    var Klasses = S.makeArray(arguments)

                    // remove the S in the arguments array
                    Klasses.shift()

                    for (var i = 0; i < Klasses.length; i++) {
                        self.bxInstantiate(nodes[i], Klasses[i], check)
                    }
                })
            }
        },

        bxInstantiate: function(el, Klass, fn) {
            var parent = this

            if (!S.isFunction(Klass)) {
                // no need to initialize anything.
                return
            }
            var opts = parent.bxHandleConfig(el, Klass)
            var tag = el.attr('bx-tag')
            var inst

            S.mix(opts, {
                el: el,
                name: el.attr('bx-name'),
                parent: parent,

                // the tag and brickTpl attribute is required for interface/zuomo
                tag: tag,
                brickTpl: tag ? parent.get('brickTpls')[tag].middle : null
            })

            var ancestor = parent

            while (ancestor) {
                var overrides = ancestor.get('config')

                if (overrides) {
                    S.mix(opts, overrides[el.attr('id')])
                    S.mix(opts, overrides[el.attr('name')])
                }

                ancestor = ancestor.get('parent')
            }

            // 对父类的 listeners 的处理还没加进来，原代码见：
            // https://github.com/thx/brix-core/blob/bfa78a0b2b4dcfea4c24220e54850381140c7516/src/base.js#L606
            //
            // @keyapril 这里的使用场景得补充一下。

            inst = new Klass(opts)
            

            var children = parent.get('children')

            if (!children) {
                children = []
                parent.set('children', children)
            }
            children.push(inst)

            if (inst.bxRender) {
                inst.on('rendered', fn)
            }
            else {
                fn()
            }
            el = null
        },

        /**
         * Get child elements of current node which may or may not have
         * attribute bx-name.
         *
         * Given DOM structures like:
         *
         *     <div bx-name="foo/egg" bx-model="cart">
         *       <div bx-each="item in items"></div>
         *       <div bx-name="foo/ham" bx-model="item">
         *         <div bx-each="attr in attributes"></div>
         *       </div>
         *     </div>
         *
         * this.bxDirectChildren(S.one('[bx-name="foo/egg"]'), '[bx-each]')
         * should return an array consists of one element:
         *
         *     <div bx-each="item in items"></div>
         */
        bxDirectChildren: function(root, selector) {
            var arr = []
            var parentName = this.get('name')

            selector = selector || '[bx-name]'
            root.all(selector).each(function(ele) {
                var parent = ele.parent('[bx-name]')

                if (!parent || parent.attr('bx-name') === parentName) {
                    arr.push(ele)
                }
            })

            return arr
        },

        find: function(name) {
            var children = this.get('children')
            var isName = name.indexOf('/') > 0
            var isId = name.charAt(0) === '#'

            for (var i = 0; i < children.length; i++) {
                var child = children[i]

                if (isName && child.get('name') === name)
                    return child
                else if (isId && '#' + child.get('id') === name)
                    return child
            }
        }
    }

    return exports

}, {
    requires: [
        'node',
        'sizzle',
        'event'
    ]
});
KISSY.add('brix/core/bx-remote', function(S, app, IO, Uri) {

    var exports = {

        bxHandleRemote: function(callback) {
            var self = this
            var el = self.get('el')
            var data = self.get('data')

            if (data) return callback(data)
            
            var remote = el.attr('bx-remote')

            if (/^http/.test(remote)) {
                var uri = new Uri(remote)
                
                if (!uri.isSameOriginAs(new Uri(location.href)))
                    self.bxJsonpRemote(uri, callback)
            }
            else if (/^\.\//.test(remote)) {
                var name = self.get('name')
                var mod = name.replace(/\/?$/, '') + remote.substr(1)

                if (app.config('debug')) {
                    self.bxXhrRemote(mod, callback)
                }
                else {
                    S.use(mod, function(S, data) {
                        callback(data)
                    })
                }
            }
            else {
                return callback()
            }
        },

        bxJsonpRemote: function(uri, callback) {
            var query = uri.getQuery()
            var keys = query.keys()
            var jsonp

            // determine the jsonp callback key
            for (var i = 0; i < keys.length; i++) {
                var key = keys[i]

                if (key === 'callback' || query.get(key) === 'callback') {
                    jsonp = key
                    query.remove(key)
                    break
                }
            }

            IO({
                dataType: 'jsonp',
                url: uri.toString(),
                jsonp: jsonp,
                success: callback
            })  
        },

        bxXhrRemote: function(mod, callback) {
            if (!/^http/.test(location.href)) {
                throw Error('Cannot load data.json via xhr in current mode.')
            }

            IO.get(this.bxResolveModule(mod, '.json'), callback)
        }
    }

    return exports
}, {
    requires: [
        'brix/app/config',
        'ajax',
        'uri'
    ]
});
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
});
KISSY.add('brix/core/bx-util', function(S, app) {

    var exports = {
        bxResolveModule: function(mod, ext) {
            var parts = mod.split('/')
            var ns = parts.shift()
            var name = parts.shift()
            var file = parts.shift()
            var base = S.config('packages')[ns].base
            var imports = app.config('imports')

            // S.config('ignorePackageNameInUri')
            if (!(new RegExp(ns + '\\/?$')).test(base)) {
                parts.push(ns)
            }
            if (imports && imports[ns]) {
                parts.push(name)
                parts.push(imports[ns][name])
            }
            else {
                parts.push(name)
            }

            parts.push(file + ext)

            return base + parts.join('/')
        }
    }

    return exports
}, {
    requires: [
        'brix/app/config'
    ]
});
KISSY.add('brix/interface/if-yicai', function() {

    var exports = {}

    exports.METHODS = {

        bxIBuildTpl: function(el) {
            var nodes = this.bxDirectChildren(el)
            var subTpls = this.get('subTplsCache')

            if (!subTpls) {
                subTpls = []
                this.set('subTplsCache', subTpls)
            }

            for (var i = 0; i < nodes.length; i++) {
                var node = nodes[i]
                var tpl = node.attr('bx-tpl')

                if (node.attr('bx-model') && (!tpl || tpl === '.')) {
                    subTpls.push(node.html())
                    node.html('')
                    node.attr('bx-tpl', 'cached')
                }
            }
        }
    }

    exports.ATTRS = {
        subTplsCache: {
            value: []
        }
    }

    return exports
});
KISSY.add('brix/interface/if-zuomo', function(S) {

    var exports = {}

    exports.METHODS = {
        bxIBuildTpl: function() {
            var self = this
            var tpl = self.get('tpl')

            if (tpl) {
                tpl = self.bxITag(tpl)
                tpl = self.bxISubTpl(tpl)
                //存储模板
                self.bxIBuildStoreTpls(tpl)
                self.set('tpl', tpl)
                self.bxIBuildSubTpls(self.bxIBuildBrickTpls(tpl))

                return true
            } else {
                var brickTpl = self.get('brickTpl')
                if (brickTpl) {
                    self.bxIBuildSubTpls(self.bxIBuildBrickTpls(brickTpl))
                }
            }
            
            return false
        },

        bxIActivate: function() {
            var self = this

            // 局部刷新事件监听
            self.on('beforeRefreshTpl', function(e) {
                if (e.renderType === 'html') {
                    var children = self.bxDirectChildren(e.node)
                    for (var i = 0; i < children.length; i++) {
                        self.find('#' + children[i].attr('id')).destroy()
                    }
                }
            })

            self.on('afterRefreshTpl', function(e) {
                self.bxHandleName(e.node)
            })
        },

        /**
         * 构建{{#bx-store-tpl-id}}……{{/bx-store-tpl}}的存储
         * @param  {String} tpl 需要解析的模板
         * @return {String}      解析后的模板
         */
        bxIBuildStoreTpls: function(tpl) {
            var self = this
            var storeTpls = self.get('storeTpls')
            var storeTplRegexp = /\{\{#bx\-store\-tpl\-([^\}]*)?\}\}([\s\S]*?)\{\{\/bx\-store\-tpl\}\}/ig

            tpl = tpl.replace(storeTplRegexp, function(g, id, html) {
                storeTpls[id] = html
                return ''
            })
            return tpl
        },

        /**
         * 为模板中的组件打上tag标识
         * @param  {String} tpl 模板
         * @return {String}      替换后的模板
         */
        bxITag: function(tpl) {
            return tpl.replace(/(bx-tag=["'][^"']+["'])/ig, '')
                .replace(/(bx-name=["'][^"']+["'])/ig, function(match) {
                return match + ' bx-tag="brix_tag_' + S.guid() + '"'
            })
        },

        /**
         * 为bx-datakey自动生成bx-subtpl
         * @param  {String} tpl 模板
         * @return {String}      替换后的模板
         */
        bxISubTpl: function(tpl) {
            return tpl.replace(/(bx-subtpl=["'][^"']+["'])/ig, '')
                .replace(/(bx-datakey=["'][^"']+["'])/ig, function(match) {
                return 'bx-subtpl="brix_subtpl_' + S.guid() + '" ' + match
            })
        },

        bxIBuildBrickTpls: function(tpl) {
            var self = this
            var r = '(<([\\w]+)\\s+[^>]*?bx-name=["\']([^"\']+)["\']\\s+bx-tag=["\']([^"\']+)["\']\\s*[^>]*?>)(@brix@)(</\\2>)'
            var brickTpls = self.get('brickTpls')
            var level = self.get('level')
            while (level--) {
                r = r.replace('@brix@', '(?:<\\2[^>]*>@brix@</\\2>|[\\s\\S])*?')
            }
            r = r.replace('@brix@', '(?:[\\s\\S]*?)')
            var reg = new RegExp(r, "ig")
            tpl = tpl.replace(reg, function(all, start, tag, name, bx, middle, end) {
                brickTpls[bx] = {
                    start: start,
                    middle: middle,
                    end: end
                }
                //占位符
                return '@brix@' + bx + '@brix@'
            })
            return tpl
        },

        /**
         * 对节点中的bx-tpl和bx-datakey解析，构建模板和数据配置
         * @param {String} tpl  需要解析的模板
         * @private
         */
        bxIBuildSubTpls: function(tpl) {
            var self = this
            var subTpls = self.get('subTpls')
            var brickTpls = self.get('brickTpls')
            var level = self.get('level')

            var r = '(<([\\w]+)\\s+[^>]*?bx-subtpl=["\']([^"\']+)["\']\\s+bx-datakey=["\']([^"\']+)["\']\\s*[^>]*?>(@brix@)</\\2>)'

            while (level--) {
                r = r.replace('@brix@', '(?:<\\2[^>]*>@brix@</\\2>|[\\s\\S])*?')
            }
            r = r.replace('@brix@', '(?:[\\s\\S]*?)')

            var reg = new RegExp(r, "ig")
            var m
            var replacer = function(all, bx) {
                var o = brickTpls[bx]
                return o.start + o.middle + o.end
            }
            while ((m = reg.exec(tpl)) !== null) {
                subTpls.push({
                    name: m[3],
                    datakey: m[4],
                    tpl: m[5].replace(/@brix@(brix_tag_\d+)@brix@/ig, replacer)
                })
                //递归编译子模板
                self.bxIBuildSubTpls(m[5])
            }
        },

        /**
         * 局部刷新
         * @param  {String} subTplName 子模板名称或id，这个待定
         * @param  {Object} data 数据
         * @param  {String} renderType 渲染方式，目前支持html，append，prepend
         * @private
         */
        bxIRefreshTpl: function(keys, data, renderType) {
            var self = this

            if (!self.get('rendered')) {
                return
            }
            var el = self.get('el')
            var subTpls = self.get('subTpls')

            S.each(subTpls, function(o) {
                var datakeys = S.map(o.datakey.split(','), function(str) {
                    return S.trim(str); //修复编辑器格式化造成的问题
                })
                //是否包含的表示符
                var flg = false

                for (var i = 0; i < datakeys.length; i++) {
                    for (var j = 0; j < keys.length; j++) {
                        if (datakeys[i] == keys[j]) {
                            flg = true
                            break
                        }
                    }
                }
                if (flg) {
                    var nodes = el.all('[bx-subtpl=' + o.name + ']')

                    //如果el本身也是tpl，则加上自己
                    if (el.attr('bx-subtpl') == o.name) {
                        nodes = el.add(nodes)
                    }
                    nodes.each(function(node) {
                        self.fire('beforeRefreshTpl', {
                            node: node,
                            renderType: renderType
                        })
                        var newData = {}
                        S.each(datakeys, function(item) {
                            var tempdata = data,
                                temparr = item.split('.'),
                                length = temparr.length,
                                i = 0
                            while (i !== length) {
                                tempdata = tempdata[temparr[i]]
                                i++
                            }
                            newData[temparr[length - 1]] = tempdata
                            tempdata = null
                        })
                        S.each(data, function(d, k) {
                            if (S.isFunction(d)) {
                                newData[k] = d
                            }
                        })

                        //重新设置局部内容
                        nodes[renderType](S.trim(self.bxRenderTpl(o.tpl, newData)))

                        /**
                         * @event afterRefreshTpl
                         * 局部刷新后触发
                         * @param {KISSY.Event.CustomEventObject} e
                         */
                        self.fire('afterRefreshTpl', {
                            node: node,
                            renderType: renderType
                        })
                    })
                }
            })

            var children = self.get('children')

            // 为什么要这样做？
            // 因为 bxIRefreshTpl 有可能会更改 children 数组的长度
            for (var i = 0; i < children.length; i++) {
                var child = children[i]

                if (!child.get('refresh')) {
                    child.set('refresh', true)
                    if (!child.get('data')) {
                        child.bxIRefreshTpl(keys, data, renderType)
                        i = 0
                    }
                }
            }
            // 更新 refresh 的状态为 false
            S.each(children, function(child) {
                child.set('refresh', false)
            })
        },

        /**
         * 设置数据，并刷新模板数据
         * @param {String} datakey 需要更新的数据对象key
         * @param {Object} data    数据对象
         * @param {Object} [opts]    控制对象，包括以下控制选项
         * @param {Boolean} [opts.silent] 是否触发change事件
         * @param {Function} [opts.error] 验证失败的回调，包括失败原因
         * @param {String} [opts.renderType] 渲染方式，目前支持html，append，prepend
         */
        setChunkData: function(datakey, data, opts) {
            var self = this
            var newData
            var parent = self

            while (parent) {
                if ((newData = parent.get('data')) && newData) {
                    break
                }
                parent = parent.get('parent')
            }
            if (!newData) {
                newData = {}
                parent = self
            }
            var keys = []
            if (S.isObject(datakey)) {
                for (var key in datakey) {
                    newData[key] = datakey[key]
                    keys.push(key)
                }
                opts = data
            } else {
                keys = [datakey]
                newData[datakey] = data
            }

            //根据传入的opts,设置renderType
            var renderType = 'html'
            if (opts) {
                if (opts.renderType) {
                    renderType = opts.renderType;
                    delete opts.renderType
                }
            }
            parent.set('data', newData, opts)

            if (!opts || !opts.silent) {
                self.bxIRefreshTpl(keys, newData, renderType)
            }
        }
    }

    exports.ATTRS = {
        /**
         * 子模板
         * @type {Array}
         */
        subTpls: {
            value: []
        },

        /**
         * 存储模板
         * @type {Array}
         */
        storeTpls: {
            value: []
        },

        /**
         * 子模板嵌套的级别
         * @cfg {Number}
         */
        level: {
            value: 4
        },

        /**
         * 组件的分析模板，不进入渲染逻辑
         * @type {String}
         */
        brickTpl: {
            value: false
        },
        /**
         * 存储组件模板集合
         * @type {Object}
         */
        brickTpls: {
            value: {}
        }
    }

    return exports
});
KISSY.add('brix/interface/index', function(S, app, IZuomo, IYicai) {

    var INTERFACE_MAP = {
        zuomo: IZuomo,
        yicai: IYicai
    }
    
    return INTERFACE_MAP[app.config('interface')]

}, {
    requires: [
        'brix/app/config',
        'brix/interface/if-zuomo',
        'brix/interface/if-yicai'
    ]
});