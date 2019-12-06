"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var collector_1 = require("./collector");
var constants_1 = require("./constants");
/**
 * generate the domain map from user
 * @example
 * generateDomainMap(['a.cdn', 'b.cdn', 'c.cdn']) // {'a.cdn': 'b.cdn', 'b.cdn': 'c.cdn', 'c.cdn': 'a.cdn'}
 *
 * @param {Domain} domains
 * @returns {DomainMap}
 */
exports.prepareDomainMap = function (domains) {
    // array
    if (Array.isArray(domains)) {
        return domains.reduce(function (domainMap, domain, idx, array) {
            domainMap[domain] = array[(idx + 1) % array.length];
            return domainMap;
        }, {});
    }
    // object
    return domains;
};
/**
 * get path from src
 * @example
 * getUrlPath('https://a.cdn/js/1.js', 'a.cdn'); // '/js/1.js'
 * getUrlPath('https://a.cdn/namespace/js/1.js', 'a.cdn/namespace'); // '/js/1.js'
 * @param {string} src script src
 * @param {string} currentDomain domain name
 * @returns {string}
 */
exports.getUrlPath = function (src, currentDomain) {
    return src.substr(src.indexOf(currentDomain) + currentDomain.length, src.length);
};
/**
 * find out the domain of current loading script
 *
 * @param {string} src
 * @param {{ [x: string]: string }} domainMap
 * @returns
 */
exports.getCurrentDomain = function (src, domainMap) {
    return (Object.keys(domainMap)
        .filter(function (domain) {
        return src.indexOf(domain) > -1;
    })
        // sort by length (relevance)
        .sort(function (prev, next) { return next.length - prev.length; })[0]);
};
/**
 * extract domain from url, and get the
 * corresponding statistic collector
 * @param {string} url
 * @returns
 */
exports.extractInfoFromUrl = function (url, domainMap) {
    var _a;
    var currentDomain = exports.getCurrentDomain(url, domainMap);
    if (!currentDomain) {
        return [];
    }
    var srcPath = exports.getUrlPath(url, currentDomain);
    collector_1.retryCollector[srcPath] = collector_1.retryCollector[srcPath] || (_a = {},
        _a[constants_1.retryTimesProp] = 0,
        _a[constants_1.failedProp] = [],
        _a[constants_1.succeededProp] = [],
        _a);
    return [currentDomain, collector_1.retryCollector[srcPath]];
};
//# sourceMappingURL=url.js.map