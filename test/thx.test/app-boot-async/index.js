KISSY.add('thx.test/app-boot-async/index', function(S, Brick) {

    return Brick.extend({
        initializer: function() {

        }
    }, {
        ATTRS: {
            foo: {
                value: 1
            }
        }
    }, 'AppAsync')
}, {
    requires: ['brix/base']
})