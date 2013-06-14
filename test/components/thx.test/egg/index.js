KISSY.add('thx.test/egg/index', function(S, Brick) {

    var Egg = Brick.extend({}, {}, 'Egg')

    return Egg
}, {
    requires: ['brix/base']
})