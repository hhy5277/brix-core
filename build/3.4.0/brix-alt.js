/**
 * Brix Core v3.4.0
 * 
 * http://github.com/thx/brix-core
 */
KISSY.add('brix/app', function(S, appShadow, bxApi, bxThird) {

    var app = {
        bootStyle: function(fn) {
            var styles = this.bxComboStyle().join(',')

            if (S.importStyle)
                S.importStyle(styles, fn)
            else
                S.use(styles, fn)
        },

        bxChildren: []
    }

    S.mix(app, appShadow)
    S.mix(app, bxApi)
    S.mix(app, bxThird)

    S.mix(app, {
        // Shims for compliance with 3.0.x brix/app. They are used in
        // ux.lego related modules. But these two methods shall be
        // removed eventually. Hence they shall be deprecated for now.
        //
        // DEPRECATED
        set: function(p, v) {
            return app.config(p, v)
        },

        // DEPRECATED
        get: function(p) {
            return app.config(p)
        }
    })

    return app
}, {
    requires: [
        'brix/app/shadow',
        'brix/core/bx-api',
        'brix/core/bx-third',
        'brix/third/index',//这里的两个依赖必须存在
        'brix/base'
    ]
});
// The module serve as the shadow of brix/app
// brix/app requires modules like brix/core/bx-util, which in return might
// require functionalities of brix/app. For trespassing circular dependencies,
// here's this shadow module.
KISSY.add('brix/app/shadow', function(S) {

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
            imports: {},

            importsBase: 'http://g.tbcdn.cn/thx/m',

            components: null,

            family: '',

            base: '.'
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
            var family

            // components 可能的值：
            //
            // - 字符串，即当前项目的命名空间
            // - {} ，用于配置详细组件信息（用于版本处理，组件样式加载等）
            //
            if (S.isString(components)) {
                family = components
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
                for (family in components) {}
                var bricks = components[family]

                if (S.isPlainObject(bricks)) {
                    for (var name in bricks) {
                        bricks[name] = new Declaration(bricks[name])
                    }
                }
            }

            this.config('family', family)

            this.bxPackageComponents()
            this.bxMapComponents()
        },

        bxPackageComponents: function() {
            var family = this.config('family')

            // 如果已经定义过了，就不要覆盖
            if (S.config('packages')[family]) return

            var base = this.config('base')
            var ignoreNs = S.config('ignorePackageNameInUri')
            var obj = {}

            obj[family] = {
                base: base + (ignoreNs ? '/' + family : '')
            }

            S.config('packages', obj)
        },

        bxResolveImports: function() {
            var imports = this.config('imports')

            for (var family in imports) {
                var bricks = imports[family]

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
            var components = this.config('components')

            if (S.isPlainObject(components)) {
                this.bxMapModules(components)
            }
        },

        bxMapModules: function(lock) {
            function makeReplacer(family) {
                return function(match, name, file) {
                    return [family, name, lock[family][name], file].join('/')
                }
            }
            var maps = []

            for (var family in lock) {
                maps.push([new RegExp(family + '\\/([^\\/]+)\\/([^\\/]+)$'), makeReplacer(family)])
            }

            S.config('map', maps)
        },

        bxPackageImports: function() {
            var imports = this.config('imports')

            var importsBase = this.config('importsBase')

            var ignoreNs = S.config('ignorePackageNameInUri')
            var packagesWas = S.config('packages')
            var packages = {}

            for (var p in imports) {
                if (!packagesWas[p]) {
                    // if not configured before.
                    // more info about group configuration:
                    // http://docs.kissyui.com/docs/html/tutorials/kissy/seed/loader/group.html#loader-group-tutorial
                    packages[p] = {
                        base: importsBase + (ignoreNs ? '/' + p : ''),
                        group: 'bx-imports',
                        combine: true
                    }
                }
            }

            S.config('packages', packages)
        },

        bxComboStyle: function() {
            var imports = this.config('imports') || {}
            var styles = []

            var checkStyle = function(family, bricks) {
                for (var name in bricks) {
                    if (bricks[name].requires('css')) {
                        styles.push([family, name, 'index.css'].join('/'))
                    }
                }
            }
            var family

            for (family in imports) {
                checkStyle(family, imports[family])
            }
            var components = this.config('components')

            family = this.config('family')

            if (components) components = components[family]

            if (S.isPlainObject(components)) {
                checkStyle(family, components)
            }
            else if (S.isArray(components)) {
                for (var i = 0; i < components.length; i++) {
                    styles.push([family, components[i], 'index.css'].join('/'))
                }
            }

            return styles
        }
    }

    return exports
});
KISSY.add("brix/base",
    function(S, Interface, Core, Promise, Base, XTemplate, DOM) {
        var noop = S.noop
        var __getHook = Base.prototype.__getHook

        var DESTROY_ACTIONS = ['remove', 'empty']

        var Brick = Base.extend({
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
                    if (tpl) {
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
                        if (tpl)
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
                if (this.bxIBuildTpl) this.bxIBuildTpl()
            },

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

                if (this.bxIBuildData) this.bxIBuildData()
            },

            /**
             * 将模板渲染到页面
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
                var TplEngine = self.get('TplEngine')

                // 根据模板引擎，选择渲染方式
                if (typeof TplEngine === 'function') {
                    var commands = self.get('commands')

                    return new TplEngine(tpl, {
                        commands: commands || {}
                    }).render(data)
                } else {
                    return TplEngine.render(tpl, data)
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
             * @return {[type]} [description]
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
            name:'Brick',
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
                TplEngine: {
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
            'node',
            // 1.4 版本开始不再有 sizzle，自动 shim 低版本浏览器中复杂选择器的支持
            parseFloat(KISSY.version.split('.').slice(0, 2).join('.')) < 1.4 ? 'sizzle' : ''
        ]
    });
KISSY.add('brix/core/bx-api', function() {
    var exports = {
        boot: function(el, data) {
            return this.bxBoot(el, data)
        },

        prepare: function(el, data) {
            return this.bxPrepare(el, data)
        },
        /**
         * 递归查找当前组件下的子组件
         * @param  {String} selector 选择器，目前支持id和bx-name
         * @return {Brick}
         */
        one: function(selector) {
            return this.bxOne(selector)
        },
        /**
         * 查找当前组件下的子组件
         * @param  {Object} opts 查找条件，name和selector只能任选其一
         * @param  {String} opts.name 组件名称bx-name
         * @param  {String} opts.selector el节点选择器
         * @return {Array}  符合过滤条件的实例数组
         */
        all: function(selector) {
            return this.bxAll(selector);
        },
        /**
         * 查找当前组件下的子组件
         * @param  {String} selector 选择器，目前支持id和bx-name
         * @return {Brick}
         */
        find: function(selector) {
            return this.bxFind(selector)
        },
        /**
         * 查找当前组件下的子组件
         * @param  {String} selector 选择器，目前支持id和bx-name
         * @return {Array}  符合过滤条件的实例数组
         */
        where: function(selector) {
            return this.bxWhere(selector)
        }
    }
    return exports
});
KISSY.add('brix/core/bx-boot', function(S, Promise, DOM) {
    var THIRDBASE = 'brix/third/index'
    var exports = {
        /**
         * 处理boot参数
         * @param  {Node}   el      节点
         * @param  {Object} data 传入数据
         * @return {Object|Array|String|Boolean|Number}  处理完后的类的参数
         */
        bxBootOptions: function(el, data) {
            var self = this
            var options
            if (S.isPlainObject(el)) {
                data = null
                options = el
            } else {
                options = {
                    el: el
                }
                if (data) {
                    options.data = data
                }
            }
            el = S.one(options.el || '[bx-app]')
            var config = self.bxHandleConfig(el)

            var ancestor = self.bxGetBrickAncestor()
            var overrides
            if (S.isArray(config)) {
                while (ancestor) {
                    overrides = ancestor.get('config')

                    if (overrides) {
                        self.bxMixArgument(config, overrides[el.attr('id')])
                        self.bxMixArgument(config, overrides[el.attr('name')])
                    }

                    ancestor = ancestor.bxParent && ancestor.bxParent.bxGetBrickAncestor()
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

                    ancestor = ancestor.bxParent && ancestor.bxParent.bxGetBrickAncestor()
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
            //是否从Brick继承
            var isExtendBrick = false
            var Third = S.require(THIRDBASE)

            if (!S.isFunction(Klass)) {
                if (!S.isPlainObject(Klass)) {
                    //保留原始值bxKlass
                    Klass = {
                        bxKlass: Klass
                    }
                }
                inst = Klass
                S.mix(inst, Third)
            } else {
                if (!self.bxIsExtendBrickClass(Klass)) {
                    S.augment(Klass, Third)
                } else {
                    isExtendBrick = true
                }
                if (S.isArray(options)) {
                    inst = self.bxConstruct(Klass, options);
                } else {
                    inst = new Klass(options)
                }
            }

            inst.bxId = el.attr('id')
            inst.bxName = el.attr('bx-name')
            inst.bxChildren = []
            inst.bxParent = self;

            var tag = el.attr('bx-tag')
            var bxBrickTpls = self.bxBrickTpls;
            if (bxBrickTpls && bxBrickTpls[tag]) {
                inst.bxBrickTpl = bxBrickTpls[tag].middle
            }

            self.bxChildren.push(inst)


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
    requires: ['promise', 'dom']
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
});
KISSY.add('brix/core/bx-event', function(S, Event) {
    var unSupportBubbleEvents = ['submit', 'change', 'valuechange']
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
            var fn
            self.bxUnBubbleEvents = {}

            // function wrapFn(fnc) {
            //     return function() {
            //         var obj = self.bxGetAncestorWithData()
            //         var ancestor
            //         if (obj.data) {
            //             //增加brixData，方便外部直接获取
            //             ancestor = obj.ancestor
            //             arguments[0].brixData = ancestor.bxData
                        
            //         } else {
            //             ancestor = self;
            //         }
            //         var ret = fnc.apply(this, arguments)
            //         if (ret !== false) {
            //             ancestor.digest()
            //         }

            //     }
            // }

            for (var sel in eventsMap) {
                var events = eventsMap[sel]
                for (var type in events) {
                    fn = events[type]
                    // fnc.handle = wrapFn(fnc)

                    // fn = fnc.handle

                    if (sel === 'self') {
                        el.on(type, fn, this)
                    } else if (sel === 'window') {
                        Event.on(window, type, fn, this)
                    } else if (sel === 'body') {
                        Event.on('body', type, fn, this)
                    } else if (sel === 'document') {
                        Event.on(document, type, fn, this)
                    } else {
                        if (S.inArray(type, unSupportBubbleEvents)) {
                            //将不冒泡事件做记录
                            self.bxUnBubbleEvents[sel] = self.bxUnBubbleEvents[sel] || []
                            self.bxUnBubbleEvents[sel].push({
                                type: type,
                                fn: fn
                            })
                            el.all(sel).on(type, fn, this)
                        } else {
                            el.delegate(type, sel, fn, this)
                        }

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
            var fn

            for (var sel in eventsMap) {
                var events = eventsMap[sel]
                for (var type in events) {
                    fn = events[type]

                    if (sel === 'self') {
                        el.detach(type, fn, this)
                    } else if (sel === 'window') {
                        Event.detach(window, type, fn, this)
                    } else if (sel === 'body') {
                        Event.detach('body', type, fn, this)
                    } else if (sel === 'document') {
                        Event.detach(document, type, fn, this)
                    } else {
                        if (S.inArray(type, unSupportBubbleEvents)) {
                            el.all(sel).detach(type, fn, this)
                        } else {
                            el.undelegate(type, sel, fn, this)
                        }
                    }

                    //fn = null;
                    //delete events[type].handle
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
        bxOne:function(selector){
            return this.bxIOne(selector, this.bxChildren || [], true)
        },
        bxIOne: function(selector, children, isRecursive) {
            if (selector.charAt(0) === '#') {
                selector = selector.substr(1)
            }
            for (var i = 0; i < children.length; i++) {
                var child = children[i]
                if (child.bxId === selector ||
                    child.bxName === selector) {
                    return child
                } else if (isRecursive) {
                    var result = this.bxIOne(selector, child.bxChildren || [], isRecursive)
                    if (result) {
                        return result
                    }
                }
            }
        },
        bxAll:function(selector){
            var result = []
            this.bxIAll(selector, this.bxChildren || [], result, true)
            return result;
        },
        bxIAll: function(selector, children, result, isRecursive) {
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
                    this.bxIAll(selector, child.bxChildren || [], result, isRecursive)
                }
            }
        },
        bxFind:function(selector){
             return this.bxIOne(selector, this.bxChildren || [])
        },
        bxWhere:function(selector){
            var result = []
            this.bxIAll(selector, this.bxChildren || [], result)
            return result;
        }
    }
    return exports
});
KISSY.add('brix/core/bx-name', function(S) {

    var exports = {
        bxHandleName: function(root, renderedFn, activatedFn) {
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
                    var brick = self.bxFind('#' + node.attr('id'))

                    if (brick) nodes.splice(i, 1)
                }
            }

            if (nodes.length === 0) {
                S.later(function() {
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
                if (++renderedCounter === total) renderedFn()
            }
            var activatedCheck = activatedFn && function() {
                    if (++activatedCounter === total) activatedFn()
                }

            for (var i = 0; i < total; i++) {
                var node = nodes[i]
                klasses[i] = self.bxBootName(node)
            }

            this.bxBootUse(klasses, function(Klasses) {
                for (var i = 0; i < Klasses.length; i++) {
                    var el = nodes[i]
                    // passive:开启被动模式，即渲染完毕之后不再自动 bxActivate ，而是等父组件来管理这一过程
                    var opts = self.bxBootOptions({
                        el: el,
                        passive: !activatedCheck
                    })
                    self.bxIBoot(el, opts, Klasses[i], renderedCheck, activatedCheck)
                }
            })
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

});
KISSY.add('brix/core/bx-remote', function(S, IO, Uri) {

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
                var family = mod.split('/')[0]
                var packages = S.config('packages')[family]

                if (packages.debug) {
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

            IO.get(this.bxResolveModule(mod, '.json'), callback)
        }
    }

    return exports
}, {
    requires: [
        'ajax',
        'uri'
    ]
});
KISSY.add('brix/core/bx-third', function(S, bxBoot, bxName, bxFind, bxUtil, bxConfig) {
    var exports = {}
    S.mix(exports, bxBoot)
    S.mix(exports, bxName)
    S.mix(exports, bxFind)
    S.mix(exports, bxUtil)
    S.mix(exports, bxConfig)
    return exports
}, {
    requires: ['brix/core/bx-boot', 'brix/core/bx-name', 'brix/core/bx-find', 'brix/core/bx-util', 'brix/core/bx-config']
});
KISSY.add('brix/core/bx-tpl', function(S, IO) {

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
                var subTpls = self.bxParent.get('subTplsCache')

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
            var family = mod.split('/')[0]
            var packages = S.config('packages')[family]

            // The mod value shall be something like `mosaics/dropdown/tpl'
            if (packages.debug) {
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

            IO.get(this.bxResolveModule(mod, '.html'), callback)
        }
    }

    return exports
}, {
    requires: [
        'ajax'
    ]
});
KISSY.add('brix/core/bx-util', function(S, app) {
    var BRICKBASE = 'brix/base'

    return {
        /**
         * 动态传参数实例类
         * @param  {Function} constructor 需要实例化的类
         * @param  {Array} args        参数数组
         * @return {Object}             类的实例
         */
        bxConstruct: function(constructor, args) {
            function F() {
                return constructor.apply(this, args)
            }
            F.prototype = constructor.prototype
            return new F()
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
        },
        /**
         * 获取实例的数据
         * @param  {Objcet} context 实例
         * @return {Object}          对象
         */
        bxGetAncestorWithData: function() {
            var context = this;
            var data
            var ancestor = context.bxGetBrickAncestor()
            while (ancestor) {
                if ((data = ancestor.get('data')) && data) {
                    break;
                }
                ancestor = ancestor.bxParent && ancestor.bxParent.bxGetBrickAncestor()
            }

            if (!data) {
                ancestor = context
            }
            return {
                data: data,
                ancestor: ancestor
            }
        },
        bxGetBrickAncestor: function() {
            var context = this
            while (context) {
                if (!context.bxIsBrickInstance()) {
                    context = context.bxParent
                } else {
                    return context
                }
            }
        },
        /**
         * 是否是Brick类的实例
         * @return {Boolean}
         */
        bxIsBrickInstance: function() {
            return this instanceof S.require(BRICKBASE)
        },
        /**
         * 是否继承Brick的类
         * @param  {Function} c 类
         * @return {Boolean}
         */
        bxIsExtendBrickClass: function(c) {
            var Brick = S.require(BRICKBASE)
            var t = c
            while(t){
               if (t == Brick) {
                    return true
                } 
                t = t.superclass && t.superclass.constructor
            }
            return false
        }
    }
}, {
    requires: ['brix/app/shadow']
});
KISSY.add('brix/core/index', function(S, bxApi, bxTpl, bxEvent, bxDelegate, bxRemote, bxThird) {
    var BRICKBASE = 'brix/base'
    var exports = {
        on: function() {
            var Brick = S.require(BRICKBASE)
            Brick.superclass.on.apply(this, arguments)
            return this;
        },
        /**
         * 扩展组件的事件触发，或通知到所有父组件
         * @param  {String}  type       要触发的自定义事件名称
         * @param  {Object}  eventData  要混入触发事件对象的数据对象
         */
        // 因为用到了 Brick 变量，所以从 core/bx-delegate 搬到这里，有更好的办法么？
        fire: function(eventType, eventData, context) {
            var Brick = S.require(BRICKBASE)
            var ret = Brick.superclass.fire.apply(this, arguments)

            //触发父组件的事件
            var parent = this.bxParent&&this.bxParent.bxGetBrickAncestor()

            if (parent) {
                context = context || this;
                if (context === this) {
                    var eventTypeId = '#' + context.bxId + '_' + eventType
                    var eventTypeName = context.bxName + '_' + eventType

                    parent.fire(eventTypeId, eventData, context)
                    parent.fire(eventTypeName, eventData, context)
                } else {
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
                return fn.apply(this, arguments)
            }

            self.on(eventType, wrap, context)

            return self
        },
        bxDestroy: function() {
            this.destroy()
        }
    }
    S.mix(exports, bxApi)
    S.mix(exports, bxTpl)
    S.mix(exports, bxEvent)
    S.mix(exports, bxDelegate)
    S.mix(exports, bxRemote)
    S.mix(exports, bxThird)

    return exports
}, {
    requires: ['brix/core/bx-api', 'brix/core/bx-tpl', 'brix/core/bx-event', 'brix/core/bx-delegate', 'brix/core/bx-remote', 'brix/core/bx-third']
});
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
;
KISSY.add('brix/third/index', function(S, bxThird) {

    var Third = {
        bxInit: function(renderedFn, activatedFn) {
            var self = this

            if (renderedFn) {
                self.bxListenRendered(renderedFn)
            }
            if (activatedFn) {
                self.bxListenReady(activatedFn)
            }
            S.later(function() {
                self.bxRender()
            })
        },
        bxRender: function() {
            var self = this

            if (self.bxRendering || self.bxRendered) {
                return
            }
            self.bxRendering = true

            var el = self.bxEl

            // 初始化子组件
            self.bxHandleName(el, function() {
                delete self.bxRendering;
                self.bxRendered = true
                self.bxFireRendered()
            })
        },
        bxActivate: function() {
            var self = this
            if (self.bxActivating ||
                self.bxActivated || // activated before,
                !self.bxRendered) { // or not rendered yet.
                return
            }
            self.bxActivating = true;
            var children = self.bxChildren

            if (children.length === 0) {
                S.later(function() {
                    activated()
                }, 0)
                return
            }
            var total = children.length
            var counter = 0;

            function activated() {
                delete self.bxActivating;
                self.bxActivated = true
                self.bxFireReady()
            }

            function check() {
                if (++counter === total) activated()
            }

            for (var i = 0; i < children.length; i++) {
                var child = children[i]
                if (!child.bxIsBrickInstance()) {
                    check()
                } else {
                    child.once('ready', check)
                    child.once('destroy', check)
                    child.bxActivate()
                }
            }
        },
        bxListenReady: function(fn) {
            this.bxReadyFn = fn;
        },
        bxListenRendered: function(fn) {
            this.bxRenderedFn = fn;
        },
        bxFireRendered: function() {
            if (this.bxRenderedFn) {
                this.bxRenderedFn();
                delete this.bxRenderedFn
            }
        },
        bxFireReady: function() {
            if (this.bxReadyFn) {
                this.bxReadyFn();
                delete this.bxReadyFn;
            }
        },
        bxDestroy: function() {
            var self = this

            //需要销毁子组件
            var children = self.bxChildren
            var i
            for (i = children.length - 1; i >= 0; i--) {
                children[i].bxDestroy()
            }
            self.bxChildren = [];

            delete self.bxEl;

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
            self.bxFireRendered();
            self.bxFireReady();
            if (self.destroy) {
                self.destroy()
            }
        }
    }

    S.mix(Third, bxThird)

    return Third

}, {
    requires: ['brix/core/bx-third']
});
