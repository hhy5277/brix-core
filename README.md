Brix Core
=========

## 演示

安装开发环境，启动 HTTP 服务。

```
$ npm install
$ npm start
```

访问 <http://localhost:5000/demo/>

## 快速上手

用过 Brix 早期版本的同学，请看这篇 [diff](http://cyj.me/f2e/brix-1-2-3-diff)。

### brix/app

Brix 的初始化入口，统一放在 brix/app 模块，在你的页面上引用
[KISSY seed](http://a.tbcdn.cn/s/kissy/1.3.0/seed.js) ，配置好 brix 包路径，
例如：

```html
<script src="http://a.tbcdn.cn/s/kissy/1.3.0/seed.js"></script>
<script>
KISSY.config({
    packages: {
        brix: {
            base: 'http://g.tbcdn.cn/brix/3.0.0'
        }
    }
})
</script>
```

配置好包路径之后，就可以开始使用 brix/app 模块，让它帮你加载、维护组件了：

```js
KISSY.use('brix/app', function(S, app) {
    // 配置当前页面的组件命名空间
    app.config('components', 'thx.demo')

    // 启动页面
    app.boot()
})
```

启动页面 `app.boot()` 做的事情是，找到 `[bx-app]` 节点，作为 el 参数，交给 Brick
实例化，等于：

```js
KISSY.use('brix/base', function(S, Brick) {
    var page = new Brick({
        el: S.one('[bx-app]')
    })
})
```

然后由实例化的组件（page）继续去找 `[bx-app]` 节点中剩余的带有 bx-name 属性的节点，
并根据设定的值加载相应的模块，初始化它们，并且还可以：

- 用 bx-remote 声明组件需要的数据
- 用 bx-naked 或者 bx-requires 声明组件是否有相应模块，若否，则用 brix/base
- 用 bx-tpl 声明组件模板所在

### 拆分页面

根据这一规则，我们可以把页面分成多个区块，每个区块由各自的 CSS 与 JS，
并且可以相同区块出现多次：

```html
<body bx-app>
  <div bx-name="thx.demo/ceiling"></div>
  <div bx-name="thx.demo/nav"></div>
  <div bx-name="thx.demo/featured-item"></div>
  <div bx-name="thx.demo/relative-items"></div>
  <div bx-name="thx.demo/featured-item"
       bx-remote="http://tns.simba.taobao.com/?name=itemdsp"
       bx-tpl="#featured-p4p-item">
  </div>
  <div bx-name="thx.demo/footer"></div>
  <script id="featured-p4p-item" type="text/x-tpl"></script>
</body>
```

对这种传统页面，我们可以轻易地把页面拆分，并维护好各个组件的加载。

### 组件嵌套

上述例子中，都是大组件的概念，设计师更喜欢称其为模块，并将其中用到定制化的
下拉框、按钮、标签栏等称为组件。在 Brix 中，它们确实也是组件，Brix
体现这种构造的方式是，允许组件嵌套：

```html
<div id="J_items"
     bx-name="thx.demo/relative-items"
     bx-tpl="#J_itemsTpl"
     bx-remote="http://tns.simba.taobao.com/?name=itemdsp&count=3">
</div>

<script id="J_itemsTpl" type="text/x-tpl">
  <ul>
    {{#each items}}
    <li bx-name="thx.demo/item">
      <a href="{{clickurl}}">{{title}}</a>
      <span bx-name="brix/wangwang" data-nick="{{nickname}}">{{nickname}}</span>
    </li>
    {{/each}}
  </ul>
</script>
```

我们可以初始化这段页面，并在它 ready 之后做些事情：

```js
app.boot('#J_items').on('ready', function() {
    // this         ==> thx.demo/relative-items 组件实例
    // this.find    ==> 查找当前组件的子组件

    alert('旺旺点灯 ' + this.find('brix/wangwang', true).length + ' 个！')
    // 弹出“旺旺点灯 3 个！”
})
```

### 组件的树状结构

在上例中，组件初始化完后，是这样的结构：

```
app
`-- thx.demo/relative-items
   |-- thx.demo/item
   |   `-- brix/wangwang
   |
   |-- thx.demo/item
   |   `-- brix/wangwang
   |
   `-- thx.demo.item
       `-- brix/wangwang
```

这棵树的根节点是 app ，叶子节点是 brix/wangwang ，中间的每个组件实例都有两个属性：

- parent
- children

根节点没有 parent ，叶子节点没有 children ：

```js
app.get('children')         // ==> [thx.demo/relative-items]
app.get('parent')           // ==> undefined
```

## app.config

在实际项目开发中，不可避免地要使用公共组件，或者其他项目的组件。在 Brix 中，
我们将其一视同仁，都称为外部组件，通过 imports 路径配置：

```js
app.config('imports', {
    brix: {                     // 命名空间（namespace）
        wangwang: '0.1.0'       // 组件名，版本
    },
    'thx.gallery': {
        kwicks: '0.1.0'
    }
})
```

## app.bootStyle

如果需要让 Brix 来帮忙加载样式，可以使用 app.bootStyle 方法：

```js
app.config({
    components: {
        'thx.demo': [ 'foo', 'bar']
    }
})
app.config('imports': {
    brix: { wangwang: '0.1.0' }
})

app.bootStyle(function() {
    app.boot()
})

// 将会执行：
// S.use('thx.demo/foo/index.css,thx.demo/bar/index.css,brix/wangwang/0.1.0/index.css', callback)
```

可以通过显式声明，告诉 brix/app 哪些组件没有 CSS ：

```js
app.config({
    // thx.demo/bar 组件没有 index.css ，直接从这个数组里去掉即可
    components: {
        'thx.demo': [ 'foo' ]
    }
})

app.config('imports', {
    brix: {
        wangwang: '0.1.0/js'    // 默认 /all ，此处说明此模块只有 index.js
        carousel: '1.1.0'
    }
})
```

## app.boot 与 Brick#boot

组件也可以自行启动某段 HTML，适用于弹出较复杂的浮层等情况：

```js
app.boot('#page1').on('ready', function() {
    this.find('thx.demo/foo').boot('#layer1', { ... }).on('ready', function() {
        PopupManager.show(this)
    })
})
```

## 上线

上线时需要更新配置，取决于你的发布方式，主要有：

- debug
- components
  - ns
  - base
  - tag

```js
app.config('debug', false)
app.config({
    components: 'thx.demo',
    base: 'http://a.tbcdn.cn/apps/thx/demo',
    timestamp: '20130621'
})
```

总之对时间戳形式的发布来说，我们需要知道当前项目的命名空间，

如果你需要 app.bootStyle ，则 components 配置可以这样写：

```js
app.config({
    base: 'http://a.tbcdn.cn/apps/thx/demo',
    tiemstamp: '20130621',
    components: {
        'thx.demo': [ ... ]       // 有 index.css 的组件
    }
})
```

## Interface

3.0.0 版本提供两种局部刷新支持方式：

- Brix 2 风格的局部刷新
- （暂未）AngularJS 风格，但是暂时还很弱的，局部刷新

<<<<<<< HEAD
=======
## Brix Core 自身部署

此代码仓库只做部署用，因为集团资源文件发布接口的要求，需要此仓库满足如下要求：

- 所有的代码提交记录里，作者的邮箱必须是公司邮箱
- 版本号满足 semver.org 的约定

### 公司邮箱

访问 <http://gitlab.alibaba-inc.com/profile> 即可看到 GitLab 上认的公司邮箱。

如果之前没有配置过，请在相应的仓库目录中执行（把名字和邮箱换成你自己的）：

```bash
$ git config user.name 'Chen Yicai'
$ git config user.email 'yicai.cyj@taobao.com'
```

如果不介意使用公司邮箱作为全局的作者信息，不介意在 Github 上关联公司邮箱，也可以加上全局参数：

```bash
$ git config --global user.name 'Chen Yicai'
$ git config --global user.email 'yicai.cyj@taobao.com'
```

### 语义化版本号

语义化版本号（<http://semver.org>）不是什么新鲜玩意，GitLab 发布接口里要求的也没有实际规范那么详细，
只要版本号满足 `/^\d+\.\d+\.\d+$/` 格式即可，三位数子分别对应：

- 主版本号
- 次版本号
- 补丁版本号

三个版本号只增不减，往上递增的逻辑是：

- 有重大改动时，升主版本号
- 有影响到 API 但不算重大的改动时，升次版本号
- 有 bug 修复等不影响已有 API 的改动时，升补丁版本号

此外，也有开源项目使用次版本号区分稳定版与开发版：

- 当次版本号为奇数，则为开发版
- 当次版本号为偶数，则为稳定版

### 其他

请看 [资源文件本地发布方案](http://docs.alibaba-inc.com/pages/viewpage.action?spm=0.0.0.0.oUqpYK&pageId=109216022)
>>>>>>> 837f5ce2006c49501ff8b27f2823cdf21f8fee99
