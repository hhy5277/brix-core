KISSY.add('brix/interface/index', function(S, IZuomo, IYicai) {

    var INTERFACE_MAP = {
        zuomo: IZuomo,
        yicai: IYicai
    }
    var name = 'zuomo'  // or yicai

    return INTERFACE_MAP[name]

}, {
    requires: [
        'brix/interface/if-zuomo',
        'brix/interface/if-yicai'
    ]
})