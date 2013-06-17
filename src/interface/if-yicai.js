KISSY.add('brix/interface/if-yicai', function() {

    var exports = {}

    exports.METHODS = {

        bxIBuildTpl: function(el) {
            var nodes = this.bxDirectChildren(el)
            var subTpls = this.get('subTplsCache')

            if (!subTpls) {
                subTpls = []
                this.set('subTplsCache', subTpls)
            }

            for (var i = 0; i < nodes.length; i++) {
                var node = nodes[i]
                var tpl = node.attr('bx-tpl')

                if (node.attr('bx-model') && (!tpl || tpl === '.')) {
                    subTpls.push(node.html())
                    node.html('')
                    node.attr('bx-tpl', 'cached')
                }
            }
        }
    }

    exports.ATTRS = {
        subTplsCache: {
            value: []
        }
    }

    return exports
})