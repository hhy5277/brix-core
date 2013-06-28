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
})