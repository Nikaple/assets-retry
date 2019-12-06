"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var util_1 = require("./util");
var constants_1 = require("./constants");
var url_1 = require("./url");
// cache
var handledStylesheets = {};
var supportRules = function (styleSheet) {
    try {
        return styleSheet.rules && styleSheet.rules.length > 0;
    }
    catch (_) {
        return false;
    }
};
var processRules = function (name, rule, ruleIndex, styleSheet, opts) {
    var domainMap = opts.domain;
    var onRetry = opts.onRetry;
    var targetRule = rule.style && rule.style[name];
    if (!targetRule) {
        return;
    }
    // skip data-uri
    if (/^url\(["']?data:/.test(targetRule)) {
        return;
    }
    var _a = targetRule.match(/^url\(["|'](.*)["|']\)/) || [], _ = _a[0], originalUrl = _a[1];
    if (!originalUrl) {
        return;
    }
    var currentDomain = url_1.getCurrentDomain(originalUrl, domainMap);
    if (!currentDomain || !domainMap[currentDomain]) {
        return;
    }
    var urlList = Object.keys(domainMap)
        .filter(function (domain) { return domain !== currentDomain; })
        .map(function (domain) {
        var newUrl = util_1.stringReplace(originalUrl, currentDomain, domain);
        var userModifiedUrl = onRetry(newUrl, originalUrl, null);
        return "url(\"" + userModifiedUrl + "\")";
    })
        .join(',');
    var cssText = rule.selectorText + ("{ " + util_1.toSlug(name) + ": " + urlList + "; }");
    try {
        styleSheet.insertRule(cssText, styleSheet.rules.length);
    }
    catch (_) {
        styleSheet.insertRule(cssText, 0);
    }
};
function initCss(opts) {
    // detect is support styleSheets
    var supportStyleSheets = document.styleSheets && document.styleSheets[0];
    if (!supportStyleSheets)
        return false;
    var styleSheets = util_1.arrayFrom(constants_1.doc.styleSheets);
    var urlProperties = ['backgroundImage', 'borderImage', 'listStyleImage'];
    // TODO: iterating stylesheets may cause performance issues
    // maybe find other approaches?
    styleSheets.forEach(function (styleSheet) {
        // styleSheet
        if (!supportRules(styleSheet)) {
            return;
        }
        if (handledStylesheets[styleSheet.href]) {
            return;
        }
        var styleRules = util_1.arrayFrom(styleSheet.rules);
        styleRules.forEach(function (rule, ruleIndex) {
            urlProperties.forEach(function (cssProperty) {
                processRules(cssProperty, rule, ruleIndex, styleSheet, opts);
            });
        });
        if (styleSheet.href) {
            handledStylesheets[styleSheet.href] = true;
        }
    });
}
exports.default = initCss;
//# sourceMappingURL=retry-css.js.map