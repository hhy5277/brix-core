KISSY.add('brix/core/bx-third', function(S, bxBoot, bxName, bxFind, bxUtil, bxConfig) {
    var exports = {}
    S.mix(exports, bxBoot)
    S.mix(exports, bxName)
    S.mix(exports, bxFind)
    S.mix(exports, bxUtil)
    S.mix(exports, bxConfig)
    return exports
}, {
    requires: ['brix/core/bx-boot', 'brix/core/bx-name', 'brix/core/bx-find', 'brix/core/bx-util', 'brix/core/bx-config']
})