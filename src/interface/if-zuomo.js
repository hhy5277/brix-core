KISSY.add('brix/interface/if-zuomo', function(S) {

    var exports = {}

    exports.METHODS = {
        bxIBuildTpl: function() {
            var self = this
            //存储监听的数据key
            self.bxWatcherKeys = {}
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

        bxIActivate: function() {
            var self = this
            var needRenderCounter = 0
            var needActivateCounter = 0

            // 局部刷新事件监听
            self.on('beforeRefreshTpl', function(e) {

                //移除不冒泡的事件绑定
                var node = e.node;
                S.each(self.bxBubbleEvents, function(v, k) {
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
                S.each(self.bxBubbleEvents, function(v, k) {
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
         * @return {String}      解析后的模板
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
        /**
         * 获取模板中的innerHTML，替换原来的构建正则
         * @param  {String} tpl    模板字符串
         * @param  {String} tag    节点的tag，如：div
         * @param  {Number} s_pos  开始查找的位置
         * @param  {Number} offset 偏移量
         * @return {Object}        {html:'',e_pos:12}
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
        // bxIBuildBrickTpls: function(tpl, level) {
        //     var self = this
        //     var r = '(<([\\w]+)\\s+[^>]*?bx-name=["\']([^"\']+)["\']\\s+bx-tag=["\']([^"\']+)["\']\\s*[^>]*?>)(@brix@)(</\\2>)'
        //     while (level--) {
        //         r = r.replace('@brix@', '(?:<\\2[^>]*>@brix@</\\2>|[\\s\\S])*?')
        //     }
        //     r = r.replace('@brix@', '(?:[\\s\\S]*?)')
        //     var reg = new RegExp(r, "ig")
        //     tpl = tpl.replace(reg, function(all, start, tag, name, bx, middle, end) {
        //         self.bxBrickTpls[bx] = {
        //             start: start,
        //             middle: middle,
        //             end: end
        //         }
        //         //占位符
        //         return '@brix@' + bx + '@brix@'
        //     })
        //     return tpl
        // },
        /**
         * 获取属性模板
         * @param  {String} str 模板
         * @return {Object}   存储对象
         * @private
         */
        bxIStoreAttrs: function(str) {
            var attrs = {}
            var storeAttr = function(all, attr, tpl) {
                if (tpl.indexOf('{{') > -1 && tpl.indexOf('}}') > 0) {
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
            var obj = self.bxGetAncestorWithData()
            var data = obj.data
            var ancestor = obj.ancestor
            if (data) {
                var watch = function(key) {
                    ancestor.watch(data, key, function() {
                        if (!S.inArray(key, ancestor.bxRefreshKeys)) {
                            ancestor.bxRefreshKeys.push(key)
                        }
                        if (ancestor.bxLaterTimer) {
                            ancestor.bxLaterTimer.cancel();
                            delete ancestor.bxLaterTimer
                        }
                        ancestor.bxLaterTimer = S.later(function() {
                            ancestor.bxIRefreshTpl(ancestor.get('el'), ancestor.bxSubTpls, ancestor.bxRefreshKeys, data, 'html')
                            ancestor.bxRefreshKeys = [];
                        }, 100)
                    })
                }
                var temparr = datakey.split(',')
                for (var i = 0; i < temparr.length; i++) {
                    var key = temparr[i]
                    if (!ancestor.bxWatcherKeys[key]) {
                        ancestor.bxWatcherKeys[key] = true;
                        watch(key);
                    }
                }
            }
        },

        /**
         * 对节点中的bx-datakey解析，构建模板和数据配置
         * @param {String} tpl  需要解析的模板
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
                self.bxIAddWatch(datakey)
                //递归编译子模板的子模板
                self.bxIBuildSubTpls(obj.html, subTpl.subTpls)
                //递归编译子模板
                self.bxIBuildSubTpls(tpl.substring(0, reg.lastIndex - offset) + tpl.substr(obj.e_pos), subTpls)
            }
        },
        // bxIBuildSubTpls: function(tpl, subTpls, level) {
        //     var self = this
        //     var l = level
        //     var r = '(<([\\w]+)\\s+[^>]*?bx-subtpl=["\']([^"\']+)["\']\\s+bx-datakey=["\']([^"\']+)["\']\\s*[^>]*?>)(@brix@)</\\2>'
        //     while (l--) {
        //         r = r.replace('@brix@', '(?:<\\2[^>]*>@brix@</\\2>|[\\s\\S])*?')
        //     }
        //     r = r.replace('@brix@', '(?:[\\s\\S]*?)')

        //     var reg = new RegExp(r, "ig")
        //     var m
        //     var replacer = function(all, bx) {
        //         var o = self.bxBrickTpls[bx]
        //         return o.start + o.middle + o.end
        //     }
        //     while ((m = reg.exec(tpl)) !== null) {
        //         var datakey = m[4]
        //         var obj = {
        //             name: m[3],
        //             datakey: datakey,
        //             tpl: m[5].replace(/@brix@(brix_tag_\d+)@brix@/ig, replacer),
        //             attrs: self.bxIStoreAttrs(m[1]),
        //             subTpls: []
        //         }
        //         subTpls.push(obj)
        //         self.bxIAddWatch(datakey)
        //         //递归编译子模板
        //         self.bxIBuildSubTpls(m[5], obj.subTpls, level)
        //     }
        // },
        /**
         * 子闭合标间的处理
         * @param  {String} tpl 模板
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
                self.bxIAddWatch(datakey)
                return ''
            })
            return tpl
            // while ((m = reg.exec(tpl)) !== null) {
            //     var datakey = m[4]
            //     self.subTpls.push({
            //         name: m[3],
            //         datakey: datakey,
            //         attrs: self.bxIStoreAttrs(m[1])
            //     })
            //     self.bxIAddWatch(datakey)
            // }
        },

        /**
         * 局部刷新
         * @param  {String} subTplName 子模板名称或id，这个待定
         * @param  {Object} data 数据
         * @param  {String} renderType 渲染方式，目前支持html，append，prepend
         * @private
         */
        bxIRefreshTpl: function(el, subTpls, keys, data, renderType) {
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
                } else if (o.subTpls.length > 0) {
                    //刷新子模板的子模板
                    self.bxIRefreshTpl(el, o.subTpls, keys, data, renderType)
                }
            })


            function loop(children) {
                // 为什么要这样做？
                // 因为 bxIRefreshTpl 有可能会更改 children 数组的长度
                for (var i = 0; i < children.length; i++) {
                    var child = children[i]
                    if (!child.bxRefresh) {
                        child.bxRefresh = true
                        if (!child.bxIsBrickInstance()) {
                            loop(child.bxChildren)
                        } else if (!child.get('data')) {
                            //data = child.get('data') || data //数据有可能是父亲的父亲来的
                            el = child.get('el')
                            subTpls = child.bxSubTpls || []
                            child.bxIRefreshTpl(el, subTpls, keys, data, renderType)
                            i = 0
                        }
                    }
                }
                // 移除 bxRefresh
                S.each(children, function(child) {
                    delete child.bxRefresh
                })
            }

            var children = self.bxChildren
            loop(children)
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
            var obj = self.bxGetAncestorWithData()
            var newData = obj.data || {}
            var ancestor = obj.ancestor
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
            ancestor.set('data', newData, opts)

            if (!opts || !opts.silent) {
                ancestor.digest(true)
                ancestor.bxIRefreshTpl(ancestor.get('el'), ancestor.bxSubTpls, keys, newData, renderType)
            }
        }
    }

    exports.ATTRS = {}

    return exports
})