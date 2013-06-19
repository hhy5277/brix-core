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
                return (new Function('return ' + config))();
            } else {
                return {};
            }
            
            Klass = Klass || this.constructor
            var optionList = []

            while (Klass) {
                if (S.isArray(Klass.OPTIONS)) {
                    optionList = optionList.concat(Klass.OPTIONS)
                }
                Klass = Klass.superclass ? Klass.superclass.constructor : null
            }

            el = el || this.get('el')
            var opts = {}

            for (var i = 0; i < optionList.length; i++) {
                var p = optionList[i]

                opts[p] = this.bxCastString(el.attr('data-' + p))
            }

            return opts
        },

        bxCastString: function(str) {
            str = S.trim(str)

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