KISSY.add('brix/core/bx-event', function(S, Event) {
    var bubbleEvents = ['valuechange']
    var exports = {

        bxDelegate: function() {

            var c = this.constructor
            while (c) {
                this.bxDelegateMap(c.EVENTS)
                c = c.superclass ? c.superclass.constructor : null
            }

            //外部动态传入的事件代理
            var events = this.get('events')
            if (events) {
                this.bxDelegateMap(events)
            }
        },

        bxDelegateMap: function(eventsMap) {

            var self = this
            var el = this.get('el')
            var fnc
            var fn;
            self.bxBubbleEvents = {}

            function wrapFn(fnc) {
                return function() {
                    var obj = self.bxGetAncestorWithData()
                    var ancestor
                    if (obj.data) {
                        //增加brixData，方便外部直接获取
                        arguments[0].brixData = obj.data
                        ancestor = obj.ancestor
                    } else {
                        ancestor = self;
                    }
                    var ret = fnc.apply(this, arguments)
                    if (ret !== false) {
                        ancestor.digest()
                    }

                }
            }

            for (var sel in eventsMap) {
                var events = eventsMap[sel]
                for (var type in events) {
                    fnc = events[type]
                    fnc.handle = wrapFn(fnc)

                    fn = fnc.handle

                    if (sel === 'self') {
                        el.on(type, fn, this)
                    } else if (sel === 'window') {
                        Event.on(window, type, fn, this)
                    } else if (sel === 'body') {
                        Event.on('body', type, fn, this)
                    } else if (sel === 'document') {
                        Event.on(document, type, fn, this)
                    } else {
                        if (S.inArray(type, bubbleEvents)) {
                            //将不冒泡事件做记录
                            self.bxBubbleEvents[sel] = self.bxBubbleEvents[sel] || []
                            self.bxBubbleEvents[sel].push({
                                type: type,
                                fn: fn
                            })
                            el.all(sel).on(type, fn, this)
                        } else {
                            el.delegate(type, sel, fn, this)
                        }

                    }
                }

            }
        },

        bxUndelegate: function() {
            var c = this.constructor

            while (c) {
                this.bxUndelegateMap(c.EVENTS)
                c = c.superclass ? c.superclass.constructor : null
            }
            //外部动态传入的事件代理
            var events = this.get('events')
            if (events) {
                this.bxUndelegateMap(events)
            }
        },

        bxUndelegateMap: function(eventsMap) {
            var el = this.get('el')
            var fn

            for (var sel in eventsMap) {
                var events = eventsMap[sel]
                for (var type in events) {
                    fn = events[type].handle

                    if (sel === 'self') {
                        el.detach(type, fn, this)
                    } else if (sel === 'window') {
                        Event.detach(window, type, fn, this)
                    } else if (sel === 'body') {
                        Event.detach('body', type, fn, this)
                    } else if (sel === 'document') {
                        Event.detach(document, type, fn, this)
                    } else {
                        if (S.inArray(type, bubbleEvents)) {
                            el.all(sel).detach(type, fn, this)
                        } else {
                            el.undelegate(type, sel, fn, this)
                        }
                    }

                    fn = null;
                    delete events[type].handle
                }
            }
        }
    }

    return exports
}, {
    requires: ['event']
})