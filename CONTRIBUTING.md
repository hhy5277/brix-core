# 如何贡献代码

Brix Core 有一致的代码风格，有测试约束。

## 代码风格

四个空格缩进，注意留白。

```js
var Node = S.Node;
var IO = S.IO;
// 变量声明后空一行
// 多个变量声明用多个对应的 var，而不是用 , 串联

var Brick = RichBase.extend({
    // 私有方法以 bx 为前缀
    bxGetTempate: function() {

    },
    // 方法间留空行

    bxGetData: function() {

    }
});
```

## 测试

测试框架采用 mocha ，测试代码与 src 下的模块基本对应。