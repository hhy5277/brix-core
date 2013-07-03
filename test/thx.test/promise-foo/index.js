KISSY.add('thx.test/promise-foo/index', function(S, Brick) {

    return Brick.extend({
        bind: function() {
            // forge a slow bind method
            var dawn = +new Date()

            while (+new Date() - dawn < 10) ;
        }
    })
}, {
    requires: ['brix/base']
})