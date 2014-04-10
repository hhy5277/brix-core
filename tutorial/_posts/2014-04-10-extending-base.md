---
layout: post
title: 编写自己的组件
authors:
  - name: 左莫
    homepage: http://xubo.me
---


{% raw %}

## 看代码写组件

``` javascript
//namespace/component/index 是组件的包路径，根据实际修改。
KISSY.add("namespace/component/index", function(S, Brick) {
    return Brick.extend({
        /**
         * 构造函数
         */
        constructor: function() {
            //可以重新定义构成函数，如果定义，必须显示调用父类的构造函数
            arguments.callee.superclass.constructor.apply(this, arguments);
        },
        /**
         * 初始化函数
         * 实例化组件时执行
         */
        initializer: function() {

        },
        /**
         * 绑定函数
         * 在组件加载到dom结构后执行
         */
        bind: function() {

        },
        /**
         * 同步函数
         * bind之后执行
         */
        sync:function(){

        },
        /**
         * 析构函数
         * 组件destroy前执行，用来移除事件绑定，移除对象引用等操作
         * @return {[type]} [description]
         */
        destructor: function() {

        }
    },{
        /**
         * 属性配置
         * 可以通过get，set函数操作
         */
        ATTRS: {
            attrName: {
                value: 4
            }
        },
        /**
         * 事件配置
         */
        EVENTS: {
            'selector': {
                eventType: function(e) {
                }
            }
        }
}, {
    requires: ["brix/base"]
});
```
{% endraw %}