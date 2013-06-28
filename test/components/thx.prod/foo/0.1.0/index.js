KISSY.add('thx.prod/foo/index', function(S, Brick) {
    
    return Brick.extend({}, {}, 'Foo')
}, {
    requires: ['brix/base']
})