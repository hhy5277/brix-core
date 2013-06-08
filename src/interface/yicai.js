/*jshint asi:true */
KISSY.add('brix/interface/yicai', function(S) {

    var exports = {

        bxICacheSubTemplets: function(el) {
            var nodes = this.bxDirectChildren(el)
            var subTemplets = this.bxCachedSubTemplets = []

            for (var i = 0; i < nodes.length; i++) {
                var node = nodes[i]
                var template = node.attr('bx-template')

                if (node.attr('bx-model') && (!template || template === '.')) {
                    subTemplets.push(node.html())
                    node.html('')
                    node.attr('bx-template', 'cached')
                }
            }
        }
    }

    return exports
})