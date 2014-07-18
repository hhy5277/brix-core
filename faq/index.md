---
layout: post
title: 常问常答
authors:
  - name: 逸才
    homepage: http://cyj.me
---

## Brix 项目做什么的？

Brix 项目的出发点之一是，让所有前端出产的页面都能组件化，页面中每一块都自成组件，经历最初的组件积累
之后，能够在将来多快好省开发页面。

它有别于普通的类似轮播组件的积累，有别于 KISSY Gallery，它的目的不仅仅是积累 JS 逻辑，它想积累的
是诸位同仁在页面制作过程中的**每个区块**，从简单的 Logo 展示、销量排行区块，到复杂的经由多层组件
拼凑的表单、表格，都能够使用 Brix 管理它们的生命周期和交互逻辑，都能够使用工具快速地彼此分享。

Brix 项目的出发点之二，是处理好局部刷新与双向绑定，减少组件编写时的胶水代码。

因此，Brix 项目涵盖如下方面：

- 前端框架 [Brix Core](https://github.com/thx/brix-core)
- 基础样式 <del>[Brix Style](https://github.com/thx/brix-style)</del> [Cube](/cube)
- 核心组件
- 组件共享平台
- 组件开发工具

一般情况下，你只会碰到前三者，当你需要查阅核心组件文档 时，也会接触到组件共享平台。

如果你需要开发核心组件，或者分享自己积累的业务组件，给其他人使用，则需要用到组件开发工具，以：

- 发布组件
- 将业务组件封装成核心组件

## Brix Core

Brix Core 是 Brix 项目的前端页面组件化框架。

### 框架的 CDN 地址在哪？

{% include release.html %}

### 页面怎么初始化？

可以直接引用 CDN 提供的请求合并服务，直接引入 KISSY Seed 与 Brix Core。

```html
{% include bundle.html %}
```

然后使用 brix/app 模块初始化页面：

```js
KISSY.config('packages', {
    'thx.demo': { base: '.' }
})
KISSY.use('brix/app', function(S, app) {
    app.boot()
})
```

将会以带 bx-app 属性的节点起始，逐层渲染该节点中的组件，渲染完毕后进行绑定事件、微调 DOM 等操作。

详细的页面初始化过程请看 [初始化页面详解]({{ site.baseurl }}/articles/app-boot)。

## Brix Style

Brix Style 即 Brix 提供的基础样式。

### 和 Twitter Bootstrap 的区别？

首先，它兼容 IE[67]，不会在 IE[67] 下太丑，更不会在这些浏览器下不可用。

其次，它从 MUX 业务中积累，且结合业界规范趋势。

## 核心组件

在基础样式之外，Brix 提供一份核心组件，包括业务中常见的页面组件：

- 下拉框
- 对话框
- 日历
- 颜色选择
- ……等

它们基于 KISSY 组件和 brix/base 构建，等同于 MUX 的 KISSY Gallery。

### 为什么包名叫 mosaics？

Brix 得名，源自 IT 民工、板砖等流行词，板砖英文 brick，很多板砖即 bricks，谐音处理一下，就得到了
brix。所以 Brix 项目，就是许许多多搭建新商业文明的业务板砖，在这些砖里头，自然有做得细致一点的，
它们就成为了核心组件，它们是板砖里比较美的，于是就成了镶嵌用的锦砖，拼接出一幅幅美丽的画。

好吧，我编不下去了，其实就是因为 brix 包名被占用了，为了避免后续扩展冲突，所以核心组件的包名换成了
mosaics，如此而已。

### 与 KISSY Component 和 Gallery 的关系

KISSY Component 是在 KISSY 库之上积累的核心 KISSY 组件，其中有：

- Base
- RichBase
- XTemplate
- Overlay

等基础类、组件，Brix 框架自身深度依赖 KISSY 的 RichBase 与 XTemplate。

[KISSY Gallery](http://gallery.kissyui.com/) 是使用 KISSY 做基础框架的各业务线依据自身
业务需求积累出来的组件，它们不属于 KISSY 核心部分，不在 KISSY 仓库，由各 Gallery 组件开发者自行
维护。

这两者，都不需要配置包名，KISSY 里已经写上了。

而 mosaics 是 Brix 框架之上的核心组件，和 KISSY Gallery 一样，mosaics 是在 KISSY 核心之外
的。mosaics 是 MUX 自行维护的组件库，在 Brix 框架内，可以很方便地用这些组件；在 Brix 框架之外，
也可以像一个普通的 KISSY 模块一样使用这些：

用 Brix 做组件框架时：

```html
<div bx-name="mosaics/dropdown"><!-- 下拉框内部 DOM --></div>
```

在外部直接使用模块时：

```js
KISSY.use('mosaics/dropdown/', function(S, Dropdown) {
    var dropdown = new Dropdown()

    dropdown.on('ready', function() {
        this.focus()
    })
})
```

## Mosaic

Mosaic 是 Brix 提供的命令行工具，包含如下功能：

- 核心组件组件开发
- 乐高页面开发
- 组件发布
- 组件查询
- 组件下载

### 为什么叫 Mosaic？

如核心组件章节所说，mosaics 是马赛克、锦砖的意思，这是个有内涵的名字。这么有内涵的名字，自然比直白的
各种 package manager 好玩。

在 Brix 3 之前，有个工具叫做 bpm，是 Brix Package Manager 的缩写，因为与 NPM 依赖较深，
而命令行功能一直不完备，所以使用率不高。

Mosaic 可以被认为是 bpm2，只是它的名字是另一种二。

### 为什么使用 Node.js 开发？

因为 JavaScript 很好玩，因为 [isaac](https://github.com/isaacs/) 和
[TJ](https://github.com/visionmedia/) 等大婶都给 Node.js 贡献了许多精彩纷呈的库，
使得具体项目开发变得简单。

但绝不是因为“前端工程师会 JavaScript，有了 Node.js，我们也可以在后端翻云覆雨了”这种逻辑。
会接触后端，开发工具的人，即使不用 JavaScript，它们仍将开发出好用的工具，牛逼的后端服务，
而即使在做后端，也仍然抱着前端里浏览器兼容性，DOM 等知识不放的，恐怕只能抱残守缺，耕耘 Web
的一亩三分地。

所以，看到这里的前端工程师们，与诸君共勉。

## Mosaic Daemon

Mosaic Daemon 即为 Mosaic 工具服务的守护进程，包括如下功能：

- 发布组件到 CDN
- 发布乐高组件的 VM 到乐高平台
- 生成组件缩略图
- 组件演示
- 组件文档

### 为什么叫 Mosaic Daemon？

因为在 *NIX 的世界里，守护进程叫做 daemon：

- sshd 是 SSH 服务
- vsftpd 是 FTP 服务
- apache 又叫 httpd

以上这些名字结尾的 d，都是 daemon。

所以马赛克见贤思齐，也有了个 daemon。

### 为什么用 Node.js 开发？

原因同 Mosaic 章节。在 BPM 时期，有过一个使用 Rails 开发的版本，能把事情搞定，但是总觉得不够好，
MUX 的前端工程师里，Rails 开发者一直不多，年初还离职一位（回来吧飞哥），改用 Node.js 开发，
也算是希望诸位前端工程师在跨出自己的舒适区，接触更宽广领域时，不要害怕。

Node.js 很好玩的。





