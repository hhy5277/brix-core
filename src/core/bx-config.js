KISSY.add('brix/core/bx-config', function(S) {

    var exports = {

        /* use cases:
         *
         *     this.bxHandleConfig(el)            // get options of current brick
         *     this.bxHandleConfig(el, MyBrick)   // get options of MyBrick
         */
        bxHandleConfig: function(el, Klass) {
            // Compact config
            var config = el.attr('bx-config')

            if (config) {
                // http://jslinterrors.com/the-function-constructor-is-a-form-of-eval/
                /*jshint -W054 */
                return (new Function('return ' + config))();
                // [疑问] 异常情况没有处理？直接抛出
            } else {
                return {};
            }

            // [疑问] 后面的代码不会被执行

            Klass = Klass || this.constructor
            var optionList = []

            // 递归向上查找 OPTIONS
            while (Klass) {
                if (S.isArray(Klass.OPTIONS)) {
                    optionList = optionList.concat(Klass.OPTIONS)
                }
                Klass = Klass.superclass ? Klass.superclass.constructor : null
            }

            el = el || this.get('el')
            var opts = {}

            // 尝试从 HTML5 属性 data- 中读取
            for (var i = 0; i < optionList.length; i++) {
                var p = optionList[i]

                opts[p] = this.bxCastString(el.attr('data-' + p))
            }

            return opts
        },

        bxCastString: function(str) {
            str = S.trim(str)

            // 'true' > true, 'false' > false
            if (/^(?:true|false)$/.test(str)) {
                return str === 'true'
            }
            else if (/^\d+$/.test(str)) {
                return parseInt(str, 10)
            }
            else {
                return str
            }
        }
    }

    return exports
})