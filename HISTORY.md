# History

## 3.0.0-alpha

2013-06-21

冻结 API，开始试用，并修复可能有的相关错误，补充测试用例。


## 3.0.0

2013-08-06 #20

完善 app.boot 与 Brick#boot，使其支持初始化任意组件，如：

```html
<div id="dropdown" bx-name="mosaics/dropdown" bx-tpl="./tpl" bx-remote="./somedata"></div>
<script>
app.boot('#dropdown')
</script>
```

在 3.0.0-alpha 中，将不会请求 mosaics/dropdown/index.js 文件，而是直接用 brix/base 模块作为类以实例化
此组件，这并不是用户期望的。因此，为保证 API 一致，使 boot 能够支持异步加载模块之后再实例化，boot 的返回值
不再是 brick 实例，而是一个 promise：

```js
app.boot('#dropdown').then(function(brick) {
    brick.get('id')         // ==> 'dropdown'
})
```

此外，增加 app.prepare，boot 与 prepare 的区别是，prepare 是 boot 的一层包装，两者都返回 promise，
prepare 等到组件状态为 ready 时才 resolve，而 boot 则是实例化完成之后立即 resolve。

详见 [app-boot 介绍](http://brix.alibaba-inc.com/posts/2013/07/23/app-boot)。

## 3.1.0

2013-08-09 #22

支持第三方组件加载，bx-name 中亦可指定非 brix/base 子类的组件，并能够正确保持组件的树状结构。

## 3.2.0

2013-08-26 #24

移除 debug 等配置项，交还 KISSY.config，针对 components package 的复杂配置，直接通过：

```js
KISSY.config('packages', {
    'thx.demo': {
        base: '../',
        timestamp: '20130827',
        debug: false
    }
})
```

比通过 app.config 封装来得直观。

