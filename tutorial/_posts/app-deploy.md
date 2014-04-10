---
layout: post
title: 上线
authors:
  - name: 逸才
    homepage: http://cyj.me
---


本文讨论使用 Brix Core 开发的项目，在上线时需要主要的事项。

## KISSY.config

上线时需要更新配置，取决于你的发布方式，主要是涉及到你项目的包名及相关设置：

- debug
- base
- tag
- ……等等

在 3.2.0 之前的版本中，这些配置是放在 brix/app 模块的 app.config 中的，但这层封装不是很有
必要，而且直接使用 KISSY.config 有时反而更方便，所以从 3.2.0 版本开始，关于实际项目的包配置，
都交还给 KISSY.config，只是在开发项目时，仍然可以使用这种方式：

```js
KISSY.use('brix/base', function(S, app) {
    app.config({
        components: 'thx.demo'
        // 默认的 base 值是 '.'
    })
})
```

在项目上线时，推荐使用这种方式：

```js
KISSY.config('packages', {
    'thx.demo': {
        debug: false,
        tag: 20130827,
        base: 'http://g.tbcdn.cn/mm/thx.demo/20130827'
    }
})
```

下面针对 KISSY 包配置中这些属性作逐一解释：

### debug

需要将 debug 状态设置为 false，在 KISSY 包配置中默认是 false，所以在开发状态时，为了保证
tpl.html 与 data.json 文件能够正确获取，可以这么配置：

```js
KISSY.config('packages', {
    'thx.demo': {
        debug: true
    }
})
```

这样影响 Brix Core 的行为，在如下操作时：

- 请求模板
- 请求数据

将 debug 设为 false，将是 Brix 不再用 XHR 请求相应文件，而是使用 KISSY.use 加载包装过的
KISSY 模块。即开发状态时请求 tpl.html，线上状态时 KISSY.use('tpl.tpl')，请求 tpl.tpl.js。
例如，假如 HTML 中如此使用：

```html
<div bx-name="mosaics/dropdown" bx-tpl="./foo" bx-remote="./sample"></div>
```

当 debug 为 true，即开发状态时，将请求如下两个文件：

- mosaics/dropdown/foo.html 模板文件
- mosaics/dropdown/sample.json 数据文件

到了线上，debug 为 false，则请求如下两个文件：

- mosaics/dropdown/foo.tpl.js
- mosaics/dropdown/sample.js

注意模板文件的线上版本多了 tpl 后缀，这是为了避免模板文件名与数据文件名冲突。

### base

如果不需要区分 debug 状态，直接用 app.config 也可以配置 base：

```js
app.config({
    components: 'thx.demo',
    base: 'http://g.tbcdn.cn/mm/thx.demo/2013.8.27'
})
```

app.config 会拿这两条配置项自动配置 KISSY 包，使用的 debug 值为 false。

如此配置，所有 thx.demo/:name/:module 模块的请求地址将变为：

```
http://g.tbcdn.cn/mm/thx.demo/2013.8.27/thx.demo/:name/:module.js
```

当然，推荐的配置方式仍然是直接使用 KISSY.config：

```js
KISSY.config('packages', {
    'thx.demo': {
        base: 'http://g.tbcdn.cn/mm/thx.demo/2013.8.27'
    }
})
```

### tag

在 KISSY 的包配置中还有个选项叫做 tag，即时间戳，此配置项用于更新 URL 的时间戳，
告诉 CDN 节点内容有更新，要到中心服务器回源。例如：

```js
KISSY.config('packages', {
    'thx.demo': {
        base: 'http://g.tbcdn.cn/mm/thx.demo/2013.8.27',
        tag: '20130827'
    }
})
```

假如需要请求 thx.demo/foo 组件，则将发起的请求地址为：

```
http://g.tbcdn.cn/mm/thx.demo/2013.8.27/thx.demo/foo/index-min.js?t=20130827
```

### combine

对 YSlow 当年定下的规则敏感的同学，可能会想把这些个组件的请求都合并掉，依靠 CDN 的 combo 服务，
和 KISSY 内建的模块合并支持，我们可以很方便地作此优化。

```js
// 开启合并
KISSY.config('combine', true)

// 有前一条就够了。
// 不过，如果项目组件不妨便合并，我们可以另外关掉：
KISSY.config('packages', {
    'thx.demo': {
        base: 'http://somecdnthatdoesnotsupportcombo.cn',
        combine: false
    }
})
```

## app.bootStyle

如果用到了 app.bootStyle ，而且需要加载项目自身组件包中的样式，则可以通过 components
配置声明需要加载样式的组件：

```js
app.config({
    base: 'http://g.tbcdn.cn/mm/thx.demo/2013.8.27',
    components: {
        'thx.demo': [ ... ]       // 有 index.css 的组件
    },
    imports: {
        mosaics: { ... },
        mux.tanx: { ... }
    }
})
```

更多 [app.bootStyle 信息](/posts/2013/07/23/app-boot)。