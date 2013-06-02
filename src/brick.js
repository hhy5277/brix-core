KISSY.add("brix/core/brick", function(S, Promise, RichBase, XTemplate, Node, Event, UA, IO, Uri) {
    var $ = Node.all;
    var noop = S.noop;
    var BRICKREGEXP = '(<([\\w]+)\\s+[^>]*?bx-name=["\']([^"\']+)["\']\\s+[^>]*?bx-tag=["\']([^"\']+)["\']\\s*[^>]*?>)(@brix@)(</\\2>)';
    //子模板主正则
    var SUBTMPLREGEXP = '<([\\w]+)\\s+[^>]*?bx-tmpl=["\']([^"\']+)["\']\\s+[^>]*?bx-datakey=["\']([^"\']+)["\']\\s*[^>]*?>(@brix@)</\\1>';
    //不解析模板存储正则
    var STORETMPLREGEXP = /\{\{#bx\-tmpl\-([^\}]*)?\}\}([\s\S]*?)\{\{\/bx\-tmpl\}\}/ig;
    /**
     * 用以给brick打上id的标记,brick有id则返回
     * @method _stamp
     * @param el
     * @return {string}
     * @ignore
     */

    function _stamp(el) {
        if (!el.attr('id')) {
            var id;
            //判断页面id是否存在，如果存在继续随机。
            while ((id = S.guid('brix_brick_')) && S.one('#' + id)) {}
            el.attr('id', id);
        }
        return el.attr('id');
    }

    function evalJSON(s) {
        if (s) {
            return (new Function('return ' + s))();
        } else {
            return {};
        }
    }
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
                    self.render();
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
        _bx_getTemplate: function() {
            var d = new Promise.Defer();
            var self = this;
            var tmpl = self.get('tmpl');
            if (tmpl) {
                return true;
            }
            //开发者获取模板后，调用next方法
            //fn 留作扩展使用
            var fn = self.fire('getTemplate', {
                next: function(tmpl) {
                    self.set('tmpl', tmpl);
                    d.resolve(true);
                }
            });
            if (!fn) {
                d.resolve(false);
            }

            return d.promise;
        },
        /**
         * 编译模板
         */
        _bx_buildTemplate: function(tmpl) {
            var self = this;
            var tmpl = self.get('tmpl')
            var level = self.get('level');
            if (tmpl) {
                tmpl = self._bx_brickTag(tmpl);
                tmpl = self._bx_tmplName(tmpl);

                self.set('tmpl', tmpl);

                self._bx_buildBrickTmpl(tmpl);
                //存储模板暂时不做
                //self._bx_buildStoreTmpls(tmpl);
                self._bx_buildSubTmpls(tmpl, false, level);
                
                //对模板的处理，比如子模板的提取，存储模板的提取
                return true;
            }
            else{
                var brickTmpl = self.get('brickTmpl');
                if(brickTmpl){
                    self._bx_buildBrickTmpl(brickTmpl);
                    self._bx_buildSubTmpls(brickTmpl, false, level);
                }
            }
            return false
        },
        /**
         * 构建{{#bx-tmpl-id}}……{{/bx-tmpl}}的存储
         * @param  {String} tmpl 需要解析的模板
         * @return {String}      解析后的模板
         */
        _bx_buildStoreTmpls: function(tmpl) {
            var self = this;
            storeTmpls = self.get('storeTmpls');
            tmpl = tmpl.replace(STORETMPLREGEXP, function(g, id, html) {
                storeTmpls[id] = html;
                return '';
            });
            return tmpl;
        },
        /**
         * 为模板中的组件打上tag标识
         * @param  {String} tmpl 模板
         * @return {String}      替换后的模板
         */
        _bx_brickTag:function(tmpl){
            return tmpl.replace(/(bx-tag=["'][^"']+["'])/ig,'')
                    .replace(/(bx-name=["'][^"']+["'])/ig,function($1){
                        return $1 + ' bx-tag="brix_brick_tag_'+S.guid()+'"';
                    });
        },
        /**
         * 为bx-datakey自动生成bx-tmpl
         * @param  {String} tmpl 模板
         * @return {String}      替换后的模板
         */
        _bx_tmplName:function(tmpl){
            return tmpl.replace(/(bx-tmpl=["'][^"']+["'])/ig,'')
                    .replace(/(bx-datakey=["'][^"']+["'])/ig,function($1){
                        return 'bx-tmpl="brix_tmpl_'+S.guid()+'" '+$1
                    });
        },
        _bx_buildBrickTmpl:function(tmpl){
            var self = this;
            var r = BRICKREGEXP;
            var brickTmpls = self.get('brickTmpls');
            var level = self.get('level');
            while (level--) {
                r = r.replace('@brix@', '(?:<\\2[^>]*>@brix@</\\2>|[\\s\\S])*?');
            }
            r = r.replace('@brix@', '(?:[\\s\\S]*?)');
            var reg = new RegExp(r, "ig");
            tmpl = tmpl.replace(reg,function($1,$2,$3,$4,$5,$6,$7,$8){   
                brickTmpls[$5] = $6;
                return '';
            });
            return tmpl;
        },
        /**
         * 对节点中的bx-tmpl和bx-datakey解析，构建模板和数据配置
         * @param {String} tmpl  需要解析的模板
         * @param {String} r 正则
         * @param {Number} level  嵌套层级
         * @private
         */
        _bx_buildSubTmpls: function(tmpl, r, level) {
            var self = this;
            var subTmpls = self.get('subTmpls');
            if (!r) {
                r = SUBTMPLREGEXP;
                while (level--) {
                    r = r.replace('@brix@', '(?:<\\1[^>]*>@brix@</\\1>|[\\s\\S])*?');
                }
                r = r.replace('@brix@', '(?:[\\s\\S]*?)');
            }
            var reg = new RegExp(r, "ig");
            var m;
            while ((m = reg.exec(tmpl)) !== null) {
                subTmpls.push({
                    name: m[2],
                    datakey: m[3],
                    tmpl: m[4]
                });
                //self._bx_buildSubTmpls(m[4], r);
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
                    d.resolve(true);
                }
            });
            if (!fn) {
                d.resolve(false);
            }
            return d.promise;
        },
        /**
         * 编译数据
         * @param  {Objcet} data 数据
         */
        _bx_buildData: function(data) {
            var self = this;
            var data = self.get('data')
            if (data) {
                return true;
            }
            else{
                if(self.get('tmpl')){
                    var parent = self;
                    var newData;
                    while(parent){
                        if(newData = parent.get('data')){
                            self.setInternal('data',newData);
                            break;
                        }
                        parent = parent.get('parent');
                    }
                }
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
                self.callMethodByHierarchy("initialize", "constructor");

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
                el.html(html);
            }
            return true;
        },
        /**
         * 局部刷新
         * @param  {String} subTmplName 子模板名称或id，这个待定
         * @param  {Object} data 数据
         * @private
         */
        _bx_refreshTmpl: function(keys, data) {
            var self = this;
            if (self.get('rendered')) {
                var el = self.get('el');
                var subTmpls = self.get('subTmpls');
                S.each(subTmpls, function(o) {
                    var datakeys = S.map(o.datakey.split(','), function(str) {
                        return S.trim(str); //修复编辑器格式化造成的问题
                    });
                    //是否包含的表示符
                    var flg = false;
                    for (var i = 0; i < datakeys.length; i++) {
                        for (var j = 0; j < keys.length; j++) {
                            if (datakeys[i] == keys[j]) {
                                flg = true;
                                break;
                            }
                        }
                    }
                    if (flg) {
                        var nodes = el.all('[bx-tmpl=' + o.name + ']');
                        //如果el本身也是tmpl，则加上自己
                        if (el.attr('bx-tmpl') == o.name) {
                            nodes = el.add(nodes);
                        }
                        nodes.each(function(node) {
                            self.fire('beforeRefreshTmpl', {
                                node: node,
                                renderType: renderType
                            });
                            var newData = {};
                            S.each(datakeys, function(item) {
                                var tempdata = data,
                                    temparr = item.split('.'),
                                    length = temparr.length,
                                    i = 0;
                                while (i !== length) {
                                    tempdata = tempdata[temparr[i]];
                                    i++;
                                }
                                newData[temparr[length - 1]] = tempdata;
                                tempdata = null;
                            });
                            S.each(data, function(d, k) {
                                if (S.isFunction(d)) {
                                    newData[k] = d;
                                }
                            });

                            //重新设置局部内容

                            var renderType = self.get('renderType') || 'html';
                            nodes[renderType](S.trim(self._bx_renderTemplate(o.tmpl, newData)));

                            /**
                             * @event afterRefreshTmpl
                             * 局部刷新后触发
                             * @param {KISSY.Event.CustomEventObject} e
                             */
                            self.fire('afterRefreshTmpl', {
                                node: node
                            });
                        });
                    }
                });
            }

        },
        /**
         * 模板和数据渲染成字符串
         * @param  {Object} data 数据
         * @return {String} html片段
         * @private
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
         * 获取指定节点下的所有bx-name
         * @param  {Node} node   指定节点
         * @param  {Array} bricks 存储节点数组
         * @return {Array}        数组集合
         * @private
         */
        _bx_findChildren: function(node, bricks) {
            var self = this;
            var children = node.children();
            children.each(function(c) {
                if (c.hasAttr('bx-name')) {
                    if(c.attr('bx-behavior') != 'true'){
                        var id = _stamp(c);
                        var name = c.attr('bx-name');
                        var tag = c.attr('bx-tag'); 
                        bricks.push({
                            id: id,
                            tag:tag,
                            name: name,
                            config: evalJSON(c.attr('bx-config'))
                        });
                        c.attr('bx-behavior','true')
                    }
                    
                } else {
                    return self._bx_findChildren(c, bricks);
                }
            });
            return bricks;
        },
        /**
         * 给组件添加行为
         */
        addBehavior: function() {
            var self = this;
            if (self.get('rendered') && !self.get('addBehaviored')) {
                self.set('addBehaviored', true);
                //绑定事件
                self._bx_bindEvent();
                var bricks = self.get('bricks');
                bricks = self._bx_findChildren(self.get('el'), bricks);
                //其他行为
                self._bx_addBehavior(bricks, function(bricks) {
                    self.set('bricks', bricks);
                }, function() {
                    //需要重写这两块的逻辑，保证组件的父子关系
                    self.on('beforeRefreshTmpl', function(e) {
                        if (e.renderType === 'html') {
                            var bricks = self._bx_findChildren(e.node,[]);
                            S.each(bricks,function(b){
                                self.destroyBrick(b.id);
                            });
                        }
                    });
                    self.on('afterRefreshTmpl', function(e) {
                        var bricks = self._bx_findChildren(e.node,[]);
                        //这里的处理比较麻烦
                        self._bx_addBehavior(bricks, function(newBricks) {
                            var bricks = self.get('bricks');
                            self.set('bricks',bricks.concat(newBricks));
                        }, function() {
                            self._bx_fireReady();
                        });
                    });
                    self._bx_fireReady();
                });
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
        _bx_addBehavior: function(bricks, fn, callback) {
            //需要监听beforeRefreshTmpl和afterRefreshTmpl，以便对子模板中的组件重新渲染
            var self = this;
            self.set('isReady',false);
            fn && fn(bricks);
            if (bricks.length > 0) {
                var useList = [];
                S.each(bricks, function(o) {
                    o.behavior = true;
                    var config = o.config;
                    //mix self&&parent的config
                    var parent = self;
                    while (parent) {
                        var bxConfig = parent.get('config');
                        S.mix(config, bxConfig[o.id]);
                        S.mix(config, bxConfig[o.name]);
                        parent = parent.get('parent');
                    }
                    if (!S.inArray(useList, o.name) && !o.config.autoBrick) {
                        useList.push(o.name);
                    }
                });
                //实例化子组件
                S.use(useList.join(','), function(S) {
                    if (self.get('destroyed')) {
                        return;
                    }
                    var useClassList = arguments;
                    var brickTmpls = self.get('brickTmpls');
                    S.each(bricks, function(o) {
                        var config = S.merge({
                            //是否要将子模板和存储模板作为参数带入？
                            el: '#' + o.id,
                            brickTmpl:brickTmpls[o.tag],
                            parent: self
                        }, o.config);
                        o.brick = new useClassList[S.indexOf(o.name, useList) + 1](config);
                        
                    });
                    callback && callback();
                    //这里需要触发事件，告诉外部已经渲染完子组件????
                });
            }
            else{
                callback && callback();
            }
        },
        /**
         * 绑定事件
         * @private
         */
        _bx_bindEvent: function() {
            var self = this;
            var constt = self.constructor;
            while (constt) {
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
            var self = this;
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
            var self = this;
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
        _bx_destroyBrick: function(o) {
            if (o.brick) {
                o.brick.destroy && o.brick.destroy();
                o.brick = null;
            }
        },
        /**
         * 销毁组件
         * @param {String} id 组件id
         */
        destroyBrickById: function(id) {
            var self = this;
            var bricks = self.get('bricks');
            for (var i = 0; i < bricks.length; i++) {
                var o = bricks[i];
                if (id === o.id) {
                    self._bx_destroyBrick(o);
                    bricks.splice(i, 1);
                    o = null;
                    return;
                }
            }
        },
        /**
         * 析构函数，销毁资源
         * @return {[type]} [description]
         */
        destructor: function() {
            var self = this;
            var el = self.get('el');
            //需要销毁子组件
            var bricks = self.get('bricks');
            // S.each(bricks, function(o, i) {
            //     S.log(bricks);
            //     self._bx_destroyBrick(o);
            // });
            //需要解决如何从父组件数组中移除自己
            var length = bricks.length;
            for (var i = 0; i < bricks.length; i++) {
                var o = bricks[i];
                self._bx_destroyBrick(o);
                if(length>bricks.length){
                    length = bricks.length;
                    i--;
                }
            };
            bricks = null;
            self.set('bricks', bricks);
            


            var parent = self.get('parent');
            //如果存在父组件，则移除父组件bricks中的自己
            if (parent) {
                var parentBricks = parent.get('bricks');
                var id = el.attr('id');
                for (var i = 0; i < parentBricks.length; i++) {
                    if (parentBricks[i].id == id) {
                        parentBricks.splice(i, 1);
                        break;
                    }
                }
            }

            if (self.get('rendered')) {
                self._bx_detachEvent();
                var action = self.get('destroyAction');
                switch (action) {
                    case 'remove':
                        el.remove();
                        break;
                    case 'empty':
                        el.empty();
                        break;
                }
                //el = null;
            }
            self.set('destroyed', true);
            el = null;
        },
        /**
         * 设置数据，并刷新模板数据
         * @param {String} datakey 需要更新的数据对象key
         * @param {Object} data    数据对象
         * @param {Object} [opts]    控制对象，包括以下控制选项
         * @param {Boolean} [opts.silent] 是否触发change事件
         * @param {Function} [opts.error] 验证失败的回调，包括失败原因
         * @param {String} [opts.renderType] 渲染类型，目前支持html，append，prepend
         */
        setChunkData: function(datakey, data, opts) {
            var self = this;
            var newData;
            var parent = self;
            while(parent){
                if(newData = parent.get('data')){
                    break;
                }
                parent = parent.get('parent');
            }
            if(!newData){
                newData = {};
                parent = self;
            }
            var keys = [];
            if (S.isObject(datakey)) {
                //datakey = S.clone(datakey);
                for (var key in datakey) {
                    newData[key] = datakey[key];
                    keys.push(key);
                }
                opts = data;
            } else {
                keys = [datakey]
                newData[datakey] = data;
            }
            parent.set('data', newData);
            //根据传入的opts,设置renderType
            var renderType = 'html';
            if (opts) {
                if (opts.renderType) {
                    renderType = opts.renderType;
                    delete opts.renderType;
                }
            }
            self.set('renderType', renderType);

            self._bx_refreshTmpl(keys, newData);    
        },
                /**
         * 渲染完成后需要执行的函数
         * @param {Function} fn 执行的函数
         */
        ready: function(fn) {
            if (this.get('isReady')) {
                fn.call(window, this);
            } else {
                this.get('readyList').push(fn);
            }
        },
        /**
         * 触发ready添加的方法
         * @private
         */
        _bx_fireReady: function() {
            var self = this;
            if (self.get('isReady')) {
                return;
            }
            self.set('isReady',true);
            //局部变量，保证所有注册方法只执行一次
            var readyList = self.get('readyList');
            self.set('readyList' , []);
            if (readyList.length > 0) {
                var fn, i = 0;
                while (fn = readyList[i++]) {
                    fn.call(self);
                }
            }
            readyList = null;
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
            bricks: {
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
            isReady:{
                value:false
            },
            /**
             * ready 需要执行的方法集合
             * @type {Object}
             */
            readyList:{
                value:[]
            },
            /**
             * 组件的分析模板，不进入渲染逻辑
             * @type {Object}
             */
            brickTmpl:{
                value:false
            },
            /**
             * 存储组件模板集合
             * @type {Object}
             */
            brickTmpls:{
                value:{}
            }
        }
    }, 'Brick');

    /**
     * 静态方法集合
     */

    /**
     * 获取内置模板文件
     * @param  {Object} module 模块的this
     * @param  {[type]} path   相对路径
     * @param  {CustomEventObject} e      事件对象
     */
    Brick.getTemplate = function(module, path, e) {
        var url = new Uri(module.getFullPath()).resolve(path).toString();
        IO({
            url: url,
            dataType: 'html',
            success: function(d, textStatus, xhrObj) {
                e.next(d);
            }
        });
    }

    return Brick;
}, {
    requires: ['promise', 'rich-base', 'xtemplate', 'node', 'event', 'ua', 'ajax', 'uri', 'sizzle']
});