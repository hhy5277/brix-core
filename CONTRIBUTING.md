# 如何贡献代码

Brix Core 有一致的代码风格，有测试约束。

## 代码风格

### JavaScript

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

### HTML

两个空格缩进，标签严格关闭，属性值用双引号，自关闭标签的尾斜杠加不加均可。

```html
<div bx-name="brix/pagination">
  <div bx-name="brix/dropdown">
    <ul>
      <li>hello</li>
    </ul>
  </div>
  <a href="http://example.com"><img/></a>
</div>
```

### CSS

两个空格缩进，开括号放在行尾，多个选择器分行，每个样式定义区块之间要隔行。

以 SCSS 为例：

```scss
.items {
  padding: 5px 0;
  margin: 10px;
  background: #f1f2f3;
  @include border-radius(2px);

  .item,
  .caption {
    color: #000;
  }

  .label {
    font-style: normal;
  }
}
```

## 测试

测试框架采用 mocha ，测试代码与 src 下的模块基本对应。