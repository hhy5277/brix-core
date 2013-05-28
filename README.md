Brix Core
=========

## 2013-5-28 Hackathon

本次 Hackathon 是精神领域的 Hackathon ，绝大部分时间为讨论。经过这几日的激烈碰撞，Brix Core 有了如下变化：

### bx-path

不再有 bx-path ，将它的作用放入 bx-name ，后者的格式也发生变化，详见 #1。

### Pagelet

不再有 Pagelet ，自然也不再需要 new Pagelet 或者什么，初始化起点只有两个：
  
- app.boot
- brick.boot

详见 #2

### 引入 Promise 做异步流程控制

允许组件以如下方式干预 Brix 内部的渲染、加载、与初始化过程：

```js
var foo = app.boot('#some-big-brick')

foo.on('beforeBuildTemplate', function(e) {
    S.IO.get('/extraTemplate.html', function(markup) {
        // append extra template to the built-in brick template.
        e.next(e.template + markup)
    })
})
```

详见 #3

### 模板引擎

允许组件使用自定义模板引擎，如果使用自定义的模板引擎，需仍支持局部刷新等功能，模板翻译可不支持，详见 #4。

Brix Core 本身支持的模板引擎，不能太复杂，满足如下三个条件即可：

- if
- each
- expression （不包括流程控制、变量声明、函数调用）
 
访问上层数据，需显示声明，例如 XTemplate 的 `../` 。

### 组件加载

Brix Core 可以从如下三种页面状态接手，加载组件：

1. 页面已渲染完毕，只负责加载、初始化、绑定组件
2. 页面未渲染，组件使用内建模板，则提取子模板，渲染它，再执行步骤一
3. 页面未渲染，为组件提供了自定义模板，如步骤二
 
详见 #5

### 组件实例化

详见 #6
