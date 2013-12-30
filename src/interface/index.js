KISSY.add('brix/interface/index', function(S, IZuomo) {

    var INTERFACE_MAP = {
        zuomo: IZuomo
    }
    var name = 'zuomo'  // or bisheng

    return INTERFACE_MAP[name]

}, {
    requires: [
        'brix/interface/if-zuomo'
    ]
})