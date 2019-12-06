"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var util_1 = require("./util");
var constants_1 = require("./constants");
var collector_1 = require("./collector");
var url_1 = require("./url");
var retry_css_1 = require("./retry-css");
// cache all properties of HTMLScriptElement.prototype
// (including prototype properties) because it's big (length > 200)
// otherwise it would be calculated every time when
// a script request failed.
var scriptProperties = util_1.collectPropertyNames(HTMLScriptElement.prototype);
/**
 * create the descriptor of hooked script object,
 * accessing any property on the hooked script object
 * will be delegated to the real HTMLScriptElement
 * except onload/onerror events
 *
 * @param {any} self hookedScript
 * @param {object} opts
 * @returns
 */
var getHookedScriptDescriptors = function (self, opts) {
    var maxRetryCount = opts[constants_1.maxRetryCountProp];
    var domainMap = url_1.prepareDomainMap(opts[constants_1.domainProp]);
    var onRetry = opts[constants_1.onRetryProp];
    return scriptProperties.reduce(function (descriptor, key) {
        var isFn = util_1.isFunctionProperty(HTMLScriptElement.prototype, key);
        // for function properties,
        // do not assign getters/setters
        if (isFn) {
            descriptor[key] = {
                value: function () {
                    return self[constants_1.innerScriptProp][key].apply(self[constants_1.innerScriptProp], arguments);
                }
            };
        }
        else {
            descriptor[key] = {
                set: function (newVal) {
                    if (key === 'onerror') {
                        self[constants_1.innerOnerrorProp] = newVal;
                        self[constants_1.innerScriptProp].onerror = function (event) {
                            event.stopPropagation && event.stopPropagation();
                            var src = self[constants_1.innerScriptProp].src;
                            var _a = url_1.extractInfoFromUrl(src, domainMap), currentDomain = _a[0], currentCollector = _a[1];
                            if (!currentDomain || !currentCollector) {
                                return;
                            }
                            var newSrc = util_1.stringReplace(src, currentDomain, domainMap[currentDomain]);
                            var userModifiedSrc = onRetry(newSrc, src, currentCollector);
                            // if onRetry returns null, do not retry this url
                            if (userModifiedSrc === null) {
                                return;
                            }
                            if (typeof userModifiedSrc !== 'string') {
                                throw new Error('a string should be returned in `onRetry` function');
                            }
                            if (currentCollector[constants_1.retryTimesProp] < maxRetryCount) {
                                util_1.loadNextScript(self[constants_1.innerScriptProp], userModifiedSrc);
                            }
                            else {
                                util_1.safeCall(self[constants_1.innerOnerrorProp], self[constants_1.innerScriptProp], event);
                            }
                        };
                        return;
                    }
                    if (key === 'onload') {
                        self[constants_1.innerOnloadProp] = newVal;
                        self[constants_1.innerScriptProp].onload = function (event) {
                            var src = self[constants_1.innerScriptProp].src;
                            var _a = url_1.extractInfoFromUrl(src, domainMap), _ = _a[0], currentCollector = _a[1];
                            if (!currentCollector) {
                                return;
                            }
                            if (currentCollector[constants_1.failedProp].indexOf(src) === -1) {
                                currentCollector[constants_1.succeededProp].push(src);
                            }
                            if (newVal && !newVal._called) {
                                newVal._called = true;
                                newVal.call(self[constants_1.innerScriptProp], event);
                            }
                        };
                        return;
                    }
                    ;
                    self[constants_1.innerScriptProp][key] = newVal;
                },
                get: function () {
                    return self[constants_1.innerScriptProp][key];
                }
            };
        }
        return descriptor;
    }, {});
};
var createHookedScript = function ($script, opts) {
    var _a;
    $script.setAttribute(constants_1.hookedIdentifier, 'true');
    var $hookedScript = (_a = {},
        _a[constants_1.innerScriptProp] = $script,
        _a[constants_1.innerOnerrorProp] = util_1.noop,
        _a);
    var descriptors = getHookedScriptDescriptors($hookedScript, opts);
    Object.defineProperties($hookedScript, descriptors);
    return $hookedScript;
};
/**
 * hook `document.createElement`
 * @param {InnerAssetsRetryOptions} opts
 */
var hookCreateElement = function (opts) {
    var originalCreateElement = constants_1.doc.createElement;
    constants_1.doc.createElement = function (name, options) {
        if (name === constants_1.scriptTag) {
            return createHookedScript(originalCreateElement.call(constants_1.doc, constants_1.scriptTag), opts);
        }
        return originalCreateElement.call(constants_1.doc, name, options);
    };
    constants_1.doc.createElement.toString = function () {
        return 'function createElement() { [native code] }';
    };
};
/**
 * create a hooked function which hooks every method of target.
 * if a method is hooked and its arguments contains the inner script tag
 * it will be replaced with the value of inner script tag
 *
 * @param {any} target hook target
 */
var hookPrototype = function (target, opts) {
    var functionKeys = Object.keys(target).filter(function (key) { return util_1.isFunctionProperty(target, key); });
    functionKeys.forEach(function (key) {
        var originalFunc = target[key];
        target[key] = function () {
            var args = [].slice.call(arguments).map(function (item) {
                return util_1.hasOwn.call(item, constants_1.innerScriptProp) ? item[constants_1.innerScriptProp] : item;
            });
            if (__RETRY_IMAGE__) {
                var isInsertOp = [
                    'append',
                    'appendChild',
                    'insertBefore',
                    'replaceChild',
                    'insertAdjacentElement',
                    'prepend'
                ].indexOf(key) > -1;
                if (isInsertOp && args[0] instanceof HTMLLinkElement) {
                    args[0].addEventListener('load', function () {
                        setTimeout(function () { return retry_css_1.default(opts); }, 100);
                    });
                }
            }
            return originalFunc.apply(this, args);
        };
        // keep original toString
        if (/^\w+$/.test(key)) {
            target[key].toString = new Function("return 'function " + key + "() { [native code] }'");
        }
    });
};
/**
 * init asynchronous retrying of script tags
 * @param {InnerAssetsRetryOptions} opts
 * @returns
 */
function initAsync(opts) {
    hookCreateElement(opts);
    if (typeof Node !== 'undefined') {
        hookPrototype(Node.prototype, opts);
    }
    if (typeof Element !== 'undefined') {
        hookPrototype(Element.prototype, opts);
    }
    return collector_1.retryCollector;
}
exports.default = initAsync;
//# sourceMappingURL=retry-async.js.map