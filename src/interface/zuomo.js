/*jshint asi:true */
KISSY.add('brix/interface/zuomo', function(S) {

    var exports = {

        bxBuildTemplate: function() {
            var self = this
            var tmpl = self.get('tmpl')
            var level = self.get('level')

            if (tmpl) {
                tmpl = self.bxIBrickTag(tmpl)
                tmpl = self.bxITmplName(tmpl)
                //存储模板暂时不做
                //self.bxIBuildStoreTmpls(tmpl)
                self.set('tmpl', tmpl)

                self.bxIBuildSubTmpls(self.bxIBuildBrickTmpl(tmpl), false, level)

                //对模板的处理，比如子模板的提取，存储模板的提取
                return true
            }
            else {
                var brickTmpl = self.get('brickTmpl')

                if (brickTmpl) {
                    self.bxIBuildSubTmpls(self.bxIBuildBrickTmpl(brickTmpl), false, level)
                }
            }

            return false
        },

        /**
         * 构建{{#bx-tmpl-id}}……{{/bx-tmpl}}的存储
         * @param  {String} tmpl 需要解析的模板
         * @return {String}      解析后的模板
         */
        bxIBuildStoreTmpls: function(tmpl) {
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
        bxIBrickTag: function(tmpl) {
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
        bxITmplName: function(tmpl) {
            return tmpl.replace(/(bx-tmpl=["'][^"']+["'])/ig, '')
                    .replace(/(bx-datakey=["'][^"']+["'])/ig, function(match) {
                return 'bx-tmpl="brix_tmpl_' + S.guid() + '" ' + match
            })
        },

        bxIBuildBrickTmpl: function(tmpl) {
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
        bxIBuildSubTmpls: function(tmpl) {
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
                self.bxIBuildSubTmpls(m[5])
            }
        },

        /**
         * 局部刷新
         * @param  {String} subTmplName 子模板名称或id，这个待定
         * @param  {Object} data 数据
         * @param  {String} renderType 渲染方式，目前支持html，append，prepend
         * @private
         */
        bxIRefreshTmpl: function(keys, data, renderType) {
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
            // 因为 bxIRefreshTmpl 有可能会更改 children 数组的长度
            for (var i = 0; i < children.length; i++) {
                var child = children[i]

                if (!child.get('refresh')) {
                    child.set('refresh', true)
                    if (!child.get('data')) {
                        child.bxIRefreshTmpl(keys, data, renderType)
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

            self.bxIRefreshTmpl(keys, newData, renderType)
        }
    }

    return exports
})