KISSY.add('brix/third/index', function(S, bxThird) {

    var Third = {
        bxInit: function(renderedFn, activatedFn) {
            var self = this

            if (renderedFn) {
                self.bxListenRendered(renderedFn)
            }
            if (activatedFn) {
                self.bxListenReady(activatedFn)
            }
            S.later(function() {
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
                self.bxFireRendered()
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
                S.later(function() {
                    activated()
                }, 0)
                return
            }
            var total = children.length
            var counter = 0;

            function activated() {
                delete self.bxActivating;
                self.bxActivated = true
                self.bxFireReady()
            }

            function check() {
                if (++counter === total) activated()
            }

            for (var i = 0; i < children.length; i++) {
                var child = children[i]
                if (!child.bxIsBrickInstance()) {
                    check()
                } else {
                    child.once('ready', check)
                    child.once('destroy', check)
                    child.bxActivate()
                }
            }
        },
        bxListenReady: function(fn) {
            this.bxReadyFn = fn;
        },
        bxListenRendered: function(fn) {
            this.bxRenderedFn = fn;
        },
        bxFireRendered: function() {
            if (this.bxRenderedFn) {
                this.bxRenderedFn();
                delete this.bxRenderedFn
            }
        },
        bxFireReady: function() {
            if (this.bxReadyFn) {
                this.bxReadyFn();
                delete this.bxReadyFn;
            }
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

            delete self.bxEl;

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
            self.bxFireRendered();
            self.bxFireReady();
            if (self.destroy) {
                self.destroy()
            }
        }
    }

    S.mix(Third, bxThird)

    return Third

}, {
    requires: ['brix/core/bx-third']
})