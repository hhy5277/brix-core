KISSY.add('brix/core/bx-watcher', function(S, JSON) {
    var memo = {};

    function parse(expression) {
        var fn = memo[expression]

        if (!fn) {
            /*jshint -W054 */

            //fn = memo[expression] = new Function('context', 'locals', 'with(context){ return ' + expression + '; }')
            fn = memo[expression] = new Function('context', 'locals', 'with(context){if(typeof ' + expression + ' ==="undefined"){return}else{return ' + expression + '}}')
        }

        return fn
    }

    function unwatch(watcher, watchers) {
        return function() {
            var index = watchers.indexOf(watcher)

            if (index > -1) {
                watchers.splice(index, 1)
            }
        }
    }
    return {
        watch: function(context, expression, callback) {
            var watcher
            var watchers = this.bxWatchers = this.bxWatchers || [];

            var value = typeof expression === 'function' ? function() {
                    return expression(context)
                } : parse(expression);

            var last = value(context)

            if (S.isArray(last) || S.isObject(last)) {
                last = JSON.stringify(last)
            }
            watcher = {
                value: value,
                context: context,
                last: last,
                callback: callback,
                expression: expression
            };
            watchers.push(watcher)

            return unwatch(watcher, watchers)
        },
        digest: function() {
            //临时状态标识
            if (this.bxWatcherChecking) {
                throw new Error('Digest phase is already started')
            }
            var watchers = this.bxWatchers
            if (!watchers) {
                return
            }
            this.bxWatcherChecking = true
            var clean, index, length, watcher, value, iterations = 10;
            do {
                clean = true
                index = -1
                length = watchers.length

                while (++index < length) {
                    watcher = watchers[index]
                    value = watcher.value(watcher.context)
                    var last = value
                    //是否object或者array的标识
                    var flg = false
                    if (S.isArray(last) || S.isObject(last)) {
                        last = JSON.stringify(last)
                        flg = true;
                    }
                    if (last !== watcher.last) {
                        watcher.callback(value)
                        watcher.last = last
                        clean = false
                    }
                }
            } while (!clean && iterations--)

            if (!iterations) {
                throw new Error('Too much iterations per digest');
            }

            delete this.bxWatcherChecking;
        },
        parse: parse
    }
}, {
    requires: ['json']
});