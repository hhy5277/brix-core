/*jshint asi:true */
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

            function check() {
                console.log('checking', self.get('name'), total, counter)
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
                var klasses = []

                for (i = 0; i < total; i++) {
                    node = Node(nodes[i])
                    klasses[i] = nodes[i].attr('bx-name').replace(/\/$/, '') + '/index'
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

                // the tag and brickTmpl attribute is required for interface/zuomo
                tag: tag,
                brickTmpl: tag ? parent.get('brickTmpls')[tag].middle : {}
            })

            var ancestor = parent

            while (ancestor) {
                var overrides = ancestor.get('config')

                if (overrides) {
                    S.mix(opts, overrides[el.attr('id')])
                    S.mix(opts, overrides[el.attr('name')])
                }

                ancestor = S.isFunction(ancestor.get) && ancestor.get('parent')
            }

            inst = new Klass(opts)
            inst.set('id', el.attr('id'))

            var children = parent.get('children')

            if (!children) {
                children = []
                parent.set('children', children)
            }
            children.push(inst)

            if (inst.bxRender) {
                // inst.bxCacheSubTemplets(el)
                inst.on('rendered', fn)
                inst.callMethodByHierarchy('initialize', 'constructor')
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