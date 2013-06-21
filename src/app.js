KISSY.add('brix/app', function(S, appConfig, Brick) {

    function BxApp() {
        BxApp.superclass.constructor.call(this)
    }

    S.extend(BxApp, S.Base)

    BxApp.ATTRS = {
        prepared: false
    }

    S.augment(BxApp, appConfig, {
        boot: function() {
            this.prepare()

            return Brick.boot.apply(this, arguments)
        },

        bootStyle: function(fn) {
            this.prepare()

            S.use(this.bxComboStyle().join(','), fn)
        },

        prepare: function() {
            // prepare only once.
            if (!this.get('prepared')) {
                this.bxMapImports()
                this.bxMapComponents()
                this.bxPackageImports()
                this.bxPackageComponents()
                this.set('prepared', true)
            }
        }
    })

    var app = new BxApp()

    return app
}, {
    requires: [
        'brix/app/config',
        'brix/base',
        'base'
    ]
})