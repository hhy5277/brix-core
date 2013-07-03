KISSY.add('brix/core/bx-util', function(S, app) {

    var exports = {
        bxResolveModule: function(mod, ext) {
            var parts = mod.split('/')
            var ns = parts.shift()
            var name = parts.shift()
            var file = parts.shift()
            var base = S.config('packages')[ns].base
            var imports = app.config('imports')

            // S.config('ignorePackageNameInUri')
            if (!(new RegExp(ns + '\\/?$')).test(base)) {
                parts.push(ns)
            }
            if (imports && imports[ns]) {
                parts.push(name)
                parts.push(imports[ns][name])
            }
            else {
                parts.push(name)
            }

            parts.push(file + ext)

            return base + parts.join('/')
        }
    }

    return exports
}, {
    requires: [
        'brix/app/config'
    ]
})