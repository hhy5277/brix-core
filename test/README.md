# 测试用例

## 技术结构

我们采用 [mocha](http://visionmedia.github.io/mocha/) 作测试框架，使用
[expect.js](https://github.com/LearnBoost/expect.js) 作断言写法。所有的测试用例都在
test 目录下，命名方式为 test.module.js ，同时有 test.module.html 文件，用来执行这些测试。

以 brix/app 模块为例，它对应的测试文件为：

- test.app.html
- test.app.js

test.module.html 文件都是大同小异的，区别是各个文件中都各自的 #fixture 区块，引用是各自的 JS。

## test 代码规范

因为 mocha 不像 QUnit ，它的嵌套比较深，所以 test 目录下的 JS 文件，采用两个空格缩进，其余与
src 下的规范相同。

HTML 文件同上，两个空格缩进。

推荐如下测试写法，把用例（it 语句）拆细，尽量不要单个用例中断言（expect 语句）过多：

```js
describe('brix/app', function() {
  describe('#config', function() {
    it('return itself', function() {
      expect(app.config({ foo: 1 })).to.equal(app)
      expect(app.config()).to.equal(app)
    })

    it('get configuration', function() {
      expect(app.config('foo')).to.equal(1)
    })

    it('set configuration', function() {
      expect(app.config('bar', 'ham').config('bar')).to.equal('ham')
    })
  })
})
```

同时，在 HTML 中，尽量保证文件简介，#fixture 不宜过多，有必要的话，按场景拆成多个文件。

## Grunt

所有的测试，都可以在命令行中执行，执行 grunt mocha 即可。