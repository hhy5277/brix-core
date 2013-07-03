KISSY.add('thx.test/opoa-foo/index', function(S, Brick) {

    var dawn = +new Date()

    while (+new Date() - dawn < 10) ;

    return Brick.extend({}, {}, 'DestroyFoo')

}, {
    requires: ['brix/base']
})