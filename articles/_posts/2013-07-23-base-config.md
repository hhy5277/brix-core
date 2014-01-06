---
layout: post
title: 基于Brix组件的配置
authors:
  - name: 左莫
    homepage: http://xubo.me
---


{% raw %}

## 看代码学配置

``` javascript
{
    /**
     * 组件根节点
     * @type {String|Node|Element}
     */
    el: '#container',
    /**
     * 模板
     * 其他方式设置:
     * 1.el节点上配置bx-tpl指定路径
     * 2.监听getTpl事件
     * @type {String|Selector}
     */
    tpl: '#tpl',
    /**
     * 数据
     * 其他方式设置
     * 1.el节点上配置bx-remote
     * 2.监听getData事件
     * @type {Object}
     */
    data:{},
    /**
     * 是否自动渲染
     * @type {Boolean}
     */
    autoRender:true,
    /**
     * 自动添加组件行为
     * @type {Boolean}
     */
    autoActivate:true,
    /**
     * 销毁操作时候的动作
     * remove：移除
     * none:什么都不做
     * empty:清空内部html
     * @type {String}
     */
    destroyAction:'remove',
    /**
     * 模板引擎
     * @type {Function}
     */
    tplEngine:xTemplate,
    /**
     * 后期事件代理，和EVENTS相同
     * @type {Object}
     */
    events:{
        'selector': {
            eventType: function(e) {
            }
        }
    },
    /**
     * 子组件的配置
     * @type {Object}
     */
    config:{
        /**
         * 通过组件id或者name索引
         * @type {Object} 
         */
        key:{
            //递归配置对象
        }
    }
}
```
{% endraw %}