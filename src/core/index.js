KISSY.add('brix/core/index', function(S, bxApi, bxTpl, bxEvent, bxDelegate, bxRemote, bxThird) {
    var BRICKBASE = 'brix/base'
    var exports = {
        on: function() {
            var Brick = S.require(BRICKBASE)
            Brick.superclass.on.apply(this, arguments)
            return this;
        },
        /**
         * 扩展组件的事件触发，或通知到所有父组件
         * @param  {String}  type       要触发的自定义事件名称
         * @param  {Object}  eventData  要混入触发事件对象的数据对象
         */
        // 因为用到了 Brick 变量，所以从 core/bx-delegate 搬到这里，有更好的办法么？
        fire: function(eventType, eventData, context) {
            var Brick = S.require(BRICKBASE)
            var ret = Brick.superclass.fire.apply(this, arguments)

            //触发父组件的事件
            var parent = this.bxParent&&this.bxParent.bxGetBrickAncestor()

            if (parent) {
                context = context || this;
                if (context === this) {
                    var eventTypeId = '#' + context.bxId + '_' + eventType
                    var eventTypeName = context.bxName + '_' + eventType

                    parent.fire(eventTypeId, eventData, context)
                    parent.fire(eventTypeName, eventData, context)
                } else {
                    parent.fire(eventType, eventData, context)
                }
            }

            return ret
        },
        /**
         * 事件绑定执行一次
         * @param  {String}   eventType 事件名称
         * @param  {Function} fn        事件方法
         * @param  {Object}   context   当前上下文
         * @return {[type]}             [description]
         */
        once: function(eventType, fn, context) {
            var self = this
            var wrap = function() {
                self.detach(eventType, wrap)
                return fn.apply(this, arguments)
            }

            self.on(eventType, wrap, context)

            return self
        },
        bxDestroy: function() {
            this.destroy()
        }
    }
    S.mix(exports, bxApi)
    S.mix(exports, bxTpl)
    S.mix(exports, bxEvent)
    S.mix(exports, bxDelegate)
    S.mix(exports, bxRemote)
    S.mix(exports, bxThird)

    return exports
}, {
    requires: ['brix/core/bx-api', 'brix/core/bx-tpl', 'brix/core/bx-event', 'brix/core/bx-delegate', 'brix/core/bx-remote', 'brix/core/bx-third']
})