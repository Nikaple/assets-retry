English | [简体中文](./README-cn.md)

# Auto Assets Retry

[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![Greenkeeper badge](https://badges.greenkeeper.io/Nikaple/assets-retry.svg)](https://greenkeeper.io/)
[![Travis](https://img.shields.io/travis/Nikaple/assets-retry.svg)](https://travis-ci.org/Nikaple/assets-retry)
[![Coverage Status](https://coveralls.io/repos/github/Nikaple/assets-retry/badge.svg?branch=master)](https://coveralls.io/github/Nikaple/assets-retry?branch=master)
[![Dev Dependencies](https://david-dm.org/Nikaple/assets-retry/dev-status.svg)](https://david-dm.org/Nikaple/assets-retry?type=dev)

A tiny 5 KB non-intrusive library to retry your assets (scripts, stylesheets, images) when they failed to load, even works with dynamic import!

![Demo GIF](./public/assets-retry.gif)
### [Demo URL](https://nikaple.com/assets-retry/vue/)

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Config](#config)
- [Todo](#todo)

### Installation

#### Install with npm

```bash
$ npm install assets-retry --save
```

Then, inject the library **at the beginning** of the page with proper webpack configurations.

#### Use inline script directly

If you don't want to spend your time fiddling around with webpack configurations, you can inline the [minified file](https://github.com/Nikaple/assets-retry/dist/assets-retry.umd.js) with a script tag, and place it at the beginning of the page.

### Usage

All you have to provide is the domain parameter, which are the domains to retry when assets failed to load.

```js
// information of assets
var assetsRetryStatistics = window.assetsRetry({
    // domain list, only resources in the domain list will be retried.
    domain: ['your.first.domain', 'your.second.domain/namespace'],
    // maximum retry count for each asset, default is 3
    maxRetryCount: 3
    // onRetry hook is how you customize retry logic, default is x => x
    onRetry: function(currentUrl, originalUrl, statistics) {
        return currentUrl
    }
})
```
When the initialization is finished, following content gains the power of retrying automatically.
- [x] All `<script>` tag in html
- [x] All `<link rel="stylesheet">` tag in html
- [x] All `<img>` tag in html
- [x] All dynamic script element created with `document.createElement`, such as [dynamic import](https://webpack.js.org/guides/code-splitting/#dynamic-imports).
- [x] All `background-image` in `css`


### Config

The `assetsRetry` takes an `AssetsRetryOptions`, which is defined as follows:
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

### Todo

- [ ] Unit tests
- [ ] BrowserStack compatibility test
- [ ] more demo

