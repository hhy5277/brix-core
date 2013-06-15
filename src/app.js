/*jshint asi:true */
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
            this.prepareLoader()

            return Brick.boot.apply(this, arguments)
        },

        bootStyle: function(fn) {
            this.prepareLoader()

            S.use(this.comboStyle().join(','), fn)
        },

        prepareLoader: function() {
            if (!this.get('prepared')) {
                this.mapImports()
                this.mapComponents()
                this.packageImports()
                this.packageComponents()
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