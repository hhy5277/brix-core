KISSY.add('brix/interface/index', function(S, app, IZuomo, IYicai) {

    var INTERFACE_MAP = {
        zuomo: IZuomo,
        yicai: IYicai
    }
    
    return INTERFACE_MAP[app.config('interface')]

}, {
    requires: [
        'brix/app/config',
        'brix/interface/if-zuomo',
        'brix/interface/if-yicai'
    ]
})