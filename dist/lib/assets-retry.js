"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var retry_async_1 = require("./retry-async");
var retry_sync_1 = require("./retry-sync");
var retry_css_1 = require("./retry-css");
var collector_1 = require("./collector");
var constants_1 = require("./constants");
var url_1 = require("./url");
var util_1 = require("./util");
function init(opts) {
    var _a;
    if (opts === void 0) { opts = {}; }
    try {
        util_1.setDefault(opts, constants_1.maxRetryCountProp, 3);
        util_1.setDefault(opts, constants_1.onRetryProp, util_1.identity);
        if (typeof opts[constants_1.domainProp] !== 'object') {
            throw new Error('opts.domain cannot be non-object.');
        }
        var innerOpts = (_a = {},
            _a[constants_1.maxRetryCountProp] = opts[constants_1.maxRetryCountProp],
            _a[constants_1.onRetryProp] = opts[constants_1.onRetryProp],
            _a[constants_1.domainProp] = url_1.prepareDomainMap(opts[constants_1.domainProp]),
            _a);
        retry_async_1.default(innerOpts);
        retry_sync_1.default(innerOpts);
        if (__RETRY_IMAGE__) {
            retry_css_1.default(innerOpts);
        }
        return collector_1.retryCollector;
    }
    catch (e) {
        console.error('[assetsRetry] error captured');
    }
}
exports.default = init;
//# sourceMappingURL=assets-retry.js.map