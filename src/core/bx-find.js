KISSY.add('brix/core/bx-find', function() {

    var exports = {
        bxOne: function(selector) {
            return this.bxIOne(selector, this.bxChildren || [], true)
        },
        bxIOne: function(selector, children, isRecursive) {
            if (selector.charAt(0) === '#') {
                selector = selector.substr(1)
            }
            for (var i = 0; i < children.length; i++) {
                var child = children[i]
                if (child.bxId === selector ||
                    child.bxName === selector) {
                    return child
                } else if (isRecursive) {
                    var result = this.bxIOne(selector, child.bxChildren || [], isRecursive)
                    if (result) {
                        return result
                    }
                }
            }
        },
        bxAll: function(selector) {
            var result = []
            this.bxIAll(selector, this.bxChildren || [], result, true)
            return result;
        },
        bxIAll: function(selector, children, result, isRecursive) {
            if (selector.charAt(0) === '#') {
                selector = selector.substr(1)
            }
            for (var i = 0; i < children.length; i++) {
                var child = children[i]

                if (child.bxId === selector ||
                    child.bxName === selector) {
                    result.push(child)
                }
                if (isRecursive) {
                    this.bxIAll(selector, child.bxChildren || [], result, isRecursive)
                }
            }
        },
        bxFind: function(selector) {
            return this.bxIOne(selector, this.bxChildren || [])
        },
        bxWhere: function(selector) {
            var result = []
            this.bxIAll(selector, this.bxChildren || [], result)
            return result;
        }
    }
    return exports
})