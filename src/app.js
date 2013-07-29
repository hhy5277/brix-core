KISSY.add('brix/app', function(S, appConfig, Brick) {

    function BxApp() {
        BxApp.superclass.constructor.call(this)
    }

    S.extend(BxApp, S.Base)

    BxApp.ATTRS = {}

    S.augment(BxApp, appConfig, {
        boot: function() {
            return Brick.boot.apply(this, arguments)
        },

        bootStyle: function(fn) {
            S.use(this.bxComboStyle().join(','), fn)
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