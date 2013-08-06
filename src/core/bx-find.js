KISSY.add('brix/core/bx-find', function() {

    var exports = {
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
})