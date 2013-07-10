KISSY.add('brix/app/config', function(S) {

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
            debug: true,

            base: '.',

            imports: {},

            components: null,

            namespace: null,

            timestamp: null
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
            var namespace

            // components 可能的值：
            //
            // - 字符串，即当前项目的命名空间
            // - {} ，用于配置详细组件信息（用于版本处理，组件样式加载等）
            //
            if (S.isString(components)) {
                namespace = components
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
                for (namespace in components) {}
                var bricks = components[namespace]

                if (S.isPlainObject(bricks)) {
                    for (var name in bricks) {
                        bricks[name] = new Declaration(bricks[name])
                    }
                }
            }

            this.config('namespace', namespace)
        },

        bxResolveImports: function() {
            var imports = this.config('imports')

            for (var ns in imports) {
                var bricks = imports[ns]

                for (var name in bricks) {
                    bricks[name] = new Declaration(bricks[name])
                }
            }
        },

        bxMapImports: function() {
            this.bxMapModules(this.config('imports'))
        },

        bxMapComponents: function() {
            var tag = this.config('timestamp')
            var ns = this.config('namespace')
            var components = this.config('components')

            if (tag && ns) {
                var injectTag = function(m, name, file) {
                    return [ns, tag, name, file].join('/')
                }

                S.config('map', [
                    [new RegExp(ns + '\\/([^\\/]+)\\/([^\\/]+)$'), injectTag]
                ])
            }
            else if (S.isPlainObject(components)) {
                this.bxMapModules(components)
            }
        },

        bxMapModules: function(lock) {
            function makeReplacer(ns) {
                return function(match, name, file) {
                    return [ns, name, lock[ns][name], file].join('/')
                }
            }
            var maps = []

            for (var ns in lock) {
                maps.push([new RegExp(ns + '\\/([^\\/]+)\\/([^\\/]+)$'), makeReplacer(ns)])
            }

            S.config('map', maps)
        },

        bxPackageImports: function() {
            var imports = this.config('imports')
            var importsBase = this.config('base') + '/imports'
            var ignoreNs = S.config('ignorePackageNameInUri')
            var packages = {}

            for (var p in imports) {
                packages[p] = {
                    base: importsBase + (ignoreNs ? '/' + p : '')
                }
            }

            S.config('packages', packages)
        },

        bxPackageComponents: function() {
            var ns = this.config('namespace')

            // 如果已经定义过了，就不要覆盖
            if (S.config('packages')[ns]) {
                return
            }
            var base = this.config('base')
            var ignoreNs = S.config('ignorePackageNameInUri')
            var obj = {}

            obj[ns] = {
                base: base + (ignoreNs ? '/' + ns : '')
            }

            S.config('packages', obj)
        },

        bxComboStyle: function() {
            var imports = this.config('imports') || {}
            var styles = []

            var checkStyle = function(ns, bricks) {
                for (var name in bricks) {
                    if (bricks[name].requires('css')) {
                        styles.push([ns, name, 'index.css'].join('/'))
                    }
                }
            }
            var ns

            for (ns in imports) {
                checkStyle(ns, imports[ns])
            }
            var components = this.config('components')

            ns = this.config('namespace')
            components = components[ns]

            if (S.isPlainObject(components)) {
                checkStyle(ns, components)
            }
            else if (S.isArray(components)) {
                for (var i = 0; i < components.length; i++) {
                    styles.push([ns, components[i], 'index.css'].join('/'))
                }
            }

            return styles
        }
    }

    return exports
})