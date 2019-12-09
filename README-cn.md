[English](./README.md) | 简体中文

# 静态资源自动重试

[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![Greenkeeper badge](https://badges.greenkeeper.io/Nikaple/assets-retry.svg)](https://greenkeeper.io/)
[![Travis](https://img.shields.io/travis/Nikaple/assets-retry.svg)](https://travis-ci.org/Nikaple/assets-retry)
[![Coverage Status](https://coveralls.io/repos/github/Nikaple/assets-retry/badge.svg?branch=master)](https://coveralls.io/github/Nikaple/assets-retry?branch=master)
[![Dev Dependencies](https://david-dm.org/Nikaple/assets-retry/dev-status.svg)](https://david-dm.org/Nikaple/assets-retry?type=dev)

当页面中的脚本、样式、图片资源无法正常加载时，自动重试加载失败的资源。支持备用域名、动态导入（dynamic import），无需改动现有代码，仅需 6 KB。

![Demo GIF](./public/assets-retry.gif)

### [DEMO 地址](https://nikaple.com/test/fixture)

## 目录

- [安装](#安装)
- [快速上手](#快速上手)
- [配置](#配置)
- [工作原理](#工作原理)
    * [获取加载失败的静态资源](#获取加载失败的静态资源)
    * [获取加载失败的异步脚本](#获取加载失败的异步脚本)
    * [获取加载失败的静态资源](#获取加载失败的静态资源)
- [常见问题](#常见问题)

### 安装

#### 通过 npm 安装

```bash
$ npm install assets-retry --save
```

然后通过 [webpack 配置](./examples/webpack) 内联到页面的 `head` 标签中，并置于**所有资源开始加载之前**。

#### 直接通过 `script` 标签引用
如果你懒得折腾 webpack 配置，可以将 [assets-retry.umd.js](https://github.com/Nikaple/assets-retry/dist/assets-retry.umd.js) 直接内联到 `<head>` 标签中，并置于**所有资源开始加载之前**。

### 快速上手

使用起来非常简单，只需要初始化并传入域名列表即可：

```js
// assetsRetryStatistics 中包含所有资源重试的相关信息
var assetsRetryStatistics = window.assetsRetry({
    // 域名列表，只有在域名列表中的资源，才会被重试
    // 使用以下配置，当 https://your.first.domain/js/1.js 加载失败时
    // 会自动使用 https://your.second.domain/namespace/js/1.js 重试
    domain: ['your.first.domain', 'your.second.domain/namespace'],
    // 可选，最大重试次数，默认 3 次
    maxRetryCount: 3
    // 可选，通过该参数可自定义 URL 的转换方式
    onRetry: function(currentUrl, originalUrl, statistics) {
        return currentUrl
    }
})
```

当使用以上代码初始化完毕后，以下内容便获得了加载失败重试的能力：
- [x] 所有在 `html` 中使用 `<script>` 标签引用的脚本
- [x] 所有在 `html` 中使用 `<link>` 标签引用的样式
- [x] 所有在 `html` 中使用 `<img>` 标签引用的图片
- [x] 所有使用 `document.createElement('script')` 加载的脚本（如 webpack 的[动态导入](https://webpack.docschina.org/guides/code-splitting/#%E5%8A%A8%E6%80%81%E5%AF%BC%E5%85%A5-dynamic-imports-)）
- [x] 所有 `css` 中（包含同步与异步）使用的 `background-image` 图片


### 配置

`assetsRetry` 接受一个配置对象 `AssetsRetryOptions` ，其类型签名为：
```ts
interface AssetsRetryOptions {
    maxRetryCount: number;
    onRetry: RetryFunction;
    domain: Domain;
}
type RetryFunction = (
    currentUrl: string,
    originalUrl: string,
    retryCollector: null | RetryStatistics
) => string | null
interface RetryStatistics {
    retryTimes: number
    succeeded: string[]
    failed: string[]
}
type Domain = string[] | { [x: string]: string; }
```

具体说明如下：

- `domain`: 域名列表，可配置为数组或对象类型
    * 数组类型：表示从域名列表中循环加载（1 -> 2 -> 3 -> ... -> n -> 1 -> ...），直到加载成功或超过限次
    * 对象类型：如 `{ 'a.cdn': 'b.cdn', 'c.cdn': 'd.cdn' }` 表示在 `a.cdn` 失败的资源应从 `b.cdn` 重试，在 `c.cdn` 失败的资源应从 `d.cdn` 重试。
- `maxRetryCount`: 每个资源的最大重试次数
- `onRetry`: 在每次尝试重新加载资源时执行，该函数接收 3 个参数：
    * `currentUrl`: 即将被选为重试地址的 `URL`
    * `originalUrl`: 上一次加载失败的 `URL`
    * `retryCollector`: 为当前资源的数据收集对象，如果资源为 CSS 中使用 `url` 引用的图片资源，**该参数可能为 `null`** 。当该参数不为 `null` 时，包含 3 个属性： 
        - `retryTimes`: 表示当前为第 x 次重试（从 1 开始）
        - `failed`: 已失败的资源列表（从同一域名加载多次时，可能重复）
        - `succeeded`: 已成功的资源列表
    该函数返回值必须为字符串或 `null` 对象。
        - 当返回 `null` 时，表示终止该次重试
        - 当返回字符串（url）时，会尝试从 url 中加载资源。

### 工作原理

Assets-Retry 的实现主要分为三部分：

1. 如何自动获取加载失败的静态资源（同步加载的 `<script>`, `<link>`, `<img>`）并重试
2. 如何自动获取加载失败的异步脚本并重试
3. 如何自动获取加载失败的背景图片并重试

#### 获取加载失败的静态资源

这部分实现较为简单，监听 `document` 对象的 `error` 事件便能够捕获到静态资源加载失败的错误。当 `event.target` 为需要重试的元素时，重试加载该元素即可。但需要注意以下场景：

```html
<script src="/vendor.js"></script>
<script src="/app.js"></script>
```

在上面的代码中， `app.js` 依赖 `vendor.js` 中的功能，这在使用 webpack 打包的项目中极其常见，如果使用 `document.createElement('script')` 来对其进行重试，在网络环境不确定的情况下，`app.js` 很有可能比 `vendor.js` 先加载完毕，导致页面报错不可用。

所以对于在 `html` 中同步加载的 `script` 标签，在页面还未加载完毕时，需要使用 `document.write`，阻塞式地将 `script` 标签动态添加到 `html` 中。

#### 获取加载失败的异步脚本

以 webpack 的动态加载脚本为例（仅保留关键代码）：

```javascript
function requireEnsure(chunkId) {
    // 加载 chunk 的 promise
    var promise = new Promise(function (resolve, reject) {
        installedChunkData = installedChunks[chunkId] = [resolve, reject];
    });
    installedChunkData[2] = promise;
    // start chunk loading
    var script = document.createElement('script');
    var onScriptComplete;
    script.charset = 'utf-8';
    script.timeout = 120;
    script.src = jsonpScriptSrc(chunkId);
    onScriptComplete = function (event) {
        var chunk = installedChunks[chunkId];
        if (chunk) {
            // chunk[1] 加载 script 的 reject 回调
            chunk[1](new Error(/* ... */));
        }
    };
    script.onerror = script.onload = onScriptComplete;
    document.head.appendChild(script);
};
```

在 webpack 等模块加载器中使用动态导入时， webpack 便会用上面的 `requireEnsure` 方法来保证对应的动态 chunk 被加载。如果某个 chunk 加载失败，则会进入 `installChunkData[2]` 中储存 Promise 的 reject 流程，而 Promise 一旦进入 rejected 状态，就再也无法改变到其他状态了。也就是说， webpack 并不会给我们重试的机会。

如何打破这种局面？摆在我们面前的只有两条路：

1. 使用 webpack 插件，在编译期改写该段代码。
2. 使用 [monkey patch](https://en.wikipedia.org/wiki/Monkey_patch) 对浏览器的原生方法进行改写。

为了降低集成成本，我们选择了第二种方案，即在运行时动态改写 `document.createElement`, `Node#appendChild` 等方法。在集成 `Assets-Retry` 后，调用 `document.createElement` API 并不会创建一个真正的 `HTMLScriptElement` ，取而代之的是一个 `HookedScript` 对象。并且，在 `Node#appendChild` 等方法中，如果检测到当前元素为 `HookedScript` 对象，则将`appendChild` 目标转换为其内部保存的真正的 `HTMLScriptElement` 。

增加这层代理后，我们就可以对 `script` 标签上的 `onload`, `onerror` 回调进行拦截，并进行重试处理。如果用户想设置对象的其他属性，如 `src`, `type`，则会设置到真正的 `script` 标签上，保证其他功能不受影响。

#### 获取加载失败的背景图片

该部分通过 [CSSStyleSheet](https://developer.mozilla.org/zh-CN/docs/Web/API/CSSStyleSheet) 动态改变页面样式实现，当遇到图片类属性（如 `background-image`, `border-image`, `list-style-image`）时，自动添加一条包含备用域名的规则到网页样式中，浏览器便会自动发起重试，直到任一请求成功或均以失败告终。

### Todo

- [ ] 单元测试
- [ ] BrowserStack 兼容性测试
- [ ] 更多 demo

### 浏览器兼容性

| <img src="./public/chrome.png" width="48px" height="48px" alt="Chrome logo"> | <img src="./public/edge.png" width="48px" height="48px" alt="Edge logo"> | <img src="./public/firefox.png" width="48px" height="48px" alt="Firefox logo"> | <img src="./public/ie.png" width="48px" height="48px" alt="Internet Explorer logo"> | <img src="./public/opera.png" width="48px" height="48px" alt="Opera logo"> | <img src="./public/safari.png" width="48px" height="48px" alt="Safari logo"> |
|:---:|:---:|:---:|:---:|:---:|:---:|
| 47+ ✔ | 15+ ✔ | 32+ ✔ | 10+ ✔ | 34+ ✔ | 10+ ✔ |


### 常见问题

1. Q: 为什么我的页面在 Safari 上白屏了？
   A: 不要在页面加载完成（ `window.onload` ）之前加载任何异步的脚本，这些脚本应该被同步加载。当你这么做的时候， Safari 浏览器会认为 DOM 还未加载完毕，但此时调用 `document.write`，却会清空页面。

### NPM scripts
-   `npm t`: Run test suite
-   `npm start`: Run `npm run build` in watch mode
-   `npm run test:watch`: Run test suite in [interactive watch mode](http://facebook.github.io/jest/docs/cli.html#watch)
-   `npm run test:prod`: Run linting and generate coverage
-   `npm run build`: Generate bundles and typings, create docs
-   `npm run lint`: Lints code
-   `npm run commit`: Commit using conventional commit style ([husky](https://github.com/typicode/husky) will tell you to use it if you haven't :wink:)

### 致谢

感谢 [realworld.io](https://realworld.io) 提供的 Demo App。