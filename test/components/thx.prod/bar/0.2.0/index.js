KISSY.add('thx.prod/bar/index', function(S, Brick) {

    return Brick.extend({}, {}, 'Bar')
}, {
    requires: ['brix/base']
})