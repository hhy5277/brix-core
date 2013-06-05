KISSY.config({
    packages: {
        brix: {
            ignorePackageNameInUri: true,
            base: '../../src'
        }
    }
});


KISSY.use('brix/app,brix/base', function(S, app, Brick) {

    app.config({
        namespace: 'thx.demo',
        base: '../',
        imports: {
            brix: {
                pagination: '1.0.0',
                dropdown: '1.1.0'
            }
        }
    });

    app.bootStyle(function() {
        S.one("button").on("click", bootstrap);
    });


    function bootstrap() {
        var brick = new Brick({
            el:'#container',
            tmpl:'#tmpl',
            config:{
                brixtest2:{
                    data:{
                        a:'aa',
                        b:'bb',
                        c:'cc'
                    }
                },
                brixtest4:{
                    listeners:{
                        getTemplate:function(e){
                            var tmpl = '<input type="button" class="input31 btn btn-red btn-size25" value="刷新文字"><span bx-tmpl="text" bx-datakey="text">hahah{{text}}</span>';

                            e.next(tmpl);
                        }
                    }
                }
            },
            listeners:{
                getData:function(e){
                    S.later(function(){
                        var data = {
                            a: 'a',
                            b: 'b',
                            c: 'c',
                            d: [{
                                a:'4',
                                d1: '1'
                            }, {
                                d1: '2'
                            }, {
                                d1: '3'
                            }, {
                                d1: function() {
                                    return '4';
                                }
                            }],
                            e: true,
                            f: function() {
                                return 'xx';
                            },
                            g:[5,6,7],
                            startDay:'haha'
                        };
                        e.next(data);
                        //brick.destroyBrickById('brixtest');
                    },500);
                    return true;
                }
            }
        });

        brick.ready(function(){
            S.log('ready');
            brick.setChunkData({a: 'aaaa' + S.guid()});
        });

        window.brick = brick;
    }
});