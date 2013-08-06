KISSY.add('brix/core/bx-name', function(S, Node) {

    var exports = {
        bxHandleName: function(root, renderedFn, activatedFn) {
            root = Node(root)
            var nodes = this.bxDirectChildren(root)
            var self = this

            for (var i = nodes.length - 1; i >= 0; i--) {
                var node = nodes[i]

                // If the node is deferred, do not instantiate it.
                if (node.hasAttr('bx-defer')) {
                    nodes.splice(i, 1)
                }
                else {
                    // Some of the child nodes might be instantiated already.
                    // Remove them out of the nodes array that will be processed.
                    var brick = self.find('#' + node.attr('id'))

                    if (brick) nodes.splice(i, 1)
                }
            }

            if (nodes.length === 0) {
                S.later(function() {
                    //S.log(self.get('name')+'_'+renderedCounter+'_total:'+total)
                    renderedFn()
                    if (activatedFn) activatedFn()
                }, 0)
            }
            else {
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
                //S.log(self.get('name')+'_'+renderedCounter+'_'+total)
                if (++renderedCounter === total) renderedFn()
            }
            var activatedCheck = activatedFn && function() {
                if (++activatedCounter === total) activatedFn()
            }

            for (var i = 0; i < total; i++) {
                var node = Node(nodes[i])
                var naked = node.hasAttr('bx-naked') && (node.attr('bx-naked') || 'all')
                var name = node.attr('bx-name')

                if (naked === 'js' || naked === 'all') {
                    klasses[i] = 'brix/base'
                }
                // the name might be
                //
                // - mosaics/wangwang
                // - mosaics/wangwang/
                // - mosaics/dropdown/large
                // - mosaics/calendar/twin
                //
                else if (name.split('/').length > 2) {
                    klasses[i] = name
                }
                else {
                    klasses[i] = name + '/index'
                }
            }

            KISSY.use(klasses.join(','), function(S) {
                var Klasses = S.makeArray(arguments)

                // remove the S in the arguments array
                Klasses.shift()

                for (var i = 0; i < Klasses.length; i++) {
                    self.bxInstantiate(nodes[i], Klasses[i], renderedCheck, activatedCheck)
                }
            })
        },

        bxInstantiate: function(el, Klass, renderedFn, activatedFn) {
            var parent = this
            var DOM = S.DOM
            var bothFn = function() {
                renderedFn()
                if (activatedFn) activatedFn()
            }

            if (!S.isFunction(Klass)) {
                // no need to initialize anything.
                return bothFn()
            }
            if (!(el && DOM.contains(document, el[0]))) {
                //S.log(parent.get('name')+'_bothFn:')
                // el is gone
                return bothFn()
            }
            var opts = parent.bxHandleConfig(el, Klass)
            var tag = el.attr('bx-tag')

            S.mix(opts, {
                el: el,
                name: el.attr('bx-name'),
                parent: parent,

                // 开启被动模式，即渲染完毕之后不再自动 bxActivate ，而是等父组件来管理这一过程
                passive: !activatedFn,

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

            var inst = new Klass(opts)
            var children = parent.get('children')

            if (!children) {
                children = []
                parent.set('children', children)
            }
            children.push(inst)

            if (inst.bxRender) {
                // 只检查一次，增加计数器之后即将 check 剥离 rendered 事件监听函数列表。
                inst.once('rendered', renderedFn)
                if (activatedFn) inst.once('ready', activatedFn)
                // 如果组件在实例化过程中被销毁了
                inst.once('destroy', bothFn)
            }
            else {
                bothFn()
            }
            el = children = null
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
                    }
                    else {
                        walk(child)
                    }
                }
            }

            selector = selector || '[bx-name]'
            walk(root)

            return arr
        },

        find: function(name) {
            var children = this.get('children')
            var id

            if (name.charAt(0) === '#') {
                id = name.substr(1)
                name = null
            }

            for (var i = 0; i < children.length; i++) {
                var child = children[i]

                if (child.get('id') === id ||
                    child.get('name') === name) {

                    return child
                }
            }
        },

        where: function(opts) {
            var children = this.get('children')
            var result =[]
            var name = opts.name
            var selector = opts.selector

            for (var i = 0; i < children.length; i++) {
                var child = children[i]

                if (child.get('name') === name) result.push(child)
                if (selector && child.get('el').test(selector)) result.push(child)
            }

            return result
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