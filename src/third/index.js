KISSY.add('brix/third/index', function(S, bxBoot, bxName, bxFind,bxUtil,bxConfig) {

    var Third = {
        bxInit: function(renderedFn, activatedFn) {
            var self = this
            //初始化一些方法
            if (renderedFn) {
                self.bxListionRendered(renderedFn)
            }
            if (activatedFn) {
                self.bxListionReady(activatedFn)
            }
            S.later(function(){
                self.bxRender()
            })
            
        },
        bxRender: function() {
            var self = this

            if (self.bxRendering || self.bxRendered) {
                return
            }
            self.bxRendering = true

            var el = self.bxEl

            // 初始化子组件
            self.bxHandleName(el, function() {
                delete self.bxRendering;
                self.bxRendered = true
                if (self.bxRenderedFn) {
                    debugger
                    self.bxRenderedFn();
                    delete self.bxRenderedFn
                }
                self.bxActivate();
            })
        },
        bxActivate: function() {
            var self = this
            if (self.bxActivating ||
                self.bxActivated || // activated before,
                !self.bxRendered) { // or not rendered yet.
                return
            }
            self.bxActivating = true;
            var children = self.bxChildren

            if (children.length === 0) {
                S.later(activated, 0)
                return
            }
            var total = children.length
            var counter = 0;

            function activated() {
                delete self.bxActivating;
                self.bxActivated = true
                if (self.bxReadyFn) {
                    self.bxReadyFn();
                    delete self.bxReadyFn;

                }

            }

            function check() {
                if (++counter === total) activated()
            }

            for (var i = 0; i < children.length; i++) {
                var child = children[i]
                if (!self.bxGetClass(child)) {
                    check()
                } else {
                    child.once('ready', check)
                    child.bxActivate()
                }
            }
        },
        bxListionReady: function(fn) {
            this.bxReadyFn = fn;
        },
        bxListionRendered: function(fn) {
            this.bxRenderedFn = fn;
        },
        bxDestroy: function() {
            var self = this

            //需要销毁子组件
            var children = self.bxChildren
            var i
            for (i = children.length - 1; i >= 0; i--) {
                children[i].bxDestroy()
            }
            self.bxChildren = [];


            var parent = self.bxParent

            // 如果存在父组件，则移除
            if (parent) {
                var siblings = parent.bxChildren
                var id = self.bxId

                for (i = siblings.length - 1; i >= 0; i--) {
                    if (siblings[i].bxId === id) {
                        siblings.splice(i, 1)
                        break
                    }
                }
            }

            if (self.destroy) {
                self.destroy()
            }
        }
    }
    
    S.mix(Third, bxBoot)
    S.mix(Third, bxName)
    S.mix(Third, bxFind)
    S.mix(Third, bxUtil)
    S.mix(Third, bxConfig)

    return Third

}, {
    requires: ['brix/core/bx-boot', 'brix/core/bx-name', 'brix/core/bx-find','brix/core/bx-util',
        'brix/core/bx-config',]
})