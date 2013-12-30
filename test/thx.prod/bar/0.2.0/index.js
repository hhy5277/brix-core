KISSY.add('thx.prod/bar/0.2.0/index', function(S, Brick) {

    return Brick.extend({}, {}, 'Bar')
}, {
    requires: ['brix/base']
})