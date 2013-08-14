KISSY.add('brix/app', function(S, appConfig, bxApi, bxThird) {
    var BxApp = {
        bootStyle: function(fn) {
            S.use(this.bxComboStyle().join(','), fn)
        },
        bxChildren: []
    }
    S.mix(BxApp, appConfig)
    S.mix(BxApp, bxApi)
    S.mix(BxApp, bxThird)

    return BxApp
}, {
    requires: [
        'brix/app/config',
        'brix/core/bx-api',
        'brix/core/bx-third',
        'brix/third/index',//这里的两个依赖必须存在
        'brix/base'
    ]
})