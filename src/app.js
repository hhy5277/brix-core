KISSY.add('brix/app', function(S, appConfig, bxBoot, bxFind, bxUtil, bxConfig, Brick, Base) {

    function BxApp() {
        BxApp.superclass.constructor.apply(this, arguments)
    }

    S.extend(BxApp, Base)
    S.augment(BxApp, appConfig, bxBoot, bxFind, bxUtil, bxConfig, {
        bootStyle: function(fn) {
            S.use(this.bxComboStyle().join(','), fn)
        }
    })

    var app = new BxApp({})

    app.bxChildren = []

    app.config('Brick', Brick)

    return app
}, {
    requires: [
        'brix/app/config',
        'brix/core/bx-boot',
        'brix/core/bx-find',
        'brix/core/bx-util',
        'brix/core/bx-config',
        'brix/base',
        'base'
    ]
})