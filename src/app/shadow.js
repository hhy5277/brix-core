// The module serve as the shadow of brix/app
// brix/app requires modules like brix/core/bx-util, which in return might
// require functionalities of brix/app. For trespassing circular dependencies,
// here's this shadow module.
KISSY.add('brix/app/shadow', function(S) {

    // A simple Class for brick declaration processing.
    //
    // A brick can be declared as:
    //
    // - 0.1.0
    // - 0.1.0/js
    // - 0.1.0/css
    //
    // A declaration instance can then check whether this declaration says
    // anything about js, css requirements or not.
    //
    // var foo = new Declaration('0.1.0/js')
    //
    // foo.requires('css')        // ==> false
    //
    function Declaration(str) {
        var parts = str.split('/')

        this.version = parts[0]
        this.assets = parts[1] || 'all'
    }

    S.augment(Declaration, {
        naked: function(type) {
            return !this.requires(type)
        },

        requires: function(type) {
            return this.assets === 'all' || this.assets === type
        },

        toString: function() {
            return this.version
        }
    })

    var exports = {
        configData: {
            imports: {},

            importsBase: 'http://g.tbcdn.cn/thx/m',

            components: null,

            family: '',

            base: '.'
        },

        config: function(prop, data) {
            var _data = this.configData

            if (S.isPlainObject(prop)) {
                data = prop
                prop = null
            }
            else if (S.isString(prop)) {
                if (typeof data !== 'undefined') {
                    var newData = {}

                    newData[prop] = data
                    data = newData
                }
                else {
                    return _data[prop]
                }
            }

            if (data) {
                S.mix(_data, data)

                if ('components' in data) this.bxResolveComponents()
                if ('imports' in data) this.bxResolveImports()
            }

            return this
        },

        bxResolveComponents: function() {
            // Resolve simplified components settings into verbose format.
            var components = this.config('components')
            var family

            // components 可能的值：
            //
            // - 字符串，即当前项目的命名空间
            // - {} ，用于配置详细组件信息（用于版本处理，组件样式加载等）
            //
            if (S.isString(components)) {
                family = components
            }
            else {
                // components 以对象形式定义，用于支持两种场景：
                //
                // 1. 声明需要 app.bootStyle 中加载的组件样式
                // 2. 使用版本锁方式发布时，声明项目组件的各自版本
                //
                // 场景一：
                //
                //     { 'thx.demo': ['dropdown', 'pagination'] }
                //
                // 场景二：
                //
                //     {
                //         'thx.demo': {
                //             dropdown: '1.0.0',
                //             pagination: '1.1.0'
                //         }
                //     }
                //
                // 此处的 for 循环用于将 'thx.demo' 从 components 对象中取出
                for (family in components) {}
                var bricks = components[family]

                if (S.isPlainObject(bricks)) {
                    for (var name in bricks) {
                        bricks[name] = new Declaration(bricks[name])
                    }
                }
            }

            this.config('family', family)

            this.bxPackageComponents()
            this.bxAliasComponents()
        },

        bxPackageComponents: function() {
            var family = this.config('family')

            // 如果已经定义过了，就不要覆盖
            if (S.config('packages')[family]) return

            var base = this.config('base')
            var ignoreNs = S.config('ignorePackageNameInUri')
            var obj = {}

            obj[family] = {
                base: base + (ignoreNs ? '/' + family : '')
            }

            S.config('packages', obj)
        },

        bxResolveImports: function() {
            var imports = this.config('imports')

            for (var family in imports) {
                var bricks = imports[family]

                for (var name in bricks) {
                    bricks[name] = new Declaration(bricks[name])
                }
            }

            this.bxPackageImports()
            this.bxAliasImports()
        },

        bxAliasImports: function() {
            this.bxAliasModules(this.config('imports'))
        },

        bxAliasComponents: function() {
            var components = this.config('components')

            if (S.isPlainObject(components)) {
                this.bxAliasModules(components)
            }
        },

        bxAliasModules: function(lock) {
            var aliases = {}

            for (var family in lock) {
                for (var p in lock[family]) {
                    var declare = lock[family][p]
                    var mod = family + '/' + p + '/'

                    aliases[mod] = {
                        alias: [ mod + declare + '/']
                    }
                    if (declare.requires('css')) {
                        aliases[mod + 'index.css'] = {
                            alias: [ mod + declare + '/index.css']
                        }
                    }
                }
            }

            S.config('modules', aliases)
        },

        bxPackageImports: function() {
            var imports = this.config('imports')

            var importsBase = this.config('importsBase')

            var ignoreNs = S.config('ignorePackageNameInUri')
            var packagesWas = S.config('packages')
            var packages = {}

            for (var p in imports) {
                if (!packagesWas[p]) {
                    // if not configured before.
                    // more info about group configuration:
                    // http://docs.kissyui.com/docs/html/tutorials/kissy/seed/loader/group.html#loader-group-tutorial
                    packages[p] = {
                        base: importsBase + (ignoreNs ? '/' + p : ''),
                        group: 'bx-imports',
                        combine: true
                    }
                }
            }

            S.config('packages', packages)
        },

        bxComboStyle: function() {
            var imports = this.config('imports') || {}
            var styles = []

            var checkStyle = function(family, bricks) {
                for (var name in bricks) {
                    if (bricks[name].requires('css')) {
                        styles.push([family, name, 'index.css'].join('/'))
                    }
                }
            }
            var family

            for (family in imports) {
                checkStyle(family, imports[family])
            }
            var components = this.config('components')

            family = this.config('family')

            if (components) components = components[family]

            if (S.isPlainObject(components)) {
                checkStyle(family, components)
            }
            else if (S.isArray(components)) {
                for (var i = 0; i < components.length; i++) {
                    styles.push([family, components[i], 'index.css'].join('/'))
                }
            }

            return styles
        }
    }

    return exports
})