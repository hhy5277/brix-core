---
layout: post
title: 那些有用的方法和属性
authors:
  - name: 左莫
    homepage: http://xubo.me
---


{% raw %}

##boot和prepare

两个好基友终于出现了

Brix内部整个渲染流程基于Promise，so 妈妈再也不用担心回调陷阱了。
同样，boot和prepare返回的就是一个promise对象，你要做的就是then，
那他们有什么区别呢？我会说你问的很好吗？

* boot

在组件实例化直接返回,后面的流程你自己看着办。

```javascript
App.boot({
        el: '#container'
    }).then(function(brick) {
        //brick:el节点对应的内存brick对象
        //我什么都还没好，你还可以更改流程上的很多事情
        //改写模板获取流程
        brick.on('getTpl',function(e){
            //next是约定的回调函数
            e.next('新的模板')
        })
        brick.on('getData',function(e){
            //异步获取数据
            S.io('url',function(data){
                //next是约定的回调函数
                e.next({test:'test'})
            })
            //异步必须有为true的返回值
            return true
        })
        brick.once('ready',function(){
            //现在我准备好一切了，和prepare一样了
            var child = brick.one('#id')
        })
    })
```

* prepare

我可是操心死了，我会在自身完成，并且所有子组件的都渲染完成后才会让你进入下一个流程

```javascript
App.boot({
        el: '#container',
        tpl: '#tpl',
        data:{test:'test'}
    }).then(function(brick) {
        //brick:el节点对应的内存brick对象
        //我准备好一切了
        //通过one、all获取子组件实例
       var child = brick.one('#id')
    })
```

##delegate、undelegate
两个新的成员，其实对于用过YUI或KISSY来说不是特别的陌生，是基于dom的事件代理，没错，这里也是事件代理，他是基于组件的自定义事件的代理。

在这一版本的Brix中，组件是有父子关系的。所以，子组件的自定义事件会冒泡到父组件。

还是上代码吧：

如下的html结构

``` html
<!--父组件-->
<div id="fixture-bar" bx-name="thx.test/delegate-bar">
    <!--子组件-->
    <div id="fixture-foo" bx-name="thx.test/delegate-foo">
    </div>
</div>
```

js代码怎么写呢？

```javascript
app
    .prepare({el: '#fixture-bar'})
    .then(function(brick) {
        var firedCount = 0
        var fixtureFoo = brick.find('#fixture-foo')
        function addCount(){
            firedCount++
        }
        brick.delegate('#fixture-foo', 'fooEvent', addCount)
        //firedCount 将等于1
        fixtureFoo.fire('fooEvent')
        
        brick.undelegate('#fixture-foo', 'fooEvent', addCount)
        //firedCount 还是等于1
        fixtureFoo.fire('fooEvent')
    })
```

## one、all、find、where
一句话概括四个方法的用处：获取子组件。

* one:递归查找当前组件下的单个子组件，返回值是组件实例
* all:递归查找当前组件下的所有子组件，返回值是组件实例数组
* find:查找当前组件下一级（不递归）的单个子组件，返回值是组件实例
* where:查找当前组件下一级（不递归）的所有子组件，返回值是组件实例数组

##重要的实例属性

* bxChildren:组件的子组件（数组）
* bxParent:组件的父组件（实例）
{% endraw %}