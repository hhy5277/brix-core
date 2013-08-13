KISSY.add('brix/app', function(S, appConfig, bxApi, bxThird, Third, Brick, Base) {

    function BxApp() {
        BxApp.superclass.constructor.apply(this, arguments)
    }

    S.extend(BxApp, Base)
    S.augment(BxApp, appConfig, bxApi, bxThird, {
        bootStyle: function(fn) {
            S.use(this.bxComboStyle().join(','), fn)
        }
    })

    var app = new BxApp({})

    app.bxChildren = []

    app.config('Third', Third)
    app.config('Brick', Brick)
    return app
}, {
    requires: [
        'brix/app/config',
        'brix/core/bx-api',
        'brix/core/bx-third',
        'brix/third/index',
        'brix/base',
        'base'
    ]
})