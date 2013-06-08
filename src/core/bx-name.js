/*jshint asi:true */
KISSY.add('brix/core/bx-name', function(S, Node) {

    var exports = {
        bxHandleName: function(root) {
            root = Node(root)
            var nodes = this.bxDirectChildren(root)
            var total = nodes.length
            var counter = 0
            var self = this
            var node

            function check() {
                counter++
                if (counter === total) {
                    self.fire('rendered')
                    root = nodes = node = null
                }
            }

            if (total === 0) {
                setTimeout(function() {
                    self.fire('rendered')
                }, 0)
            }
            else {
                for (var i = 0; i < total; i++) {
                    node = Node(nodes[i])

                    this.bxInstantiate(node, check)
                }
            }
        },

        bxInstantiate: function(el, fn) {
            var parent = this

            S.use(el.attr('bx-name').replace(/\/$/, '') + '/index', function(S, Brick) {
                if (!S.isFunction(Brick)) {
                    // no need to initialize anything.
                    return
                }
                var opts = parent.bxHandleConfig(el, Brick)
                var inst

                opts.el = el

                var ancestor = parent

                while (ancestor) {
                    var overrides = ancestor.get('config')

                    if (overrides) {
                        S.mix(opts, overrides[el.attr('id')])
                        S.mix(opts, overrides[el.attr('name')])
                    }

                    ancestor = S.isFunction(ancestor.get) && ancestor.get('parent')
                }

                inst = new Brick(opts)
                inst.set('parent', parent)
                inst.set('name', el.attr('bx-name'))
                inst.set('id', el.attr('id'))

                var children = parent.get('children')

                if (!children) {
                    children = []
                    parent.set('children', children)
                }
                children.push(inst)

                if (S.isFunction(inst.initialize)) {
                    // inst.bxCacheSubTemplets(el)
                    inst.on('rendered', fn)
                    inst.callMethodByHierarchy('initialize', 'constructor')
                }
                else {
                    fn()
                }
                el = null
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
            var parentName = root.attr('bx-name')

            selector = selector || '[bx-name]'
            root.all(selector).each(function(ele) {
                var parent = ele.parent('[bx-name]')

                if (!parent || parent.attr('bx-name') === parentName) {
                    arr.push(ele)
                }
            })

            return arr
        },

        bxFind: function(name) {
            var children = this.bxChildren

            for (var i = 0; i < children.length; i++) {
                if (children[i].bxName === name) {
                    return children[i]
                }
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