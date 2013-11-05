KISSY.add('brix/core/bx-util', function(S, app) {
    var BRICKBASE = 'brix/base'

    return {
        /**
         * 动态传参数实例类
         * @param  {Function} constructor 需要实例化的类
         * @param  {Array} args        参数数组
         * @return {Object}             类的实例
         */
        bxConstruct: function(constructor, args) {
            function F() {
                return constructor.apply(this, args)
            }
            F.prototype = constructor.prototype
            return new F()
        },
        /**
         * 给el节点设置唯一的id
         * @param  {String|Node} el 节点
         * @return {String}    id
         */
        bxUniqueId: function(el) {
            if (S.isString(el)) {
                el = S.one(el)
            }
            if (!el.attr('id')) {
                var id

                // 判断页面id是否存在，如果存在继续随机。
                while ((id = S.guid('brix-brick-')) && S.one('#' + id)) {}

                el.attr('id', id)
            }

            return el.attr('id')
        },
        /**
         * 合并数组参数
         * @param  {Array} receiver 参数数组
         * @param  {Array} supplier 配置的参数数组
         */
        bxMixArgument: function(receiver, supplier) {
            if (supplier) {
                S.each(supplier, function(o, i) {
                    if (o !== null) {
                        if (S.isPlainObject(o)) {
                            receiver[i] = receiver[i] || {}
                            S.mix(receiver[i], o)
                        } else {
                            receiver[i] = o;
                        }
                    }
                })
            }
        },
        bxResolveModule: function(mod, ext) {
            var parts = mod.split('/')
            var ns = parts.shift()
            var name = parts.shift()
            var file = parts.shift()
            var base = S.config('packages')[ns].base

            var components = app.config('components')
            var imports = app.config('imports')

            var pkgs = S.config('packages')
            var pkgsIgnore = pkgs[ns] && pkgs[ns].ignorePackageNameInUri

            if (!pkgsIgnore) parts.push(ns)

            parts.push(name)

            if (imports && imports[ns]) {
                parts.push(imports[ns][name])
            } else if (components && S.isPlainObject(components[ns])) {
                parts.push(components[ns][name])
            }

            parts.push(file + ext)

            return base + parts.join('/')
        },
        /**
         * 获取实例的数据
         * @param  {Objcet} context 实例
         * @return {Object}          对象
         */
        bxGetAncestorWithData: function() {
            var context = this;
            var data
            var ancestor = context.bxGetBrickAncestor()
            while (ancestor) {
                if ((data = ancestor.get('data')) && data) {
                    break;
                }
                ancestor = ancestor.bxParent && ancestor.bxParent.bxGetBrickAncestor()
            }

            if (!data) {
                ancestor = context
            }
            return {
                data: data,
                ancestor: ancestor
            }
        },
        bxGetBrickAncestor: function() {
            var context = this
            while (context) {
                if (!context.bxIsBrickInstance()) {
                    context = context.bxParent
                } else {
                    return context
                }
            }
        },
        /**
         * 是否是Brick类的实例
         * @return {Boolean}
         */
        bxIsBrickInstance: function() {
            return this instanceof S.require(BRICKBASE)
        },
        /**
         * 是否继承Brick的类
         * @param  {Function} c 类
         * @return {Boolean}
         */
        bxIsExtendBrickClass: function(c) {
            var Brick = S.require(BRICKBASE)
            var t = c
            while(t){
               if (t == Brick) {
                    return true
                } 
                t = t.superclass && t.superclass.constructor
            }
            return false
        }
    }
}, {
    requires: ['brix/app/shadow']
})