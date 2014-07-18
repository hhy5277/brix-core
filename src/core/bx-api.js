KISSY.add('brix/core/bx-api', function() {
    var exports = {
        /*            
            * app.boot(el)
            * app.boot(el, data)
            * app.boot(config)

            开始加载组件。
        */
        boot: function(el, data) {
            return this.bxBoot(el, data)
        },

        prepare: function(el, data) {
            return this.bxPrepare(el, data)
        },
        /**
         * 递归查找当前组件下的子组件
         * @param  {String} selector 选择器，目前支持id和bx-name
         * @return {Brick}
         */
        one: function(selector) {
            return this.bxOne(selector)
        },
        /**
         * 查找当前组件下的子组件
         * @param  {Object} opts 查找条件，name和selector只能任选其一
         * @param  {String} opts.name 组件名称bx-name
         * @param  {String} opts.selector el节点选择器
         * @return {Array}  符合过滤条件的实例数组
         */
        all: function(selector) {
            return this.bxAll(selector);
        },
        /**
         * 查找当前组件下的子组件
         * @param  {String} selector 选择器，目前支持id和bx-name
         * @return {Brick}
         */
        find: function(selector) {
            return this.bxFind(selector)
        },
        /**
         * 查找当前组件下的子组件
         * @param  {String} selector 选择器，目前支持id和bx-name
         * @return {Array}  符合过滤条件的实例数组
         */
        where: function(selector) {
            return this.bxWhere(selector)
        }
    }
    return exports
})