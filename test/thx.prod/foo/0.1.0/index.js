KISSY.add('thx.prod/foo/0.1.0/index', function(S, Brick) {

    return Brick.extend({}, {}, 'Foo')
}, {
    requires: ['brix/base']
})