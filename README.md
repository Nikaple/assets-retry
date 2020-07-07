English | [简体中文](./README-cn.md)

# Auto Assets Retry

[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![Greenkeeper badge](https://badges.greenkeeper.io/Nikaple/assets-retry.svg)](https://greenkeeper.io/)
[![Travis](https://img.shields.io/travis/Nikaple/assets-retry.svg)](https://travis-ci.org/Nikaple/assets-retry)
[![Coverage Status](https://coveralls.io/repos/github/Nikaple/assets-retry/badge.svg?branch=master)](https://coveralls.io/github/Nikaple/assets-retry?branch=master)
[![Dev Dependencies](https://david-dm.org/Nikaple/assets-retry/dev-status.svg)](https://david-dm.org/Nikaple/assets-retry?type=dev)
[![BrowserStack Status](https://automate.browserstack.com/badge.svg?badge_key=VTVHakxTU3EyUjl1M1lWN0VEbTdzZjBmbzZqRG9aNHVuSWZWODBNTHY2az0tLTZ4TEtuNktYSUwzK2V5SlpleFRINUE9PQ==--5737afaf240f8e5eb5cc6beb0f2460666ea0e33c)](https://automate.browserstack.com/public-build/VTVHakxTU3EyUjl1M1lWN0VEbTdzZjBmbzZqRG9aNHVuSWZWODBNTHY2az0tLTZ4TEtuNktYSUwzK2V5SlpleFRINUE9PQ==--5737afaf240f8e5eb5cc6beb0f2460666ea0e33c)

A tiny non-intrusive library to retry your assets (scripts, stylesheets, images) when they failed to load, only 3 KB gzipped, even works with dynamic import!

![Demo GIF](./public/assets-retry.gif)
### [Demo URL](https://nikaple.com/assets-retry/vue/)

## Table of Contents

- [Installation](#installation)
    + [Install with npm](#install-with-npm)
    + [Use inline script directly](#use-inline-script-directly)
- [Usage](#usage)
- [Config](#config)
- [Todo](#todo)
- [FAQ](#FAQ)
- [Browser Support](#browser-support)
- [Acknowledgement](#acknowledgement)

### Installation

#### Install with npm

```bash
$ npm install assets-retry --save
```

Then, inject the library **at the beginning** of the page with proper webpack configurations. [See example](./examples/webpack)

#### Use inline script directly

If you don't want to spend your time fiddling around with webpack configurations, you can inline the [minified file](https://github.com/Nikaple/assets-retry/blob/master/dist/assets-retry.umd.js) with a script tag, and place it **at the beginning** of the page.

### Usage

All you have to provide is the domain parameter, which are the domains to retry when assets failed to load.

```js
// information of assets
var assetsRetryStatistics = window.assetsRetry({
    // domain list, only resources in the domain list will be retried.
    domain: ['your.first.domain', 'your.second.domain/namespace'],
    // maximum retry count for each asset, default is 3
    maxRetryCount: 3,
    // onRetry hook is how you can customize retry logic with, default is x => x
    onRetry: function(currentUrl, originalUrl, statistics) {
        return currentUrl
    },
    // onSuccess executes when asset is successfully loaded, you can do some reporting here
    onSuccess: function(currentUrl) {
        console.log(currentUrl)
    },
    // onFail executes when asset is fail to load, you can do some reporting or give some tips here
    onFail:function(currentUrl, isFinal) {
        console.log(currentUrl, isFinal)
    }, 
})
```
When the initialization is finished, following content gains the power of retrying automatically.
- [x] All `<script>` tag in html
- [x] All `<link rel="stylesheet">` tag in html ([properly configured](#FAQ))
- [x] All `<img>` tag in html
- [x] All dynamic script element created with `document.createElement`, such as [dynamic import](https://webpack.js.org/guides/code-splitting/#dynamic-imports).
- [x] All `background-image` in `css`


### Config

The `assetsRetry` function takes an `AssetsRetryOptions`, which is defined as follows:
```ts
interface AssetsRetryOptions {
    maxRetryCount: number;
    onRetry: RetryFunction;
    onSuccess: SuccessFunction;
    onFail: FailFunction;
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
type SuccessFunction = (
    currentUrl: string | null
) => string | null
type FailFunction = (
    currentUrl: string,
    isFinal: boolean
) => string | null
type Domain = string[] | { [x: string]: string; }
```

- `domain`: domain list, can be array or object type
    * array type: assets will be retried from each domain in sequence, until it's loaded successfully or exceed maximum retry times.
    * object type: `{ 'a.cdn': 'b.cdn', 'c.cdn': 'd.cdn' }` means failed assets from `a.cdn` should be retried from `b.cdn`, failed assets from `c.cdn` should be retried from `d.cdn`
- `maxRetryCount`: maximum retry count for each asset, default is 3
- `onRetry`: hook function which was called before trying to load assets, it takes 3 parameters:
    * `currentUrl`: next url to try
    * `originalUrl`: last failed url
    * `retryCollector`: information collector for current asset, if the asset was from `url()` function defined in your stylesheets, **it will be null**. When it's not `null`, it's an object with following properties:
        - `retryTimes`: current retry times (starts from 1)
        - `failed`: failed assets list(may be duplicated when retrying from the same domain multiple times)
        - `succeeded`: succeeded assets list
    `onRetry` must return a `String` or `null`:
        - when null was returned, current retry will be terminated.
        - when string was returned, current retry url will be the return value.
    `onSuccess` must return a `String` or `null`:
        - return asset url that successfully loaded.
    `onFail` must return a `String` or `null`:
        - return asset url that fails to load and whether it was the last retry.

### Todo

- [ ] Unit tests
- [x] BrowserStack compatibility test
- [ ] more demo

### FAQ

1. Q: Stylesheets or background images are not retried from backup domain, why?

   A: Due to security policies of browsers, access to `cssRules` is not allowed for cross origin stylesheets by default. To fix this:
      1. Add `crossorigin="anonymous"` attribute on link element for the cross origin stylesheet。
      2. Make sure that [Access-Control-Allow-Origin](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Origin) HTTP Header is correct.

### Browser Support

| <img src="./public/chrome.png" width="48px" height="48px" alt="Chrome logo"> | <img src="./public/edge.png" width="48px" height="48px" alt="Edge logo"> | <img src="./public/firefox.png" width="48px" height="48px" alt="Firefox logo"> | <img src="./public/ie.png" width="48px" height="48px" alt="Internet Explorer logo"> | <img src="./public/opera.png" width="48px" height="48px" alt="Opera logo"> | <img src="./public/safari.png" width="48px" height="48px" alt="Safari logo"> | <img src="./public/ios.png" height="48px" alt="ios logo"> |<img src="./public/android.svg" width="48px" height="48px" alt="android logo"> |
|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| 47+ ✔ | 15+ ✔ | 32+ ✔ | 10+ ✔ | 34+ ✔ | 10+ ✔ | 10+ ✔ | 4.4+ ✔ | 

### NPM scripts
-   `npm t`: Run test suite
-   `npm start`: Run `npm run build` in watch mode
-   `npm run test:watch`: Run test suite in [interactive watch mode](http://facebook.github.io/jest/docs/cli.html#watch)
-   `npm run test:prod`: Run linting and generate coverage
-   `npm run build`: Generate bundles and typings, create docs
-   `npm run lint`: Lints code
-   `npm run commit`: Commit using conventional commit style ([husky](https://github.com/typicode/husky) will tell you to use it if you haven't :wink:)

### Acknowledgement

<img src="./public/realworld.png" alt="RealWorld" width="400" /><img src="./public/browser-stack.svg" alt="BrowserStack" width="250" />

1. The example projects are based on amazing [RealWorld](https://realworld.io) demo apps.
2. Cross browser testing are based on the rather excellent [BrowserStack](http://browserstack.com/) UI testing technology.
