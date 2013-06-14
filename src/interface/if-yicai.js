/*jshint asi:true */
KISSY.add('brix/interface/if-yicai', function() {

    var exports = {}

    exports.METHODS = {

        bxIBuildTemplate: function(el) {
            var nodes = this.bxDirectChildren(el)
            var subTemplates = this.get('subTemplatesCache')

            if (!subTemplates) {
                subTemplates = []
                this.set('subTemplatesCache', subTemplates)
            }

            for (var i = 0; i < nodes.length; i++) {
                var node = nodes[i]
                var template = node.attr('bx-template')

                if (node.attr('bx-model') && (!template || template === '.')) {
                    subTemplates.push(node.html())
                    node.html('')
                    node.attr('bx-template', 'cached')
                }
            }
        }
    }

    exports.ATTRS = {
        subTemplatesCache: {
            value: []
        }
    }

    return exports
})