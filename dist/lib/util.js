"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var constants_1 = require("./constants");
exports.identity = function (x) {
    return x;
};
exports.noop = function () {
    /* noop */
};
exports.hasOwn = Object.prototype.hasOwnProperty;
/**
 * safely calls a function
 *
 * @template T this
 * @template R ReturnType<func>
 * @param {(this: T, ...callbackArgs: any[]) => R} func
 * @param {T} thisArg
 * @param {*} args
 * @returns {R}
 */
exports.safeCall = function (func, thisArg, args) {
    if (typeof func !== 'function') {
        return null;
    }
    return func.call(thisArg, args);
};
/**
 * replace a substring with new one
 *
 * @param {string} current current string
 * @param {string} oldStr substring to replace
 * @param {string} newStr new string
 * @returns
 */
exports.stringReplace = function (current, oldStr, newStr) {
    var idx = current.indexOf(oldStr);
    return current.substring(0, idx) + newStr + current.substring(idx + oldStr.length);
};
/**
 * convert a camelCase string to a dash-separated string.
 *
 * @param {string} str
 * @returns
 */
exports.toSlug = function (str) {
    return str.replace(/([a-z])([A-Z])/g, function (_, $1, $2) { return $1 + "-" + $2.toLowerCase(); });
};
/**
 * set default value for object
 *
 * @param {any} obj object
 * @param {string} key key
 * @param {any} defaultValue default value
 */
exports.setDefault = function (obj, key, defaultValue) {
    obj[key] = obj[key] || defaultValue;
};
/**
 * transform an array-like object to array
 *
 * @template T
 * @param {ArrayLike<T>} arrayLike
 * @returns {T[]}
 */
exports.arrayFrom = function (arrayLike) {
    return [].slice.call(arrayLike);
};
/**
 * collect all property names from current object to its ancestor
 *
 * @param {any} obj
 * @returns
 */
exports.collectPropertyNames = function (obj) {
    var getProto = Object.getPrototypeOf
        ? Object.getPrototypeOf
        : function (x) {
            return x.__proto__;
        };
    var keys = Object.keys(obj);
    while (getProto(obj)) {
        keys = keys.concat(Object.keys(getProto(obj)));
        obj = getProto(obj);
    }
    return keys;
};
/**
 * @example
 * isFunctionProperty(HTMLScriptElement.prototype, 'src); // false
 * isFunctionProperty(HTMLScriptElement.prototype, 'getAttribute'); // true
 * @param {any} proto
 * @param {string} key
 * @returns
 */
exports.isFunctionProperty = function (proto, key) {
    try {
        return typeof proto[key] === 'function';
    }
    catch (e) {
        // TypeError: Illegal invocation
        // when evaluating properties like
        // HTMLScriptElement.prototype.src
        return false;
    }
};
/**
 * loads a new script element by previous failed script element
 *
 * @param {HTMLScriptElement} $script previous script element
 * @param {string} newSrc new url to try
 */
exports.loadNextScript = function ($script, newSrc, onload) {
    if (onload === void 0) { onload = exports.noop; }
    // when dealing with failed script tags in html,
    // use `document.write` to ensure the correctness
    // of loading order
    if (document.readyState === 'loading') {
        console.log('[document.write]', newSrc);
        var retryId = Math.random()
            .toString(36)
            .slice(2);
        var newHtml = $script.outerHTML
            // delete previous retry id
            .replace(/data-retry-id="[^"]+"/, '')
            .replace(/src=(?:"[^"]+"|.+)([ >])/, constants_1.retryIdentifier + "=" + retryId + " src=\"" + newSrc + "\"$1");
        document.write(newHtml);
        var newScript = document.querySelector("script[" + constants_1.retryIdentifier + "=\"" + retryId + "\"]");
        if (newScript) {
            newScript.onload = onload;
        }
        return;
    }
    var $newScript = constants_1.doc.createElement(constants_1.scriptTag);
    console.log('[document.createElement]', newSrc);
    // copy script properties except src:
    // type, noModule, charset, async, defer,
    // crossOrigin, text, referrerPolicy, event,
    // htmlFor, integrity (chrome)
    Object.keys(HTMLScriptElement.prototype).forEach(function (key) {
        if (key !== 'src' && $script[key] && typeof $script[key] !== 'object') {
            try {
                ;
                $newScript[key] = $script[key];
            }
            catch (_) {
                /* noop */
            }
        }
    });
    $newScript.src = newSrc;
    $newScript.onload = $script.onload;
    $newScript.onerror = $script.onerror;
    // webpack nonce for csp
    var originalNonce = $script.getAttribute('nonce');
    if (originalNonce) {
        $newScript.setAttribute('nonce', originalNonce);
    }
    constants_1.doc.getElementsByTagName('head')[0].appendChild($newScript);
};
/**
 * loads a new link element by previous failed link element
 *
 * @param {HTMLLinkElement} $link previous link element
 * @param {string} newHref new url to try
 */
exports.loadNextLink = function ($link, newHref, onload) {
    var $newLink = constants_1.doc.createElement(constants_1.linkTag);
    // copy link properties except href:
    // disabled, href, crossOrigin, rel, relList, media, hreflang,
    // type, as, referrerPolicy, sizes, imageSrcset, imageSizes,
    // charset, rev, target, sheet, integrity, import (chrome)
    Object.keys(HTMLLinkElement.prototype).forEach(function (key) {
        if (key !== 'href' && $link[key] && typeof $link[key] !== 'object') {
            try {
                ;
                $newLink[key] = $link[key];
            }
            catch (_) {
                /* noop */
            }
        }
    });
    $newLink.href = newHref;
    $newLink.onload = onload;
    constants_1.doc.getElementsByTagName('head')[0].appendChild($newLink);
};
//# sourceMappingURL=util.js.map