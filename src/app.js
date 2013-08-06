KISSY.add('brix/app', function(S, appConfig, bxBoot, bxFind, Brick, Base) {

    function BxApp() {
        BxApp.superclass.constructor.apply(this, arguments)
    }

    S.extend(BxApp, Base)
    S.augment(BxApp, appConfig, bxBoot, bxFind, {
        bootStyle: function(fn) {
            S.use(this.bxComboStyle().join(','), fn)
        }
    })

    var app = new BxApp({})

    app.config('Brick', Brick)

    return app
}, {
    requires: [
        'brix/app/config',
        'brix/core/bx-boot',
        'brix/core/bx-find',
        'brix/base',
        'base'
    ]
})