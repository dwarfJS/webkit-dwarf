webkit-dwarf
============

What the Fuck?
--------------

短小精悍的webkit浏览器Javascript模块加载器。

Why?
----

* 许多客户端（如：QQ、微信）有基于webkit内核的内嵌浏览器
* 手机端流量非常重要，需要极小的模块管理库
* 基于线下构建，可以带来更好的编程体验

Goal
----

* 足够小，gzip之后小于1k
* 旨在配合线下构建工具，带来更好的编程体验，例如源代码是这样写的：

src/main.js
```
require(function () {
    var test = require('./test');
    // do something
});
```
src/test.js
```
define(function (require, exports, module) {
    var util = require('./util');
    // do something
    exports.result = 'test';
});
```
构建后则：
dist/main.js
```
require(['./test'], function () {
    var test = require('./test');
    // do something
});
```
dist/test.js
```
define('./test', [./util], function () {
    var util = require('./util');
    // do something
    exports.result = 'test';
});
```
模拟接近于NodeJS的编程体验。

API
---

* 异步加载

    #### require(modules, success, fail)

    modules `Array` 异步加载的模块数组
    
    success `Function` 成功回调
    
    fail `Function` 失败回调
    
    例如：


```
require(['./test'], function () {
    // do something
}, function () {
    throw new Error('Failed to load module');
});
```
    
* 同步获取

    ### require(module)
    
    module `String` 要获取的模块名
    
    `返回` 对应模块
    
    例如：

```
require(['./test'], function () {
    var test = require('./test');
    // do somthing
}, function () {
    throw new Error('Failed to load module');
});
```
    
* 定义模块

    ### define(module, dependencies, factory)
    ### define(module, factory)
    ### define(module, value)
    
    module `String` 模块相对该js文件对应路径，因为有可能在一个js文件中定义多个模块
    
    dependencies `Array` 依赖数组
    
    factory `Functino` 模块初始化工厂
    
    value `String, Number or Object` 模块值
    
    例如：
    
```
define('./test', [./util], function (require, exports, module) {
    var util = require('./util');
    // do something
    exports = module.exports = {
        result: 'test'
    };
});
```

* 设置require

    ### require.opt(opts)
    
    必须在第一次使用require前设置。
    
    opts `Object` 设置内容
    
    例如：

```
require.opt({ base: 'http://qun.qq.com/js/' });
```
    
* 定制require
    
    ### require.makeRequire(opts)

    opts `Object` 设置内容
    
    `返回` 对应的require实例
    
    例如：
    
```
var myRequire = require.makeRequire({ base: 'http://qun.qq.com/js/' });
```