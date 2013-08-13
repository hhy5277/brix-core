/**
 * Brix Core v3.0.0
 * 
 * http://github.com/thx/brix-core
 */
KISSY.add('brix/app', function(S, appConfig, bxBoot, bxFind, Brick, Base) {

    function BxApp() {
        BxApp.superclass.constructor.apply(this, arguments)
    }

    S.extend(BxApp, Base)
    S.augment(BxApp, appConfig, bxBoot, bxFind, {
        bootStyle: function(fn) {
            S.use(this.bxComboStyle().join(','), fn)
        }
    })

    var app = new BxApp({})

    app.config('Brick', Brick)

    return app
}, {
    requires: [
        'brix/app/config',
        'brix/core/bx-boot',
        'brix/core/bx-find',
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

            this.bxPackageComponents()
            this.bxMapComponents()
        },

        bxResolveImports: function() {
            var imports = this.config('imports')

            for (var ns in imports) {
                var bricks = imports[ns]

                for (var name in bricks) {
                    bricks[name] = new Declaration(bricks[name])
                }
            }

            this.bxPackageImports()
            this.bxMapImports()
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
          function(S, Util, app, Interface,
                    bxTpl, bxName, bxEvent, bxDelegate, bxConfig, bxRemote, bxBoot, bxFind,
                      Watcher, Promise, RichBase, XTemplate) {

    var noop = S.noop

    var DOM = S.DOM

    var DESTROY_ACTIONS = ['remove', 'empty']

    var Brick = RichBase.extend({
        initializer: function() {
            var self = this
            var el = self.get('el')


            self.bxId = el.attr('id')
            self.bxName = el.attr('bx-name')

            self.bxIgnite()
        },

        bxIgnite: function() {
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
                    return self.bxRender()
                })
                .fail(function(err) { throw err })

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

            return self
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
                    if (data) self.set('data', data)
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
                if(!child.bxRender){
                    check()
                }   
                else{
                    child.once('ready', check)
                    child.bxActivate() 
                }
                
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
                var id = self.bxId

                for (i = siblings.length - 1; i >= 0; i--) {
                    if (siblings[i].bxId === id) {
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
                    var eventTypeId = '#' + context.bxId + '_' + eventType
                    var eventTypeName = context.bxName + '_' + eventType

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

            return self
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
                    return '#' + Util.bxUniqueId(el)
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

    S.augment(Brick, bxTpl, bxName, bxEvent, bxDelegate, bxConfig, bxRemote, bxBoot, bxFind, Watcher, Interface.METHODS)


    return Brick
}, {
    requires: [
        'brix/tool/util',
        'brix/app/config',
        'brix/interface/index',
        'brix/core/bx-tpl',
        'brix/core/bx-name',
        'brix/core/bx-event',
        'brix/core/bx-delegate',
        'brix/core/bx-config',
        'brix/core/bx-remote',
        'brix/core/bx-boot',
        'brix/core/bx-find',
        'brix/core/bx-watcher',
        'promise',
        'rich-base',
        'xtemplate',
        'node',
        'event',
        'sizzle'
    ]
});
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
            var Event = S.Event
            var fnc
            var fn;

            function wrapFn(fnc) {
                return function() {
                    //增加brixData，方便外部直接获取
                    arguments[0].brixData = self.get('data')

                    fnc.apply(this, arguments)
                    self.digest()
                }
            }

            for (var sel in eventsMap) {
                var events = eventsMap[sel]
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
            var Event = S.Event
            var fn

            for (var sel in eventsMap) {
                var events = eventsMap[sel]
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
            }
        }
    }

    return exports
}, {
    requires: ['event']
});
KISSY.add('brix/core/bx-find', function() {

    var exports = {
        /**
         * 递归查找当前组件下的子组件
         * @param  {String} selector 选择器，目前支持id和bx-name
         * @return {Brick}
         */
        one: function(selector) {
            return this.bxOne(selector, this.get('children') || [], true)
        },
        bxOne: function(selector, children, isRecursive) {
            if (selector.charAt(0) === '#') {
                selector = selector.substr(1)
            }
            for (var i = 0; i < children.length; i++) {
                var child = children[i]
                if (child.bxId === selector ||
                    child.bxName === selector) {
                    return child
                } else if (isRecursive) {
                    var result = this.bxOne(selector, child.get('children') || [], isRecursive)
                    if (result) {
                        return result
                    }
                }
            }
        },
        /**
         * 查找当前组件下的子组件
         * @param  {Object} opts 查找条件，name和selector只能任选其一
         * @param  {String} opts.name 组件名称bx-name
         * @param  {String} opts.selector el节点选择器
         * @return {Array}  符合过滤条件的实例数组
         */
        all: function(selector) {
            var result = []
            this.bxAll(selector, this.get('children') || [], result, true)
            return result;
        },
        bxAll: function(selector, children, result, isRecursive) {
            if (selector.charAt(0) === '#') {
                selector = selector.substr(1)
            }
            for (var i = 0; i < children.length; i++) {
                var child = children[i]

                if (child.bxId === selector ||
                    child.bxName === selector) {
                    result.push(child)
                }
                if (isRecursive) {
                    this.bxAll(selector, child.get('children') || [], result, isRecursive)
                }
            }
        },
        /**
         * 查找当前组件下的子组件
         * @param  {String} selector 选择器，目前支持id和bx-name
         * @return {Brick}
         */
        find: function(selector) {
            return this.bxOne(selector, this.get('children') || [])
        },
        /**
         * 查找当前组件下的子组件
         * @param  {String} selector 选择器，目前支持id和bx-name
         * @return {Array}  符合过滤条件的实例数组
         */
        where: function(selector) {
            var result = []
            this.bxAll(selector, this.get('children') || [], result)
            return result;
        }
    }

    return exports
});
KISSY.add('brix/core/bx-name', function(S, Util, Node) {

    var exports = {
        bxHandleName: function(root, renderedFn, activatedFn) {
            root = Node(root)
            var nodes = this.bxDirectChildren(root)
            var self = this

            for (var i = nodes.length - 1; i >= 0; i--) {
                var node = nodes[i]

                // If the node is deferred, do not instantiate it.
                if (node.hasAttr('bx-defer')) {
                    nodes.splice(i, 1)
                } else {
                    // Some of the child nodes might be instantiated already.
                    // Remove them out of the nodes array that will be processed.
                    var brick = self.find('#' + node.attr('id'))

                    if (brick) nodes.splice(i, 1)
                }
            }

            if (nodes.length === 0) {
                S.later(function() {
                    //S.log(self.bxName+'_'+renderedCounter+'_total:'+total)
                    renderedFn()
                    if (activatedFn) activatedFn()
                }, 0)
            } else {
                self.bxUseModules(nodes, renderedFn, activatedFn)
            }
        },

        bxUseModules: function(nodes, renderedFn, activatedFn) {
            var self = this
            var renderedCounter = 0
            var activatedCounter = 0
            var total = nodes.length
            var klasses = []
            var renderedCheck = function() {
                //S.log(self.bxName+'_'+renderedCounter+'_'+total)
                if (++renderedCounter === total) renderedFn()
            }
            var activatedCheck = activatedFn && function() {
                    if (++activatedCounter === total) activatedFn()
                }

            for (var i = 0; i < total; i++) {
                var node = Node(nodes[i])
                var naked = node.hasAttr('bx-naked') && (node.attr('bx-naked') || 'all')
                var name = node.attr('bx-name')

                if (naked === 'js' || naked === 'all') {
                    klasses[i] = 'brix/base'
                }
                // the name might be
                //
                // - mosaics/wangwang
                // - mosaics/wangwang/
                // - mosaics/dropdown/large
                // - mosaics/calendar/twin
                //
                else if (name.split('/').length > 2) {
                    klasses[i] = name
                } else {
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
                return bothFn()
            }
            if (!(el && DOM.contains(document, el[0]))) {
                //S.log(parent.bxName+'_bothFn:')
                // el is gone
                return bothFn()
            }
            Util.bxUniqueId(el)
            var opts = parent.bxHandleConfig(el, Klass)
            var inst
            var ancestor = parent
            var overrides
            if (S.isArray(opts)) {
                while (ancestor) {
                    overrides = ancestor.get('config')

                    if (overrides) {
                        Util.bxMixArgument(opts, overrides[el.attr('id')])
                        Util.bxMixArgument(opts, overrides[el.attr('name')])
                    }

                    ancestor = ancestor.get('parent')
                }

                inst = Util.bxConstruct(Klass, opts)
            } else if (S.isPlainObject(opts)) {
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

                while (ancestor) {
                    overrides = ancestor.get('config')

                    if (overrides) {
                        S.mix(opts, overrides[el.attr('id')])
                        S.mix(opts, overrides[el.attr('name')])
                    }

                    ancestor = ancestor.get('parent')
                }
                inst = new Klass(opts)
            } else {
                inst = new Klass(opts)
            }

            inst.bxId = el.attr('id')
            inst.bxName = el.attr('bx-name')

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
                // 如果组件在实例化过程中被销毁了
                inst.once('destroy', bothFn)
            } else {
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

                function walk(node) {
                    var children = node.children()

                    for (var i = 0; i < children.length; i++) {
                        var child = children.item(i)

                        if (child.test(selector)) {
                            arr.push(child)
                        } else {
                            walk(child)
                        }
                    }
                }

            selector = selector || '[bx-name]'
            walk(root)

            return arr
        }
    }

    return exports

}, {
    requires: [
        'brix/tool/util',
        'node',
        'sizzle',
        'event'
    ]
});
KISSY.add('brix/core/bx-remote', function(S, Util, app, IO, Uri) {

    var exports = {

        bxHandleRemote: function(callback) {
            var self = this
            var el = self.get('el')
            var remote = el.attr('bx-remote')

            if (/^http/.test(remote)) {
                var uri = new Uri(remote)

                if (!uri.isSameOriginAs(new Uri(location.href)))
                    self.bxJsonpRemote(uri, callback)
            }
            else if (/^\.\//.test(remote)) {
                var name = self.bxName
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
                return callback(self.get('data'))
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

            IO.get(Util.bxResolveModule(mod, '.json'), callback)
        }
    }

    return exports
}, {
    requires: [
        'brix/tool/util',
        'brix/app/config',
        'ajax',
        'uri'
    ]
});
KISSY.add('brix/core/bx-tpl', function(S, Util, app, IO) {

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
            // The mod value shall be something like `mosaics/dropdown/tpl'
            if (app.config('debug')) {
                // In debug mode, we use XHR to get the template file.
                this.bxXhrTpl(mod, callback)
            }
            else {
                // In production mode, XHR is futile because the origin tpl.html
                // file will quite prossibly be different that the original server.
                //
                // We use KISSY.use to workaround this.
                //
                // bx-remote has the same strategy. So to avoid name collision.
                // We named the wrapped template js file with an affix `.tpl`.
                S.use(mod + '.tpl', function(S, tpl) {
                    callback(tpl)
                })
            }
        },

        bxXhrTpl: function(mod, callback) {
            if (!/^http/.test(location.href)) {
                throw Error('Cannot load tpl via xhr in current mode.')
            }

            IO.get(Util.bxResolveModule(mod, '.html'), callback)
        }
    }

    return exports
}, {
    requires: [
        'brix/tool/util',
        'brix/app/config',
        'ajax',
        'node',
        'sizzle'
    ]
});
KISSY.add('brix/core/bx-watcher', function(S, JSON) {
    var memo = {};

    function parse(expression) {
        var fn = memo[expression]

        if (!fn) {
            /*jshint -W054 */

            //fn = memo[expression] = new Function('context', 'locals', 'with(context){ return ' + expression + '; }')
            fn = memo[expression] = new Function('context', 'locals', 'with(context){if(typeof ' + expression + ' ==="undefined"){return}else{return ' + expression + '}}')
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
    var Watcher = {
        watch: function(context, expression, callback) {
            var watcher
            var watchers = this.get('watchers');

            var value = typeof expression === 'function' ? function() {
                    return expression(context)
                } : parse(expression);

            var last = value(context)

            if (S.isArray(last) || S.isObject(last)) {
                last = JSON.stringify(last)
            }
            watcher = {
                value: value,
                context: context,
                last: last,
                callback: callback,
                expression: expression
            };
            watchers.push(watcher)

            return unwatch(watcher, watchers)
        },
        digest: function() {
            //临时状态标识
            if (this.bxWatcherChecking) {
                throw new Error('Digest phase is already started')
            }
            this.bxWatcherChecking = true
            var clean, index, length, watcher, value, iterations = 10
            var watchers = this.get('watchers');
            do {
                clean = true
                index = -1
                length = watchers.length

                while (++index < length) {
                    watcher = watchers[index]
                    value = watcher.value(watcher.context)
                    var last = value
                    //是否object或者array的标识
                    var flg = false
                    if (S.isArray(last) || S.isObject(last)) {
                        last = JSON.stringify(last)
                        flg = true;
                    }
                    if (last !== watcher.last) {
                        //watcher.callback(value, watcher.last)
                        watcher.callback(value)
                        watcher.last = last
                        clean = false
                    }
                }
            } while (!clean && iterations--)

            if (!iterations) {
                throw new Error('Too much iterations per digest');
            }

            delete this.bxWatcherChecking;
        },
        parse: parse
    }

    Watcher.ATTRS = {
        watchers: {
            value: []
        }
    }
    return Watcher
}, {
    requires: ['json']
});;
KISSY.add('brix/interface/index', function(S) {
    //var KEYS = ['name', 'tpl', 'subtpl', 'datakey', 'tag', 'remote', 'config', 'app']

    var exports = {}

    exports.METHODS = {
        bxIBuildTpl: function() {
            var self = this
            var tpl = self.get('tpl')
            //临时存储监听的数据key
            self.bxWatcherKeys = {}
            //延迟刷新存储的key
            self.bxRefreshKeys = []
            var tempTpl
            if (tpl) {
                tpl = self.bxITag(tpl)
                tpl = self.bxISubTpl(tpl)
                //存储模板
                self.bxIBuildStoreTpls(tpl)
                self.set('tpl', tpl)
                tempTpl = self.bxIBuildBrickTpls(tpl)


            } else {
                var brickTpl = self.get('brickTpl')
                if (brickTpl) {
                    tempTpl = self.bxIBuildBrickTpls(brickTpl)
                }
            }
            if (tempTpl) {
                self.bxISelfCloseTag(tempTpl)
                self.bxIBuildSubTpls(tempTpl)
            }

            //删除临时监听
            delete self.bxWatcherKeys
        },

        bxIActivate: function() {
            var self = this
            var needRenderCounter = 0
            var needActivateCounter = 0

            // 局部刷新事件监听
            self.on('beforeRefreshTpl', function(e) {
                //S.log('beforeRefreshTpl_'+needRenderCounter)
                needRenderCounter++
                needActivateCounter++
                //debugger
                
                if (e.renderType === 'html') {
                    var children = self.bxDirectChildren(e.node)

                    for (var i = 0; i < children.length; i++) {
                        var brick = self.find('#' + children[i].attr('id'))
                        //这个组件如果没有触发rendered和ready事件，移除会有问题
                        if (brick) brick.destroy()
                    }
                }
            })

            self.on('afterRefreshTpl', function(e) {
                //S.log('afterRefreshTpl_xx')
                self.bxHandleName(
                    e.node, function renderedCheck() {
                        //debugger
                        //S.log('afterRefreshTpl_'+needRenderCounter)
                        if (--needRenderCounter === 0) {
                            self.setInternal('rendered', true)
                            self.fire('rendered')
                        }
                    }, function activatedCheck() {
                        if (--needActivateCounter === 0) {
                            self.setInternal('activated', true)
                            self.fire('ready')
                        }
                    })
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
         * 获取属性模板
         * @param  {String} str 模板
         * @return {Object}   存储对象
         * @private
         */
        bxIStoreAttrs: function(str) {
            var attrs = {}
            var storeAttr = function(all, attr, tpl) {
                if(tpl.indexOf('{{')>-1&&tpl.indexOf('}}')>0){
                    attrs[attr] = tpl
                }
            }
            str.replace(/([^\s]+)?=["']([^'"]+)["']/ig, storeAttr)
            return attrs;
        },
        /**
         * 添加数据监听
         * @param  {String} datakey 监听的key字符串"key1,key2"
         * @private
         */
        bxIAddWatch: function(datakey) {
            var self = this
            var data = self.get('data')

            var watch = function(key) {
                self.watch(data, key, function() {
                    if(!S.inArray(key,self.bxRefreshKeys)){
                        self.bxRefreshKeys.push(key)
                    }
                    //这个再看，不知道为什么，这个会引起ready事件的触发出错
                    if(self.bxLaterTimer){
                        self.bxLaterTimer.cancel();
                        delete self.bxLaterTimer
                    }
                    self.bxLaterTimer = S.later(function(){
                        //debugger
                        self.bxIRefreshTpl(self.bxRefreshKeys, self.get('data'), 'html')
                        self.bxRefreshKeys = [];
                    })
                    
                })
            }

            if (data) {
                var temparr = datakey.split(',')
                for (var i = 0; i < temparr.length; i++) {
                    var key = temparr[i]
                    if (!self.bxWatcherKeys[key]) {
                        self.bxWatcherKeys[key] = true;
                        watch(key);
                    }
                }
            }
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

            var r = '(<([\\w]+)\\s+[^>]*?bx-subtpl=["\']([^"\']+)["\']\\s+bx-datakey=["\']([^"\']+)["\']\\s*[^>]*?>)(@brix@)</\\2>'
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
                var datakey = m[4]
                subTpls.push({
                    name: m[3],
                    datakey: datakey,
                    tpl: m[5].replace(/@brix@(brix_tag_\d+)@brix@/ig, replacer),
                    attrs: self.bxIStoreAttrs(m[1])
                })
                self.bxIAddWatch(datakey)
                //递归编译子模板
                self.bxIBuildSubTpls(m[5])
            }
            // var bxEvents = self.get('bx-events')
            // //获取模板中bx-type的对象
            // var rrr = /bx\-([^=]+)=["\']([^"\'\s]+)["\']/ig
            // tpl.replace(rrr, function(all, type, fn) {
            //     if (!S.inArray(type, KEYS)) {
            //         bxEvents[fn] = bxEvents[fn] || []
            //         bxEvents[fn].push(type)
            //     }
            //     return all
            // })
        },
        /**
         * 子闭合标间的处理
         * @param  {String} tpl 模板
         */
        bxISelfCloseTag: function(tpl) {
            var self = this
            var subTpls = self.get('subTpls')

            var r = '(<(input|img)\\s+[^>]*?bx-subtpl=["\']([^"\']+)["\']\\s+bx-datakey=["\']([^"\']+)["\']\\s*[^>]*?/?>)'
            var reg = new RegExp(r, "ig")
            var m
            while ((m = reg.exec(tpl)) !== null) {
                var datakey = m[4]
                subTpls.push({
                    name: m[3],
                    datakey: datakey,
                    attrs: self.bxIStoreAttrs(m[1])
                })
                self.bxIAddWatch(datakey)
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
                    return S.trim(str) //修复编辑器格式化造成的问题
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
                        // var newData = {}
                        // S.each(datakeys, function(item) {
                        //     var tempdata = data,
                        //         temparr = item.split('.'),
                        //         length = temparr.length,
                        //         i = 0
                        //     while (i !== length) {
                        //         tempdata = tempdata[temparr[i]]
                        //         i++
                        //     }
                        //     newData[temparr[length - 1]] = tempdata
                        //     tempdata = null
                        // })
                        // S.each(data, function(d, k) {
                        //     if (S.isFunction(d)) {
                        //         newData[k] = d
                        //     }
                        // })

                        if (o.tpl) {
                            self.fire('beforeRefreshTpl', {
                                node: node,
                                renderType: renderType
                            })

                            //重新设置局部内容

                            if (renderType == 'html') {
                                node.empty();
                            }
                            node[renderType](S.trim(self.bxRenderTpl(o.tpl, data)))

                            /**
                             * @event afterRefreshTpl
                             * 局部刷新后触发
                             * @param {KISSY.Event.CustomEventObject} e
                             */
                            self.fire('afterRefreshTpl', {
                                node: node,
                                renderType: renderType
                            })
                        }

                        S.each(o.attrs, function(v, k) {
                            var val = S.trim(self.bxRenderTpl(v, data))
                            if (node[0].tagName.toUpperCase == 'INPUT' && k == "value") {
                                node.val(val)
                            } else {
                                node.attr(k, val)
                            }
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
        // ,
        // /**
        //  * 存储dom中bx-type的事件对象
        //  */
        // 'bx-events': {
        //     value: {}
        // }
    }

    return exports
});
;
KISSY.add('brix/tool/util', function(S, app) {
    return {
        /**
         * 动态传参数实例类
         * @param  {Function} constructor 需要实例化的类
         * @param  {Array} args        参数数组
         * @return {Object}             类的实例
         */
        bxConstruct: function(constructor, args) {
            function F() {
                return constructor.apply(this, args);
            }
            F.prototype = constructor.prototype;
            return new F();
        },
        /**
         * 给el节点设置唯一的id
         * @param  {String|Node} el 节点
         * @return {String}    id
         */
        bxUniqueId: function(el) {
            if (S.isString(el)) {
                el = S.one(el)
            }
            if (!el.attr('id')) {
                var id

                // 判断页面id是否存在，如果存在继续随机。
                while ((id = S.guid('brix-brick-')) && S.one('#' + id)) {}

                el.attr('id', id)
            }

            return el.attr('id')
        },
        /**
         * 合并数组参数
         * @param  {Array} receiver 参数数组
         * @param  {Array} supplier 配置的参数数组
         */
        bxMixArgument: function(receiver, supplier) {
            if (supplier) {
                S.each(supplier, function(o, i) {
                    if (o !== null) {
                        if (S.isPlainObject(o)) {
                            receiver[i] = receiver[i] || {}
                            S.mix(receiver[i], o)
                        } else {
                            receiver[i] = o;
                        }
                    }
                })
            }
        },
        bxResolveModule: function(mod, ext) {
            var parts = mod.split('/')
            var ns = parts.shift()
            var name = parts.shift()
            var file = parts.shift()
            var base = S.config('packages')[ns].base

            var components = app.config('components')
            var imports = app.config('imports')

            var pkgs = S.config('packages')
            var pkgsIgnore = pkgs[ns] && pkgs[ns].ignorePackageNameInUri

            if (!pkgsIgnore) parts.push(ns)

            parts.push(name)

            if (imports && imports[ns]) {
                parts.push(imports[ns][name])
            } else if (components && S.isPlainObject(components[ns])) {
                parts.push(components[ns][name])
            }

            parts.push(file + ext)

            return base + parts.join('/')
        }
    }
}, {
    requires: ['brix/app/config', 'node']
});
