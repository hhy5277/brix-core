KISSY.add('brix/core/bx-name', function(S) {

    var exports = {
        bxHandleName: function(root, renderedFn, activatedFn) {
            var nodes = this.bxDirectChildren(root)
            var self = this

            for (var i = nodes.length - 1; i >= 0; i--) {
                var node = nodes[i]

                // If the node is deferred, do not instantiate it.
                if (node.hasAttr('bx-defer')) {
                    nodes.splice(i, 1)
                } else {
                    // Some of the child nodes might be instantiated already.
                    // Remove them out of the nodes array that will be processed.
                    var brick = self.bxFind('#' + node.attr('id'))

                    if (brick) nodes.splice(i, 1)
                }
            }

            if (nodes.length === 0) {
                S.later(function() {
                    renderedFn()
                    if (activatedFn) activatedFn()
                }, 0)
            } else {
                self.bxUseModules(nodes, renderedFn, activatedFn)
            }
        },

        bxUseModules: function(nodes, renderedFn, activatedFn) {
            var self = this
            var renderedCounter = 0
            var activatedCounter = 0
            var total = nodes.length
            var klasses = []
            var renderedCheck = function() {
                if (++renderedCounter === total) renderedFn()
            }
            var activatedCheck = activatedFn && function() {
                    if (++activatedCounter === total) activatedFn()
                }

            for (var i = 0; i < total; i++) {
                var node = nodes[i]
                klasses[i] = self.bxBootName(node)
            }

            this.bxBootUse(klasses, function(Klasses) {
                for (var i = 0; i < Klasses.length; i++) {
                    var el = nodes[i]
                    // passive:开启被动模式，即渲染完毕之后不再自动 bxActivate ，而是等父组件来管理这一过程
                    var opts = self.bxBootOptions({
                        el: el,
                        passive: !activatedCheck
                    })
                    self.bxIBoot(el, opts, Klasses[i], renderedCheck, activatedCheck)
                }
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

                function walk(node) {
                    var children = node.children()

                    for (var i = 0; i < children.length; i++) {
                        var child = children.item(i)

                        if (child.test(selector)) {
                            arr.push(child)
                        } else {
                            walk(child)
                        }
                    }
                }

            selector = selector || '[bx-name]'
            walk(root)

            return arr
        }
    }

    return exports

})