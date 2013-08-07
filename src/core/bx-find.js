KISSY.add('brix/core/bx-find', function() {

    var exports = {
        /**
         * 递归查找当前组件下的子组件
         * @param  {String} selector 选择器，目前支持id和bx-name
         * @return {Brick}
         */
        one: function(selector) {
            return this.bxOne(selector, this.get('children') || [], true)
        },
        bxOne: function(selector, children, isRecursive) {
            if (selector.charAt(0) === '#') {
                selector = selector.substr(1)
            }
            for (var i = 0; i < children.length; i++) {
                var child = children[i]
                if (child.bxId === selector ||
                    child.bxName === selector) {
                    return child
                } else if (isRecursive) {
                    var result = this.bxOne(selector, child.get('children') || [], isRecursive)
                    if (result) {
                        return result
                    }
                }
            }
        },
        /**
         * 查找当前组件下的子组件
         * @param  {Object} opts 查找条件，name和selector只能任选其一
         * @param  {String} opts.name 组件名称bx-name
         * @param  {String} opts.selector el节点选择器
         * @return {Array}  符合过滤条件的实例数组
         */
        all: function(selector) {
            var result = []
            this.bxAll(selector, this.get('children') || [], result, true)
            return result;
        },
        bxAll: function(selector, children, result, isRecursive) {
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
                    this.bxAll(selector, child.get('children') || [], result, isRecursive)
                }
            }
        },
        /**
         * 查找当前组件下的子组件
         * @param  {String} selector 选择器，目前支持id和bx-name
         * @return {Brick}
         */
        find: function(selector) {
            return this.bxOne(selector, this.get('children') || [])
        },
        /**
         * 查找当前组件下的子组件
         * @param  {String} selector 选择器，目前支持id和bx-name
         * @return {Array}  符合过滤条件的实例数组
         */
        where: function(selector) {
            var result = []
            this.bxAll(selector, this.get('children') || [], result)
            return result;
        }
    }

    return exports
})