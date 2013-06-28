KISSY.add('brix/core/bx-name', function(S, Node) {

    var exports = {
        bxHandleName: function(root) {
            root = Node(root)
            var nodes = this.bxDirectChildren(root)
            var children = this.get('children') || []
            var i, j
            var node

            for (i = nodes.length - 1; i >= 0; i--) {
                node = nodes[i]

                for (j = 0; j < children.length; j++) {
                    if (children[j].get('id') === node.attr('id')) {
                        nodes.splice(i, 1)
                    }
                }
            }
            var counter = 0
            var self = this
            var total = nodes.length

            function check(e) {
                if (++counter === total) {
                    self.setInternal("rendered", true)
                    self.fire('rendered')
                }
                // 只检查一次，增加计数器之后即将 check 剥离 rendered 事件监听函数列表。
                e.target.detach('rendered', check)
            }

            if (total === 0) {
                S.later(function() {
                    self.setInternal('rendered', true)
                    self.fire('rendered')
                }, 0)
            }
            else {
                var klasses = []
                var naked

                for (i = 0; i < total; i++) {
                    node = Node(nodes[i])
                    naked = node.hasAttr('bx-naked') && (node.attr('bx-naked') || 'all')

                    if (naked === 'js' || naked === 'all')
                        klasses[i] = 'brix/base'
                    else 
                        klasses[i] = node.attr('bx-name').replace(/\/?$/, '/index')
                }

                KISSY.use(klasses.join(','), function(S) {
                    var Klasses = S.makeArray(arguments)

                    // remove the S in the arguments array
                    Klasses.shift()

                    for (var i = 0; i < Klasses.length; i++) {
                        self.bxInstantiate(nodes[i], Klasses[i], check)
                    }
                })
            }
        },

        bxInstantiate: function(el, Klass, fn) {
            var parent = this

            if (!S.isFunction(Klass)) {
                // no need to initialize anything.
                return
            }
            var opts = parent.bxHandleConfig(el, Klass)
            var tag = el.attr('bx-tag')
            var inst

            S.mix(opts, {
                el: el,
                name: el.attr('bx-name'),
                parent: parent,

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

            inst = new Klass(opts)
            

            var children = parent.get('children')

            if (!children) {
                children = []
                parent.set('children', children)
            }
            children.push(inst)

            if (inst.bxRender) {
                inst.on('rendered', fn)
            }
            else {
                fn()
            }
            el = null
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
})