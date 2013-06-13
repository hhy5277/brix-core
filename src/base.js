/*jshint asi:true */
KISSY.add("brix/base",
          function(S, bxTemplate, bxName, bxDelegate, bxConfig,
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
        bxBuildTemplate: function() {
            var self = this
            var tmpl = self.get('tmpl')
            var level = self.get('level')

            if (tmpl) {
                tmpl = self.bxBrickTag(tmpl)
                tmpl = self.bxTmplName(tmpl)
                //存储模板暂时不做
                //self.bxBuildStoreTmpls(tmpl)
                self.set('tmpl', tmpl)

                self.bxBuildSubTmpls(self.bxBuildBrickTmpl(tmpl), false, level)

                //对模板的处理，比如子模板的提取，存储模板的提取
                return true
            }
            else {
                var brickTmpl = self.get('brickTmpl')

                if (brickTmpl) {
                    self.bxBuildSubTmpls(self.bxBuildBrickTmpl(brickTmpl), false, level)
                }
            }

            return false
        },

        /**
         * 构建{{#bx-tmpl-id}}……{{/bx-tmpl}}的存储
         * @param  {String} tmpl 需要解析的模板
         * @return {String}      解析后的模板
         */
        bxBuildStoreTmpls: function(tmpl) {
            var self = this
            var storeTmpls = self.get('storeTmpls')
            var storeTmplRegexp = /\{\{#bx\-tmpl\-([^\}]*)?\}\}([\s\S]*?)\{\{\/bx\-tmpl\}\}/ig

            tmpl = tmpl.replace(storeTmplRegexp, function(g, id, html) {
                storeTmpls[id] = html
                return ''
            })
            return tmpl
        },

        /**
         * 为模板中的组件打上tag标识
         * @param  {String} tmpl 模板
         * @return {String}      替换后的模板
         */
        bxBrickTag: function(tmpl) {
            return tmpl.replace(/(bx-tag=["'][^"']+["'])/ig, '')
                    .replace(/(bx-name=["'][^"']+["'])/ig, function(match) {
                return match + ' bx-tag="brix_brick_tag_' + S.guid() + '"'
            })
        },

        /**
         * 为bx-datakey自动生成bx-tmpl
         * @param  {String} tmpl 模板
         * @return {String}      替换后的模板
         */
        bxTmplName: function(tmpl) {
            return tmpl.replace(/(bx-tmpl=["'][^"']+["'])/ig, '')
                    .replace(/(bx-datakey=["'][^"']+["'])/ig, function(match) {
                return 'bx-tmpl="brix_tmpl_' + S.guid() + '" ' + match
            })
        },

        bxBuildBrickTmpl: function(tmpl) {
            var self = this
            var r = '(<([\\w]+)\\s+[^>]*?bx-name=["\']([^"\']+)["\']\\s+bx-tag=["\']([^"\']+)["\']\\s*[^>]*?>)(@brix@)(</\\2>)'
            var brickTmpls = self.get('brickTmpls')
            var level = self.get('level')
            while (level--) {
                r = r.replace('@brix@', '(?:<\\2[^>]*>@brix@</\\2>|[\\s\\S])*?')
            }
            r = r.replace('@brix@', '(?:[\\s\\S]*?)')
            var reg = new RegExp(r, "ig")
            tmpl = tmpl.replace(reg, function(all, start, tag, name, bx, middle, end) {
                brickTmpls[bx] = {
                    start: start,
                    middle: middle,
                    end: end
                }
                //占位符
                return '@brix@' + bx + '@brix@'
            })
            return tmpl
        },

        /**
         * 对节点中的bx-tmpl和bx-datakey解析，构建模板和数据配置
         * @param {String} tmpl  需要解析的模板
         * @private
         */
        bxBuildSubTmpls: function(tmpl) {
            var self = this
            var subTmpls = self.get('subTmpls')
            var brickTmpls = self.get('brickTmpls')
            var level = self.get('level')

            var r = '(<([\\w]+)\\s+[^>]*?bx-tmpl=["\']([^"\']+)["\']\\s+bx-datakey=["\']([^"\']+)["\']\\s*[^>]*?>(@brix@)</\\2>)'
            while (level--) {
                r = r.replace('@brix@', '(?:<\\2[^>]*>@brix@</\\2>|[\\s\\S])*?')
            }
            r = r.replace('@brix@', '(?:[\\s\\S]*?)')
            var reg = new RegExp(r, "ig")
            var m
            while ((m = reg.exec(tmpl)) !== null) {
                subTmpls.push({
                    name: m[3],
                    datakey: m[4],
                    tmpl: m[5].replace(/@brix@(brix_brick_tag_\d+)@brix@/ig, function(all, bx) {
                        var o = brickTmpls[bx]

                        return o.start + o.middle + o.end
                    })
                })
                //递归编译子模板
                self.bxBuildSubTmpls(m[5])
            }
        },

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
         * 局部刷新
         * @param  {String} subTmplName 子模板名称或id，这个待定
         * @param  {Object} data 数据
         * @param  {String} renderType 渲染方式，目前支持html，append，prepend
         * @private
         */
        bxRefreshTmpl: function(keys, data, renderType) {
            var self = this

            if (!self.get('rendered')) {
                return
            }
            var el = self.get('el')
            var subTmpls = self.get('subTmpls')

            S.each(subTmpls, function(o) {
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
                    var nodes = el.all('[bx-tmpl=' + o.name + ']')

                    //如果el本身也是tmpl，则加上自己
                    if (el.attr('bx-tmpl') == o.name) {
                        nodes = el.add(nodes)
                    }
                    nodes.each(function(node) {
                        self.fire('beforeRefreshTmpl', {
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
                        nodes[renderType](S.trim(self.bxRenderTemplate(o.tmpl, newData)))

                        /**
                         * @event afterRefreshTmpl
                         * 局部刷新后触发
                         * @param {KISSY.Event.CustomEventObject} e
                         */
                        self.fire('afterRefreshTmpl', {
                            node: node
                        })
                    })
                }
            })


            var children = self.get('children')

            // 为什么要这样做？
            // 因为 bxRefreshTmpl 有可能会更改 children 数组的长度
            for (var i = 0; i < children.length; i++) {
                var child = children[i]

                while (!child && i >= 0) {
                    child = children[i]
                    i--
                }
                if (!child.get('refresh')) {
                    child.set('refresh', true)
                    if (!child.get('data')) {
                        child.bxRefreshTmpl(keys, data, renderType)
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

            // 局部刷新事件监听
            self.on('beforeRefreshTmpl', function(e) {
                if (e.renderType === 'html') {
                    var children = self.bxDirectChildren(e.node)

                    S.each(children, function(child) {
                        self.bxFind(child.attr('id')).destroy()
                    })
                    children = null
                    self.set('counter', self.get('children').length)
                }
            })

            self.on('afterRefreshTmpl', function(e) {
                self.bxHandleName(e.node)
            })

            self.on('enabled', function() {
                self.set('enabled', true)
            })

            var children = self.get('children')

            for (var i = 0; i < children.length; i++) {
                var child = children[i]

                child.on('enabled', function() {
                    self.fire('enabled')
                })
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
         * 构造子组件
         * @param {Array} bricks 组件集合
         * @param {Function} callback 子组件实例化完成后的回调
         * @private
         */
        bxInitChildren: function(bricks, callback) {
            var self = this
            self.set('isReady', false)

            if (bricks.length === 0) {
                self.bxFireReady(callback)
                return
            }
            var useList = []
            S.each(bricks, function(o) {
                var config = o.config
                //mix self&&parent的config
                var parent = self
                while (parent) {
                    var bxConfig = parent.get('config')
                    S.mix(config, bxConfig[o.id])
                    S.mix(config, bxConfig[o.name])
                    parent = parent.get('parent')
                }
                if (!S.inArray(useList, o.name) && !o.config.autoBrick) {
                    useList.push(o.name)
                }
            })
            //实例化子组件
            S.use(useList.join(','), function(S) {
                var useClassList = arguments
                //S.later(function() {
                if (self.get('destroyed')) {
                    return
                }
                var brickTmpls = self.get('brickTmpls')
                S.each(bricks, function(o) {
                    if (!o.destroyed) {
                        var config = S.merge({
                            //是否要将子模板和存储模板作为参数带入？
                            el: '#' + o.id,
                            brickTmpl: o.tag ? brickTmpls[o.tag].middle : false,
                            parent: self
                        }, o.config)
                        var BrickClass = useClassList[S.indexOf(o.name, useList) + 1]
                        var flg = false
                        var constt = BrickClass
                        var arr = []
                        arr.push(config.listeners || {})
                        config.listeners = {}
                        while (constt) {
                            //标识
                            if (constt.MARK == 'Brix') {
                                flg = true
                            }
                            var listeners = constt.ATTRS && constt.ATTRS.listeners && constt.ATTRS.listeners.value
                            if (listeners) {
                                arr.push(listeners)
                            }
                            constt = constt.superclass && constt.superclass.constructor
                        }
                        for (var i = arr.length - 1; i >= 0; i--) {
                            var listeners = arr[i]
                            for (var key in listeners) {
                                config.listeners[key] = listeners[key]
                            }
                        }
                        arr = null

                        config.listeners.ready = function() {
                            self.bxFireReady(callback)
                        }

                        o.brick = new BrickClass(config)
                        //不是继承brix的组件，直接触发ready
                        if (!flg) {
                            self.bxFireReady(callback)
                        }
                    }
                })
                bricks = null
                //}, 3000)
            })
        },


        /**
         * 析构函数，销毁资源
         * @return {[type]} [description]
         */
        destructor: function() {
            var self = this
            var el = self.get('el')

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
                var id = el.attr('id')

                for (i = siblings.length - 1; i >= 0; i--) {
                    if (siblings[i].get('id') === id) {
                        siblings.splice(i, 1)
                        break
                    }
                }
            }

            if (self.get('rendered')) {
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
            el = null
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
                //datakey = S.clone(datakey)
                for (var key in datakey) {
                    newData[key] = datakey[key]
                    keys.push(key)
                }
                opts = data
            }
            else {
                keys = [datakey]
                newData[datakey] = data
            }
            parent.set('data', newData)
            //根据传入的opts,设置renderType
            var renderType = 'html'
            if (opts) {
                if (opts.renderType) {
                    renderType = opts.renderType
                    ;delete opts.renderType
                }
            }

            self.bxRefreshTmpl(keys, newData, renderType)
        },

        /**
         * 触发ready添加的方法
         * @param {Function} callback 回调
         * @private
         */
        // bxFireReady: function(callback) {
        //     var self = this

        //     if (self.get('isReady')) {
        //         return
        //     }
        //     var bricks = self.get('bricks')
        //     var counter = self.get('counter')

        //     self.set('counter', ++counter)
        //     if (bricks.length === 0 || counter === bricks.length) {
        //         callback && callback.call(self)

        //         //所有子组件渲染完成，触发本身的ready事件
        //         self.fire('ready')

        //         //ready只触发一次
        //         self.detach('ready')

        //         self.set('isReady', true)
        //     }
        // },


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

    S.augment(Brick, bxTemplate, bxName, bxDelegate, bxConfig)

    /**
     * 静态方法集合
     */

    Brick.MARK = 'Brix'

    return Brick
}, {
    requires: [
        'brix/core/bx-template',
        'brix/core/bx-name',
        'brix/core/bx-delegate',
        'brix/core/bx-config',
        'promise',
        'rich-base',
        'xtemplate',
        'node',
        'event',
        'sizzle'
    ]
})