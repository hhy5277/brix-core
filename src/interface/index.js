KISSY.add('brix/interface/index', function(S, app, IZuomo, IYicai) {

    var INTERFACE_MAP = {
        zuomo: IZuomo,
        yicai: IYicai
    }
    var name = 'zuomo'  // or yicai

    return INTERFACE_MAP[name]

}, {
    requires: [
        'brix/app/config',
        'brix/interface/if-zuomo',
        'brix/interface/if-yicai'
    ]
})