KISSY.add("brix/core/brick", function(S, Promise, RichBase, XTemplate, Node, Event, UA, IO) {
    var $ = Node.all;
    var noop = S.noop;
    var Brick = RichBase.extend({
        initializer: function() {
            var self = this;
            var d = new Promise.Defer();
            var promise = d.promise;
            S.log('流程开始');
            promise.then(function(v) {
                S.log('获取模板');
                return self._bx_getTemplate(v);
            }).then(function(v) {
                S.log('编译模板');
                return self._bx_buildTemplate(v);
            }).then(function(v) {
                S.log('获取数据');
                return self._bx_getData(v);
            }).then(function(v) {
                S.log('编译数据');
                return self._bx_buildData(v);
            }).then(function(v) {
                S.log('渲染页面');
                if (self.get('autoRender')) {
                    return self.render();
                }
            }).then(function(v) {
                S.log('附加行为');
                if (self.get('autoBehavior')) {
                    return self.addBehavior();
                }
            }).then(function(v) {
                S.log('流程结束');
            });
            d.resolve(1);
        },
        bindUI: function() {
            var self = this;
            self._bx_bindEvent();
        },
        /**
         * 同步属性与用户界面
         * @protected
         * @method
         */
        syncUI: noop,
        /**
         * 获取模板
         */
        _bx_getTemplate: function() {
            var d = new Promise.Defer();
            var self = this;
            var tmpl = self.get('tmpl');
            if (tmpl) {
                return tmpl;
            }
            //开发者获取模板后，调用next方法
            //fn 留作扩展使用
            var fn = self.fire('getTemplate', {
                next: function(tmpl) {
                    self.set('tmpl', tmpl);
                    d.resolve(tmpl);
                }
            });

            return d.promise;
        },
        /**
         * 编译模板
         * @param  {String} tmpl 模板
         */
        _bx_buildTemplate: function(tmpl) {
            var self = this;
            if (tmpl) {
                //对模板的处理，比如子模板的提取，存储模板的提取
                return true;
            }
        },
        /**
         * 获取数据
         */
        _bx_getData: function() {
            var d = new Promise.Defer();
            var self = this;
            var data = self.get('data')
            if (data) {
                return true;
            }
            //开发者获取数据后，调用next方法
            //fn 留作扩展使用
            var fn = self.fire('getData', {
                next: function(data) {
                    self.set('data', data);
                    d.resolve(data);
                }
            });

            return d.promise;
        },
        /**
         * 编译数据
         * @param  {Objcet} data 数据
         */
        _bx_buildData: function(data) {
            var self = this;
            if (data) {
                return true;
            }
        },
        /**
         * 将模板渲染到页面
         */
        render: function() {
            var self = this;
            if (!self.get("rendered")) {
                /**
                 * @event beforeRenderUI
                 * fired when root node is ready
                 * @param {KISSY.Event.CustomEventObject} e
                 */

                self.fire('beforeRenderUI');

                self._bx_render();

                /**
                 * @event afterRenderUI
                 * fired after root node is rendered into dom
                 * @param {KISSY.Event.CustomEventObject} e
                 */
                self.fire('afterRenderUI');


                self.setInternal("rendered", true);

                /**
                 * @event beforeBindUI
                 * fired before component 's internal event is bind.
                 * @param {KISSY.Event.CustomEventObject} e
                 */

                self.fire('beforeBindUI');
                Brick.superclass.bindInternal.call(self);
                self.callMethodByHierarchy("bindUI", "__bindUI");

                //兼容老的brix render后的初始化函数
                //self.callMethodByHierarchy("initialize", "constructor");

                /**
                 * @event afterBindUI
                 * fired when component 's internal event is bind.
                 * @param {KISSY.Event.CustomEventObject} e
                 */

                self.fire('afterBindUI');

                /**
                 * @event beforeSyncUI
                 * fired before component 's internal state is synchronized.
                 * @param {KISSY.Event.CustomEventObject} e
                 */

                self.fire('beforeSyncUI');

                Brick.superclass.syncInternal.call(self);
                self.callMethodByHierarchy("syncUI", "__syncUI");

                /**
                 * @event afterSyncUI
                 * fired after component 's internal state is synchronized.
                 * @param {KISSY.Event.CustomEventObject} e
                 */

                self.fire('afterSyncUI');

            }
            return self;
        },
        /**
         * 将模板渲染到页面
         * @private
         */
        _bx_render: function() {
            var self = this;
            var tmpl = self.get('tmpl');
            if (tmpl) {
                var el = self.get('el');
                var html = S.trim(self._bx_renderTemplate(tmpl, self.get('data')));
                if (el) {
                    el.html(html);
                } else {
                    self.get('container').html(html);
                }
            }
            return true;
        },
        /**
         * 局部刷新
         * @param  {String} subTmplName 子模板名称或id，这个待定
         * @param  {Object} data 数据
         * @private
         */
        _bx_refreshTmpl: function(subTmplName, data) {

            self.fire('beforeRefreshTmpl', {
                node: node,
                renderType: renderType
            });

            //重新设置局部内容
            /*
            var renderType = self.get('renderType') || 'html';
            var subTmpl = '';//获取子模板
            var node = false;//获取子模板的节点
            node[renderType](S.trim(self._bx_renderTemplate(subTmpl, data)))
            
            */

            /**
             * @event afterRefreshTmpl
             * 局部刷新后触发
             * @param {KISSY.Event.CustomEventObject} e
             */
            self.fire('afterRefreshTmpl', {
                node: node
            });

        },
        /**
         * 模板和数据渲染成字符串
         * @param  {Object} data 数据
         * @return {String} html片段
         */
        _bx_renderTemplate: function(tmpl, data) {
            var self = this;
            var templateEngine = self.get('templateEngine');
            //根据模板引擎，选择渲染方式
            if (typeof templateEngine === 'function') {
                return new templateEngine(tmpl).render(data);
            } else {
                return templateEngine.render(tmpl, data);
            }
        },
        /**
         * 给组件添加行为
         */
        addBehavior: function() {
            var self = this;
            if (self.get('rendered') && !self.get('addBehaviored')) {
                self.set('addBehaviored', true);
                //渲染
                self._bx_addBehavior();
            }
            return true;
        },
        /**
         * 给组件添加行为
         * @param {NodeList} brickNodes 组件node对象集合
         * @param {Function} fn 页面元素解析完成执行的方法,同步执行
         * @param {Function} callback 实例化完成后的回调事件，异步执行
         * @private
         */
        _bx_addBehavior: function(brickNodes, fn, callback) {
            //需要监听beforeRefreshTmpl和afterRefreshTmpl，以便对子模板中的组件重新渲染
        },
        /**
         * 绑定事件
         * @private
         */
        _bx_bindEvent: function() {
            var self = this;
            var constt = self.constructor;
            while (constt) {
                //代理在el上的事件
                var defaultEvents = constt.EVENTS;
                if (defaultEvents) {
                    this._bx_addEvents(defaultEvents);
                }
                constt = constt.superclass && constt.superclass.constructor;
            }


            //用户使用组件中的自定义事件代理
            var events = self.get("events");
            if (events) {
                this._bx_addEvents(events);
            }
        },
        /**
         * 添加事件代理绑定
         * @param  {Object} events 事件对象，参见EVENTS和DOCEVENTS属性
         * @param {Node} el 代理事件根节点
         * @private
         */
        _bx_addEvents: function(events) {
            var el = self.get('el');
            for (var selector in events) {
                var es = events[selector];
                for (var type in es) {
                    var callback = es[type];
                    /**
                     * 按选择器判断时间作用位置
                     * el:绑定事件在el上
                     * document:绑定事件在document上
                     * window:绑定事件在window上
                     * doc:事件代理在document上
                     * 其他:事件代理在el上
                     */
                    switch (selector) {
                        case 'el':
                            Event.on(el, type, callback, this);
                            break;
                        case 'document':
                            Event.on(document, type, callback, this);
                            break;
                        case 'window':
                            Event.on(window, type, callback, this);
                            break;
                        case 'doc':
                            Event.delegate(document, type, selector, callback, this);
                            break;
                        default:
                            Event.delegate(el, type, selector, callback, this);
                            break;
                    }
                }
            }
        },
        /**
         * 移除事件
         * @private
         */
        _bx_detachEvent: function() {
            var self = this;
            var constt = self.constructor;
            while (constt) {
                //代理在el上的事件
                var defaultEvents = constt.EVENTS;
                if (defaultEvents) {
                    this._bx_removeEvents(defaultEvents);
                }
                constt = constt.superclass && constt.superclass.constructor;
            }


            //用户使用组件中的自定义事件代理
            var events = self.get("events");
            if (events) {
                this._bx_removeEvents(events);
            }
        },
        /**
         * 移除事件代理
         * @param  {Object} events 事件对象，参见EVENTS和DOCEVENTS属性
         * @private
         */
        _bx_removeEvents: function(events) {
            var el = self.get('el');
            for (var selector in events) {
                var es = events[selector];
                for (var type in es) {
                    var callback = es[type];
                    /**
                     * 按选择器判断时间作用位置
                     * el:绑定事件在el上
                     * document:绑定事件在document上
                     * window:绑定事件在window上
                     * doc:事件代理在document上
                     * 其他:事件代理在el上
                     */
                    switch (selector) {
                        case 'el':
                            Event.detach(el, type, callback, this);
                            break;
                        case 'document':
                            Event.detach(document, type, callback, this);
                            break;
                        case 'window':
                            Event.detach(window, type, callback, this);
                            break;
                        case 'doc':
                            Event.undelegate(document, type, selector, callback, this);
                            break;
                        default:
                            Event.undelegate(el, type, selector, callback, this);
                            break;
                    }
                }
            }
        },
        /**
         * 销毁子组件
         * @private
         */
        _bx_destroyBrick: function() {
            o.set('destroyed', true);
            if (o.brick) {
                o.brick.destroy && o.brick.destroy();
                o.brick = null;
            }
        },
        /**
         * 析构函数，销毁资源
         * @return {[type]} [description]
         */
        destructor: function() {
            var self = this;
            //需要销毁子组件
            var bricks = self.get('bricks');
            S.each(bricks, function(o, i) {
                self._bx_destroyBrick(o);
            });
            bricks = null;
            self.set('bricks',bricks);
            if (self.get('rendered')) {
                self._bx_detachEvent();
                var action = self.get('destroyAction');
                var el = self.get('el');
                switch (action) {
                    case 'remove':
                        el.remove();
                        break;
                    case 'empty':
                        el.empty();
                        break;
                }
                el = null;
            }
            self.set('destroyed', true);
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
             * 容器节点
             * @cfg {String}
             */
            container: {
                value: 'body',
                getter: function(s) {
                    if (S.isString(s)) {
                        s = $(s);
                    }
                    return s;
                }
            },
            /**
             * 组件根节点
             * @cfg {Node}
             */
            el: {
                getter: function(s) {
                    if (S.isString(s)) {
                        s = $(s);
                    }
                    return s;
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
             * 增加pagelet对brick组件的配置增强,示例：{id:{xx:{},yy:{}}}
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
             * @type {Object}
             */
            events: {

            },
            /**
             * 存储所有子组件
             * @type {Array}
             */
            bricks: {
                value: []
            }
        }
    }, 'Brick');

    return Brick;
}, {
    requires: ['promise', 'rich-base', 'xtemplate', 'node', 'event', 'ua', 'ajax', 'sizzle']
});