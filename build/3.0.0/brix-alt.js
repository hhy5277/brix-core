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

            imports: {},

            importsBase: 'http://g.tbcdn.cn/thx/m',

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
            // Resolve simplified components settings into verbose format.
            var components = this.config('components')
            var namespace

            // components 可能的值：
            //
            // - 字符串，即当前项目的命名空间
            // - {} ，用于配置详细组件信息（用于版本处理，组件样式加载等）
            //
            if (S.isString(components)) {
                namespace = components
            }
            else {
                // components 以对象形式定义，用于支持两种场景：
                //
                // 1. 声明需要 app.bootStyle 中加载的组件样式
                // 2. 使用版本锁方式发布时，声明项目组件的各自版本
                //
                // 场景一：
                //
                //     { 'thx.demo': ['dropdown', 'pagination'] }
                //
                // 场景二：
                //
                //     {
                //         'thx.demo': {
                //             dropdown: '1.0.0',
                //             pagination: '1.1.0'
                //         }
                //     }
                //
                // 此处的 for 循环用于将 'thx.demo' 从 components 对象中取出
                for (namespace in components) {}
                var bricks = components[namespace]

                if (S.isPlainObject(bricks)) {
                    for (var name in bricks) {
                        bricks[name] = new Declaration(bricks[name])
                    }
                }
            }

            this.config('namespace', namespace)
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
                this.bxMapModules(components)
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

            var importsBase = this.config('importsBase')

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

            // 如果已经定义过了，就不要覆盖
            if (S.config('packages')[ns]) {
                return
            }
            var base = this.config('base')
            var ignoreNs = S.config('ignorePackageNameInUri')
            var obj = {}

            obj[ns] = {
                base: base + (ignoreNs ? '/' + ns : '')
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
            components = components[ns]

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
                      bxUtil, bxTpl, bxName, bxEvent, bxDelegate, bxConfig, bxRemote, Watcher, Promise, RichBase, XTemplate) {

    var noop = S.noop

    var DOM = S.DOM

    var DESTROY_ACTIONS = ['remove', 'empty']

    var Brick = RichBase.extend({
        // constructor:function(){
        //     var self = this;
        //     //显示的调用父类的构造函数，这句很重要。
        //     Brick.superclass.constructor.apply(self, arguments)
        //     var scope = {};
        //     var constt = self.constructor
        //     for(var key in constt){
        //         if(constt.hasOwnProperty(key)&&typeof self[key] === 'function'){
        //             scope[key] = function(){
        //                 self[key]();
        //                 digest();
        //             }
        //         }
                
        //     }
        // },
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
            var watcher = self.get('watcher')

            if(typeof fn !== 'function'){
                fn = self[fn];
            }
            if(fn){
                fn.apply(self,Array.prototype.slice.call(arguments,1))
                watcher.digest()
            }
            else{
                throw new Error('没有找到对应的函数')
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
            },
            /**
             * 数据监听器
             * @type {Watcher}
             */
            watcher:{
                value : new Watcher()
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
        'brix/core/bx-watcher',
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
            if (events) {
                this.bxDelegateMap(events)
            }
        },

        bxDelegateMap: function(eventsMap) {
            var self = this
            var el = this.get('el')
            var watcher = this.get('watcher')
            //var bxEvents = this.get('bx-events')
            var Event = S.Event
            var fnc
            var fn

            function wrapFn(fnc) {
                return function() {
                    //增加brixData，方便外部直接获取
                    arguments[0].brixData = self.get('data')
                    
                    fnc.apply(this, arguments)
                    watcher.digest()
                }
            }

            for (var sel in eventsMap) {
                var events = eventsMap[sel]
                //if (typeof events !== 'function') {
                    for (var type in events) {
                        fnc = events[type]
                        fnc.handle = wrapFn(fnc)

                        fn = fnc.handle

                        if (sel === 'self') {
                            el.on(type, fn, this)
                        } else if (sel === 'window') {
                            Event.on(window, type, fn, this)
                        } else if (sel === 'body') {
                            Event.on('body', type, fn, this)
                        } else if (sel === 'document') {
                            Event.on(document, type, fn, this)
                        } else {
                            el.delegate(type, sel, fn, this)
                        }
                    }
                // } else {
                //     if (bxEvents[sel]) {
                //         for (var i = 0; i < bxEvents[sel].length; i++) {
                //             fnc = events
                //             fnc.handle = (function(fnc) {
                //                 return function() {
                //                     fnc.apply(this, arguments)
                //                     watcher.digest()
                //                 }
                //             })(fnc)
                //             var fn = fnc.handle
                //             el.one('[bx-' + bxEvents[sel][i] + '=' + sel + ']').on(bxEvents[sel][i], fn, this)
                //         }
                //     }
                // }
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
            if (events) {
                this.bxUndelegateMap(events)
            }
        },

        bxUndelegateMap: function(eventsMap) {
            var el = this.get('el')
            //var bxEvents = this.get('bx-events')
            var Event = S.Event
            var fn

            for (var sel in eventsMap) {
                var events = eventsMap[sel]
                //if (typeof events !== 'function') {
                    for (var type in events) {
                        fn = events[type].handle

                        if (sel === 'self') {
                            el.detach(type, fn, this)
                        } else if (sel === 'window') {
                            Event.detach(window, type, fn, this)
                        } else if (sel === 'body') {
                            Event.detach('body', type, fn, this)
                        } else if (sel === 'document') {
                            Event.detach(document, type, fn, this)
                        } else {
                            el.undelegate(type, sel, fn, this)
                        }

                        fn = null;
                        delete events[type].handle
                    }
                // } else {
                //     if (bxEvents[sel]) {
                //         for (var i = 0; i < bxEvents[sel].length; i++) {
                //             var fn = events.handle
                //             el.one('[bx-' + bxEvents[sel][i] + '=' + sel + ']').detach(bxEvents[sel][i], fn, this)
                //         }
                //     }
                // }

            }
        }
    }

    return exports
}, {
    requires: ['event']
});
KISSY.add('brix/core/bx-name', function(S, Node) {

    var exports = {
        bxHandleName: function(root, renderedFn, activatedFn) {
            root = Node(root)
            var nodes = this.bxDirectChildren(root)
            var children = this.get('children') || []
            var i, j
            var node

            // Some of the child nodes might be instantiated already.
            // Remove them out of the nodes array that will be processed.
            for (i = nodes.length - 1; i >= 0; i--) {
                node = nodes[i]

                for (j = 0; j < children.length; j++) {
                    if (children[j].get('id') === node.attr('id')) {
                        nodes.splice(i, 1)
                    }
                }
            }
            var renderedCounter = 0
            var activatedCounter = 0
            var self = this
            var total = nodes.length

            if (total === 0) {
                S.later(function() {
                    renderedFn()
                    if (activatedFn) activatedFn()
                }, 0)
            }
            else {
                var klasses = []
                var naked
                var name
                var renderedCheck = function() {
                    if (++renderedCounter === total) renderedFn()
                }
                var activatedCheck = activatedFn && function() {
                    if (++activatedCounter === total) activatedFn()
                }

                for (i = 0; i < total; i++) {
                    node = Node(nodes[i])
                    naked = node.hasAttr('bx-naked') && (node.attr('bx-naked') || 'all')
                    name = node.attr('bx-name')

                    if (naked === 'js' || naked === 'all') {
                        klasses[i] = 'brix/base'
                    }
                    // might be
                    //
                    // - mosaics/wangwang/
                    // - mosaics/dropdown/large
                    // - mosaics/calendar/twin
                    //
                    else if (name.split('/').length > 2) {
                        klasses[i] = name
                    }
                    else {
                        klasses[i] = name + '/index'
                    }
                }

                KISSY.use(klasses.join(','), function(S) {
                    var Klasses = S.makeArray(arguments)

                    // remove the S in the arguments array
                    Klasses.shift()

                    for (var i = 0; i < Klasses.length; i++) {
                        self.bxInstantiate(nodes[i], Klasses[i], renderedCheck, activatedCheck)
                    }
                })
            }
        },

        bxInstantiate: function(el, Klass, renderedFn, activatedFn) {
            var parent = this
            var DOM = S.DOM
            var bothFn = function() {
                renderedFn()
                if (activatedFn) activatedFn()
            }

            if (!S.isFunction(Klass)) {
                // no need to initialize anything.
                bothFn()
                return
            }
            if (!(el && DOM.contains(document, el[0]))) {
                // el is gone
                bothFn()
                return
            }
            var opts = parent.bxHandleConfig(el, Klass)
            var tag = el.attr('bx-tag')

            S.mix(opts, {
                el: el,
                name: el.attr('bx-name'),
                parent: parent,

                // 开启被动模式，即渲染完毕之后不再自动 bxActivate ，而是等父组件来管理这一过程
                passive: !activatedFn,

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

            var inst = new Klass(opts)
            var children = parent.get('children')

            if (!children) {
                children = []
                parent.set('children', children)
            }
            children.push(inst)

            if (inst.bxRender) {
                // 只检查一次，增加计数器之后即将 check 剥离 rendered 事件监听函数列表。
                inst.once('rendered', renderedFn)
                if (activatedFn) inst.once('ready', activatedFn)
            }
            else {
                bothFn()
            }
            el = children = null
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

            var components = app.config('components')

            var imports = app.config('imports')

            // S.config('ignorePackageNameInUri')
            if (!(new RegExp(ns + '\\/?$')).test(base)) {
                parts.push(ns)
            }

            parts.push(name)

            if (imports && imports[ns]) {
                parts.push(imports[ns][name])
            }
            else if (components && S.isPlainObject(components[ns])) {
                parts.push(components[ns][name])
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
KISSY.add('brix/core/bx-watcher', function() {
    var memo = {}

        function parse(expression) {
            var fn = memo[expression]

            if (!fn) {
                /*jshint -W054 */

                //fn = memo[expression] = new Function('context', 'locals', 'with(context){ return ' + expression + '; }')
                fn = memo[expression] = new Function('context', 'locals', 'with(context){if(typeof ' + expression + ' ==="undefined"){return}else{ return ' + expression + '}}')
            }

            return fn
        }

        function unwatch(watcher, watchers) {
            return function() {
                var index = watchers.indexOf(watcher)

                if (index > -1) {
                    watchers.splice(index, 1)
                }
            }
        }

        function Watcher() {
            this.watchers = []
            this.checking = false
        }

    Watcher.prototype.watch = function(context, expression, callback) {
        var value, watcher

            value = typeof expression === 'function' ? function() {
                return expression(context)
            } : parse(expression)

            watcher = {
                value: value,
                context: context,
                last: value(context),
                callback: callback,
                expression: expression
            };
        this.watchers.push(watcher)

        return unwatch(watcher, this.watchers)
    };

    Watcher.prototype.digest = function() {
        var clean, index, length, watcher, value, iterations = 10

        if (this.checking) {
            throw new Error('Digest phase is already started')
        }

        this.checking = true

        do {
            clean = true
            index = -1
            length = this.watchers.length

            while (++index < length) {
                watcher = this.watchers[index]
                value = watcher.value(watcher.context)
                if (value !== watcher.last) {
                    watcher.callback(value, watcher.last)
                    watcher.last = value
                    clean = false
                }
            }
        } while (!clean && iterations--)

        if (!iterations) {
            throw new Error('Too much iterations per digest');
        }

        this.checking = false
    }

    Watcher.parse = parse
    return Watcher
});;
KISSY.add('brix/interface/index', function() {

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
KISSY.add('brix/interface/index', function(S, app, IZuomo, IYicai) {

    var INTERFACE_MAP = {
        zuomo: IZuomo,
        yicai: IYicai
    }
    var name = 'zuomo'  // or yicai

    return INTERFACE_MAP[name]

}, {
    requires: [
        'brix/app/config',
        'brix/interface/if-zuomo',
        'brix/interface/if-yicai'
    ]
});
