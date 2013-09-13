KISSY.add('brix/app', function(S, appShadow, bxApi, bxThird) {

    var app = {
        bootStyle: function(fn) {
            var styles = this.bxComboStyle().join(',')

            if (S.importStyle)
                S.importStyle(styles, fn)
            else
                S.use(styles, fn)
        },

        bxChildren: []
    }

    S.mix(app, appShadow)
    S.mix(app, bxApi)
    S.mix(app, bxThird)

    return app
}, {
    requires: [
        'brix/app/shadow',
        'brix/core/bx-api',
        'brix/core/bx-third',
        'brix/third/index',//这里的两个依赖必须存在
        'brix/base'
    ]
})