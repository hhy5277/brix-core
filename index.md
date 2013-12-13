---
layout: post
---



## 前言

如果你熟悉Brix的发展历程，那么你一定关注过Brix的[官方网站][1]，那里有段话是这样描述的：

> Brix 是基于 KISSY（PC端）和 Zepto、SeaJS 等（移动端）底层类库的应用层组件框架。 目标是打造面向前台展示型业务、后台管理型业务、移动高端版业务的通用且易用的一淘UX前端组件平台。

> Brix 来自 一淘 UX，即 Bricks 的谐音。 我们致力于一淘前端平台化建设，为新商业文明制砖，让开发者能够凭借 Brix 建造自己的梦想之城。


2013-5-28 [Hackathon][2] 北京 确立了Brix 3.x的发展方向，以及要解决的问题。

> 最新版本的[组件平台][3]

## 总体设计

![目标][4]

Brix完成了三个大的目标：

* 组件开发规范的确立
* 组件初始化和销毁的管理
* 组件、模块基于数据驱动的局部刷新


![位置][5]

Brix让行为和结构分离，无论是webapp类型的项目，还是传统的jsp php页面，组件的渲染形式和管理方式都是统一的。


## 实现概述

![pagelet][6]

如上图结构的一个页面，会有很多的组件和区块。

用传统开发和基于Brix开发会有什么不同呢？

### 传统实现

``` javascript
KISSY.use('brick1path,brick2path，……，brickNpath',function(S,Brick1,Brick2，……,BrickN){
    var config1 = {}//config1是Brick1组件需要的配置
    var brick1 = new Brick1(config1)
    var config2 = {}//config2是Brick2组件需要的配置
    var brick2 = new Brick2(config2)
    ……
    var configN = {}//configN是BrickN组件需要的配置
    var brickN = new BrickN(configN)
    
    //组件间的交互
    
    brixck1.on('eventtype',function(){
        brick2.dosomething()
    })
    ……
    
    brixck2.on('eventtype',function(){
        brickN.dosomething()
    })
    
})
```
大家一定很习惯这样的用法，而且感觉结构也很清晰。

那么，如果引入Brix，又会怎样？

### Brix实现
```javascript
KISSY.use('brix/app',function(S,App){
    // 所有组件的配置
    var config = {
        el:'#id'//提供一个容器节点    
    }
    App.boot(config).one('ready',function(brix){
        brix就是实例化出来的根组件，并有父子关系。
        var brick1 = brix.one('brick1') //获取组件实例
    })
})
```


> 如果组件是独立的，那么我们可以在不修改js逻辑的情况下，直接对dom结构修改来达到组件是否使用。



##版本推荐


* KISSY 1.4.x -> brix3.4.0

{% include release.html version='3.4.0' %}

* KISSY 1.3.x -> brix3.3.0

{% include release.html version='3.3.0' %}

* KISSY 1.3.0 -> brix2.0
    
{% include old_release.html version='2.0' %}

* KISSY 1.2.x -> brix1.0

{% include old_release.html version='1.0'%}




  [1]: http://etaoux.github.io/brix/
  [2]: https://github.com/thx/brix-core/issues/7
  [3]: http://brix.alibaba-inc.com/
  [4]: http://gtms01.alicdn.com/tps/i1/T17QDxFc4cXXbkAoMp-499-242.png
  [5]: http://gtms01.alicdn.com/tps/i1/T1R0jtFgtcXXa2vpZP-864-616.png
  [6]: http://gtms01.alicdn.com/tps/i1/T1Z9QOFXNeXXatUhzp-886-607.jpg

