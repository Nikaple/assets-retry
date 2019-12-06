"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var util_1 = require("./util");
var url_1 = require("./url");
var constants_1 = require("./constants");
/**
 * init synchronous retrying of assets,
 * this includes the retrying of
 * script, link and img tags
 *
 * @export
 * @param {InnerAssetsRetryOptions} opts
 */
function initSync(opts) {
    var onRetry = opts.onRetry;
    var getTargetUrl = function (target) {
        if (target instanceof HTMLScriptElement || target instanceof HTMLImageElement) {
            return target.src;
        }
        if (target instanceof HTMLLinkElement) {
            return target.href;
        }
        return null;
    };
    /**
     * capture error on window
     * when js / css / image failed to load
     * reload the target with new domain
     *
     * @param {ErrorEvent} event
     * @returns
     */
    var errorHandler = function (event) {
        if (!event) {
            return;
        }
        var target = event.target || event.srcElement;
        var domainMap = opts.domain;
        var originalUrl = getTargetUrl(target);
        if (!originalUrl) {
            // not one of script / link / image element
            return;
        }
        var _a = url_1.extractInfoFromUrl(originalUrl, domainMap), currentDomain = _a[0], currentCollector = _a[1];
        if (!currentCollector || !currentDomain) {
            return;
        }
        currentCollector[constants_1.retryTimesProp]++;
        currentCollector[constants_1.failedProp].push(originalUrl);
        if (!domainMap[currentDomain] || currentCollector[constants_1.retryTimesProp] > opts.maxRetryCount) {
            // can not find a domain to switch
            // or failed too many times
            return;
        }
        var newDomain = domainMap[currentDomain];
        var newUrl = util_1.stringReplace(originalUrl, currentDomain, newDomain);
        var userModifiedUrl = onRetry(newUrl, originalUrl, currentCollector);
        // if onRetry returns null, do not retry this url
        if (userModifiedUrl === null) {
            return;
        }
        // eslint-disable-next-line
        if (typeof userModifiedUrl !== 'string') {
            throw new Error('a string should be returned in `onRetry` function');
        }
        console.log('[document.onerror]', userModifiedUrl);
        var onloadCallback = function () {
            currentCollector[constants_1.succeededProp].push(userModifiedUrl);
        };
        if (target instanceof HTMLScriptElement && !target.getAttribute(constants_1.hookedIdentifier) && target.src) {
            util_1.loadNextScript(target, userModifiedUrl, onloadCallback);
            return;
        }
        if (target instanceof HTMLLinkElement && target.href) {
            util_1.loadNextLink(target, userModifiedUrl, onloadCallback);
            return;
        }
        if (target instanceof HTMLImageElement && target.src) {
            target.src = userModifiedUrl;
            target.onload = onloadCallback;
        }
    };
    constants_1.doc.addEventListener('error', errorHandler, true);
}
exports.default = initSync;
//# sourceMappingURL=retry-sync.js.map