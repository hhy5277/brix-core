KISSY.add('brix/app', function(S, appConfig, bxApi, bxThird, Third, Brick) {
    var BxApp = {
        bootStyle: function(fn) {
            S.use(appConfig.bxComboStyle.call(appConfig).join(','), fn)
            return this
        },
        bxChildren: []
    }
    S.mix(BxApp, appConfig)
    S.mix(BxApp, bxApi)
    S.mix(BxApp, bxThird)

    appConfig.config('Third', Third)
    appConfig.config('Brick', Brick)

    return BxApp
}, {
    requires: [
        'brix/app/config',
        'brix/core/bx-api',
        'brix/core/bx-third',
        'brix/third/index',
        'brix/base'
    ]
})