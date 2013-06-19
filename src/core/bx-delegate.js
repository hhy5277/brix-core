KISSY.add('brix/core/bx-delegate', function(S) {

    var exports = {
        /**
         * 为符合匹配的相应事件添加事件处理器, 并在该组件的子孙组件中匹配selector 的组件上触发事件时调用
         * @param {String} selector  选择器（暂时支持组件id和bx-name）
         * @param {String} eventType 代理事件名称
         * @param {Function} fn 当事件触发时的回调函数
         * @param {Object} context  回调函数的this值，如果不指定默认为绑定事件的当前元素
         */
        delegate: function(selector, eventType, fn, context) {
            this.on(selector + '_' + eventType, fn, context)
        },
        /**
         * 为符合匹配的相应事件移除事件代理
         * @param {String} selector  选择器（暂时支持组件id）
         * @param {String} eventType 代理事件名称
         * @param {Function} fn 当事件触发时的回调函数
         * @param {Object} context  回调函数的this值，如果不指定默认为绑定事件的当前元素
         */
        undelegate: function(selector, eventType, fn, context) {
            this.detach(selector + '_' + eventType, fn, context)
        },
        /**
         * 扩展组件的事件触发，或通知到所有父组件
         * @param  {String}  type       要触发的自定义事件名称
         * @param  {Object}  eventData  要混入触发事件对象的数据对象
         */
        fire: function(eventType, eventData, context) {
            Brick.superclass.fire.apply(this, arguments)

            //触发父组件的事件
            var parent = this.get('parent')
            if (parent) {
                context = context || this;
                if (context === this) {
                    var eventTypeId = '#' + context.get('id') + '_' + eventType
                    var eventTypeName = context.get('name') + '_' + eventType
                    parent.fire(eventTypeId, eventData, context)
                    parent.fire(eventTypeName, eventData, context)
                } else {
                    parent.fire(eventType, eventData, context)
                }

            }
        }
    }

    return exports
}, {
    requires: ['event']
})