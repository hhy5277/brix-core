KISSY.add('brix/core/bx-watcher', function(S, JSON) {
    var memo = {}

        function parse(expression) {
            var fn = memo[expression]

            if (!fn) {
                /*jshint -W054 */

                //fn = memo[expression] = new Function('context', 'locals', 'with(context){ return ' + expression + '; }')
                fn = memo[expression] = new Function('context', 'locals', 'with(context){if(S.isUndefined(' + expression + ')){return}else{ return ' + expression + '}}')
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

        function Watcher() {
            this.watchers = []
            this.checking = false
        }

    Watcher.prototype.watch = function(context, expression, callback) {
        var watcher

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
        this.watchers.push(watcher)

        return unwatch(watcher, this.watchers)
    };

    Watcher.prototype.digest = function() {
        var clean, index, length, watcher, value, iterations = 10

        if (this.checking) {
            throw new Error('Digest phase is already started')
        }

        this.checking = true

        do {
            clean = true
            index = -1
            length = this.watchers.length

            while (++index < length) {
                watcher = this.watchers[index]
                value = watcher.value(watcher.context)
                var last = value
                if (S.isArray(last) || S.isObject(last)) {
                    last = JSON.stringify(last)
                }
                if (value !== watcher.last) {
                    watcher.callback(value, watcher.last)
                    watcher.last = last
                    clean = false
                }
            }
        } while (!clean && iterations--)

        if (!iterations) {
            throw new Error('Too much iterations per digest');
        }

        this.checking = false
    }

    Watcher.parse = parse
    return Watcher
}, {
    requires: ['json']
});