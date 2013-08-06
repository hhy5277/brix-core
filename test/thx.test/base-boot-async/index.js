KISSY.add('thx.test/base-boot-async/index', function(S, Brick) {

    return Brick.extend({}, {
        ATTRS: {
            bar: {
                value: false
            }
        }
    }, 'BaseAsync')

}, {
    requires: ['brix/base']
})