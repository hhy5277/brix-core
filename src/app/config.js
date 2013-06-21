KISSY.add('brix/app/config', function(S) {

    var exports = {
        configData: {
            debug: true,

            base: '.',

            interface: 'zuomo',

            imports: {},

            components: {}
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
            var components = this.config('components')

            if (S.isString(components)) {
                this.config('components', { ns: components })
            }
        },

        bxResolveImports: function() {
            var imports = this.config('imports')

            for (var ns in imports) {
                var bricks = imports[ns]

                for (var name in bricks) {
                    var brick = bricks[name]

                    if (S.isString(brick)) {
                        bricks[name] = { version: brick, requires: 'all' }
                    }
                    else if (!brick.requires) {
                        brick.requires = 'all'
                    }
                }
            }
        },

        bxMapImports: function() {
            this.bxMapModules(this.config('imports'))
        },

        bxMapComponents: function() {
            var components = this.config('components')
            var tag = components.tag
            var ns = components.ns

            if (tag && ns) {
                var injectTag = function(m, name, file) {
                    return [ns, tag, name, file].join('/')
                }

                S.config('map', [
                    [new RegExp(ns + '\\/([^\\/]+)\\/([^\\/]+)$'), injectTag]
                ])
            }
        },

        bxMapModules: function(lock) {
            function makeReplacer(ns) {
                return function(match, name, file) {
                    return [ns, name, lock[ns][name].version, file].join('/')
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
            var components = this.config('components')
            var ns = components.ns
            var base = components.base || this.config('base')
            var ignoreNs = S.config('ignorePackageNameInUri')
            var obj = {}

            obj[ns] = {
                base: base + '/components' + (ignoreNs ? '/' + ns : '')
            }
            S.config('packages', obj)
        },

        bxComboStyle: function() {
            var imports = this.config('imports') || {}
            var styles = []
            var comp
            var ns

            for (ns in imports) {
                for (comp in imports[ns]) {
                    styles.push([ns, comp, 'index.css'].join('/'))
                }
            }
            var components = this.config('components')
            var bricks = components.bricks || []

            for (var i = 0; i < bricks.length; i++) {
                styles.push([components.ns, bricks[i], 'index.css'].join('/'))
            }

            return styles
        }
    }

    return exports
})