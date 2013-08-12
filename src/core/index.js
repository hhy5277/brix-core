KISSY.add('brix/core/index', function(S, bxApi, bxTpl, bxEvent, bxDelegate, bxRemote, bxWatcher, bxThird) {
    var exports = {}
    S.mix(exports, bxApi)
    S.mix(exports, bxTpl)
    S.mix(exports, bxEvent)
    S.mix(exports, bxDelegate)
    S.mix(exports, bxRemote)
    S.mix(exports, bxWatcher)
    S.mix(exports, bxThird)

    exports.ATTRS = S.mix({}, bxWatcher.ATTRS)
    
    return exports
}, {
    requires: ['brix/core/bx-api', 'brix/core/bx-tpl', 'brix/core/bx-event', 'brix/core/bx-delegate', 'brix/core/bx-remote', 'brix/core/bx-watcher', 'brix/core/bx-third']
})