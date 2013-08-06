KISSY.add('brix/app', function(S, appConfig, Brick) {

    var BxApp = Brick.extend({
        bootStyle: function(fn) {
            S.use(this.bxComboStyle().join(','), fn)
        }
    })

    S.augment(BxApp, appConfig)

    var app = new BxApp({
        el: S.one('[bx-app]') || S.one('body'),
        defer: true
    })

    app.config('Brick', Brick)

    return app
}, {
    requires: [
        'brix/app/config',
        'brix/base',
        'base'
    ]
})