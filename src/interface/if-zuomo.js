KISSY.add('brix/interface/if-zuomo', function(S) {
    /*jshint -W030 */
    var defineProperty = Object.defineProperty
    var defineProperties = Object.defineProperties
    try {
        defineProperty({}, '_', {
            value: 'zuomo'
        })
    } catch (e) {
        if ('__defineGetter__' in {}) {
            defineProperty = function(obj, prop, desc) {
                if ('get' in desc) {
                    obj.__defineGetter__(prop, desc.get)
                }
                if ('set' in desc) {
                    obj.__defineSetter__(prop, desc.set)
                }
            }
            defineProperties = function(obj, props) {
                for (var prop in props) {
                    defineProperty(obj, prop, props[prop])
                }
                return obj
            }
        }
        else if (!defineProperties && window.VBArray) {
            /*jshint -W061 */
            window.execScript([
                'Function vb_global_eval(code)',
                    'ExecuteGlobal(code)',
                'End Function'
            ].join('\n'), 'VBScript')

            defineProperties = function(obj, props) {
                var t = setTimeout(function(){})
                var className = 'VBClass' + t
                var owner = {}
                var buffer = []
                buffer.push(
                        'Class ' + className,
                        '\tPrivate [__data__], [__proxy__]',
                        '\tPublic Default Function [__const__](d, p)',
                        '\t\tSet [__data__] = d: set [__proxy__] = p',
                        '\t\tSet [__const__] = Me',
                        '\tEnd Function')
                for (var name in props) {
                    owner[name] = true
                    buffer.push(
                            '\tPublic Property Let [' + name + '](val)',
                            '\t\tCall [__proxy__]([__data__], "' + name + '", val)',
                            '\tEnd Property',
                            '\tPublic Property Set [' + name + '](val)',
                            '\t\tCall [__proxy__]([__data__], "' + name + '", val)',
                            '\tEnd Property',
                            '\tPublic Property Get [' + name + ']',
                            '\tOn Error Resume Next', 
                            '\t\tSet[' + name + '] = [__proxy__]([__data__],"' + name + '")',
                            '\tIf Err.Number <> 0 Then',
                            '\t\t[' + name + '] = [__proxy__]([__data__],"' + name + '")',
                            '\tEnd If',
                            '\tOn Error Goto 0',
                            '\tEnd Property')
                }
                buffer.push('End Class')
                buffer.push(
                        'Function ' + className + 'Factory(a, b)',
                        '\tDim o',
                        '\tSet o = (New ' + className + ')(a, b)',
                        '\tSet ' + className + 'Factory = o',
                        'End Function')
                window.vb_global_eval(buffer.join('\r\n'))

                return window[className + 'Factory'](props, function(props,name,value){
                    var fn = props[name]
                    if (arguments.length === 3) {
                        fn.set(value)
                    } else {
                        return fn.get()
                    }
                })
            }
        }
    }
    var exports = {}

    exports.METHODS = {
        /**
         * 编译模板
         * @private
         */
        bxIBuildTpl: function() {
            var self = this
            //延迟刷新存储的key
            self.bxRefreshKeys = []
            //子模板数组
            self.bxSubTpls = []
            self.bxBrickTpls = {}

            self.bxStoreTpls = {}
            var tpl = self.get('tpl')
            var tempTpl

            if (tpl) {
                self.bxIBuildStoreTpls(tpl)
                tpl = self.bxITag(tpl)
                tpl = self.bxISubTpl(tpl)
                //存储模板
                self.set('tpl', tpl)
                tempTpl = self.bxIBuildBrickTpls(tpl)
            } else {
                var brickTpl = self.bxBrickTpl
                if (brickTpl) {
                    tempTpl = self.bxIBuildBrickTpls(brickTpl)
                }
            }
            if (tempTpl) {
                tempTpl = self.bxISelfCloseTag(tempTpl)
                self.bxIBuildSubTpls(tempTpl, self.bxSubTpls)
            }
        },
        /**
         * 激活组件
         * @private
         */
        bxIActivate: function() {
            var self = this
            var needRenderCounter = 0
            var needActivateCounter = 0

            // 局部刷新事件监听
            self.on('beforeRefreshTpl', function(e) {

                //移除不冒泡的事件绑定
                var node = e.node;
                S.each(self.bxUnBubbleEvents, function(v, k) {
                    var ns = node.all(k)
                    S.each(v, function(o) {
                        ns.detach(o.type, o.fn, self)
                    })
                })

                needRenderCounter++
                needActivateCounter++

                if (e.renderType === 'html') {
                    var children = self.bxDirectChildren(node)

                    for (var i = 0; i < children.length; i++) {
                        var brick = self.bxFind('#' + children[i].attr('id'))
                        if (brick) brick.bxDestroy()
                    }
                }
            })

            self.on('afterRefreshTpl', function(e) {
                //不冒泡的事件绑定
                var node = e.node;
                S.each(self.bxUnBubbleEvents, function(v, k) {
                    var ns = node.all(k)
                    S.each(v, function(o) {
                        ns.on(o.type, o.fn, self)
                    })
                })

                self.bxHandleName(
                    node, function renderedCheck() {
                        if (--needRenderCounter === 0) {
                            self.bxRendered = true
                            self.fire('rendered')
                        }
                    }, function activatedCheck() {
                        if (--needActivateCounter === 0) {
                            self.bxActivated = true
                            self.fire('ready')
                        }
                    })
            })
        },

        /**
         * 构建{{#bx-store-tpl-id}}……{{/bx-store-tpl}}的存储
         * @param  {String} tpl 需要解析的模板
         * @return {String}      替换后的模板
         * @private
         */
        bxIBuildStoreTpls: function(tpl) {
            var self = this
            var storeTplRegexp = /\{\{#bx\-store\-tpl\-([^\}]*)?\}\}([\s\S]*?)\{\{\/bx\-store\-tpl\}\}/ig

            tpl = tpl.replace(storeTplRegexp, function(g, id, html) {
                self.bxStoreTpls[id] = html
                return ''
            })
            return tpl
        },
        /**
         * 为模板中的组件打上tag标识
         * @param  {String} tpl 模板
         * @return {String}     替换后的模板
         * @private
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
         * @return {String}     替换后的模板
         * @private
         */
        bxISubTpl: function(tpl) {
            return tpl.replace(/(bx-subtpl=["'][^"']+["'])/ig, '')
                .replace(/(bx-datakey=["'][^"']+["'])/ig, function(match) {
                    return 'bx-subtpl="brix_subtpl_' + S.guid() + '" ' + match
                })
        },
        /**
         * 获取模板中的innerHTML，替换原来的构建正则
         * @param  {String} tpl    模板字符串
         * @param  {String} tag    节点的tag，如：div
         * @param  {Number} s_pos  开始查找的位置
         * @param  {Number} offset 偏移量
         * @return {Object}        {html:'',e_pos:12}
         * @private
         */
        bxIInnerHTML: function(tpl, tag, s_pos, offset) {
            var s_tag = '<' + tag
            var e_tag = '</' + tag + '>'

            var s_or_pos = s_pos

            var e_pos = s_pos
            var e_next_pos = s_pos

            s_pos = s_pos - offset
            s_pos = tpl.indexOf(s_tag, s_pos)
            var s_next_pos = s_pos + 1

            while (true) {
                s_pos = tpl.indexOf(s_tag, s_next_pos);
                e_pos = tpl.indexOf(e_tag, e_next_pos);

                if (s_pos == -1 || s_pos > e_pos) {
                    break
                }
                s_next_pos = s_pos + 1
                e_next_pos = e_pos + 1
            }
            return {
                html: tpl.substring(s_or_pos, e_pos),
                e_pos: e_pos + e_tag.length
            }
        },
        /**
         * 编译子组件模板
         * @param  {String} tpl 模板
         * @return {String}     替换后的模板
         * @private
         */
        bxIBuildBrickTpls: function(tpl) {
            var self = this
            var r = '<([\\w]+)\\s+[^>]*?bx-name=["\']([^"\']+)["\']\\s+bx-tag=["\']([^"\']+)["\']\\s*[^>]*?>'
            var reg = new RegExp(r, "ig")

            var m = reg.exec(tpl)
            if (m) {
                var offset = m[0].length
                var obj = self.bxIInnerHTML(tpl, m[1], reg.lastIndex, offset)
                self.bxBrickTpls[m[3]] = {
                    start: m[0],
                    middle: obj.html,
                    end: '</' + m[1] + '>'
                }

                tpl = tpl.substring(0, reg.lastIndex - offset) + '@brix@' + m[3] + '@brix@' + tpl.substr(obj.e_pos)
                return self.bxIBuildBrickTpls(tpl)
            }
            return tpl
        },
        /**
         * 获取属性模板
         * @param  {String} tpl 模板
         * @return {Object}   存储对象
         * @private
         */
        bxIStoreAttrs: function(tpl) {
            var attrs = {}
            var storeAttr = function(all, attr, str) {
                if (str.indexOf('{{') > -1 && str.indexOf('}}') > 0) {
                    attrs[attr] = str
                }
            }
            tpl.replace(/([^\s]+)?=["']([^'"]+)["']/ig, storeAttr)
            return attrs;
        },
        /**
         * 编译数据，设置bxData对象
         * @private
         */
        bxIBuildData:function(){
            var self = this
            var data = self.get('data')
            var props = {}
            var fn = function(k){
                props[k] = {
                    get:function(){
                        return data[k]
                    },
                    set:function(v){
                        data[k] = v
                        if (!S.inArray(k, self.bxRefreshKeys)) {
                            self.bxRefreshKeys.push(k)
                        }
                        if(self.bxRefresh){
                            self.bxIRefreshTpl(self.get('el'), self.bxSubTpls, self.bxRefreshKeys, data, self.bxRenderType)
                            self.bxRefreshKeys = []
                        }
                        self.bxRefresh = true
                    }
                }
            }
            if(data){
                self.bxRefresh = true //数否刷新
                for(var prop in data){
                    fn(prop)
                }
                //全新的数据对象，对齐操作，会
                self.bxData = defineProperties({},props)
            }
        },

        /**
         * 对节点中的bx-datakey解析，构建模板和数据配置
         * @param {String} tpl  需要解析的模板
         * @param {Array} subTpls 子模板集合
         * @private
         */
        bxIBuildSubTpls: function(tpl, subTpls) {
            var self = this
            var r = '<([\\w]+)\\s+[^>]*?bx-subtpl=["\']([^"\']+)["\']\\s+bx-datakey=["\']([^"\']+)["\']\\s*[^>]*?>'

            var reg = new RegExp(r, "ig")
            var m = reg.exec(tpl)
            var replacer = function(all, bx) {
                var o = self.bxBrickTpls[bx]
                return o.start + o.middle + o.end
            }

            if (m) {
                var datakey = m[3]
                var offset = m[0].length
                var obj = self.bxIInnerHTML(tpl, m[1], reg.lastIndex, offset)

                var subTpl = {
                    name: m[2],
                    datakey: datakey,
                    tpl: obj.html.replace(/@brix@(brix_tag_\d+)@brix@/ig, replacer),
                    attrs: self.bxIStoreAttrs(m[0]),
                    subTpls: []
                }
                subTpls.push(subTpl)
                //self.bxIAddWatch(datakey)
                //递归编译子模板的子模板
                self.bxIBuildSubTpls(obj.html, subTpl.subTpls)
                //递归编译子模板
                self.bxIBuildSubTpls(tpl.substring(0, reg.lastIndex - offset) + tpl.substr(obj.e_pos), subTpls)
            }
        },
        /**
         * 自闭合标签处理
         * @param  {String} tpl 模板
         * @private
         */
        bxISelfCloseTag: function(tpl) {
            var self = this
            var r = '<(input|img)\\s+[^>]*?bx-subtpl=["\']([^"\']+)["\']\\s+bx-datakey=["\']([^"\']+)["\']\\s*[^>]*?/?>'
            var reg = new RegExp(r, "ig")

            tpl = tpl.replace(reg, function(all, tag, name, datakey) {
                self.bxSubTpls.push({
                    name: name,
                    datakey: datakey,
                    attrs: self.bxIStoreAttrs(all)
                })
                return ''
            })
            return tpl
        },

        /**
         * 局部刷新
         * @param {Node} el 模板根节点
         * @param {Array} subTpls 子模板集合
         * @param {Array} keys 更新的key
         * @param {Object} data 数据 
         * @private
         */
        bxIRefreshTpl: function(el, subTpls, keys, data) {
            var self = this

            if (!self.bxRendered) {
                return
            }

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
                        if (o.tpl) {
                            //渲染方式，目前支持html，append，prepend
                            var renderType = node.attr('bx-rendertype') || 'html'
                            self.fire('beforeRefreshTpl', {
                                node: node,
                                renderType: renderType
                            })

                            //重新设置局部内容

                            if (renderType == 'html') {
                                node.empty();
                            }
                            //TODO  这里遇到自定义标签貌似会有问题。等以后再说吧
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
                            if (node[0].tagName.toUpperCase() == 'INPUT' && k == "value") {
                                node.val(val)
                            } else if(k == 'class'){
                                node[0].className = val
                            } 
                            else {
                                node.attr(k, val)
                            }
                        })
                    })
                } else if (o.subTpls && o.subTpls.length > 0) {
                    //刷新子模板的子模板
                    self.bxIRefreshTpl(el, o.subTpls, keys, data)
                }
            })


            function loop(children) {
                // 为什么要这样做？
                // 因为 bxIRefreshTpl 有可能会更改 children 数组的长度
                for (var i = 0; i < children.length; i++) {
                    var child = children[i]
                    if (!child.bxRefreshFlg) {
                        child.bxRefreshFlg = true
                        if (!child.bxIsBrickInstance()) {
                            loop(child.bxChildren)
                        } else if (!child.get('data')) {
                            //data = child.get('data') || data //数据有可能是父亲的父亲来的
                            el = child.get('el')
                            subTpls = child.bxSubTpls || []
                            child.bxIRefreshTpl(el, subTpls, keys, data)
                            i = 0
                        }
                    }
                }
                // 移除 bxRefreshFlg
                S.each(children, function(child) {
                    delete child.bxRefreshFlg
                })
            }

            var children = self.bxChildren
            loop(children)
        }
    }

    exports.ATTRS = {}

    return exports
})