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
        // eslint-disable-next-line
        if (typeof opts[constants_1.domainProp] !== 'object') {
            throw new Error('opts.domain cannot be non-object.');
        }
        var invalidOptions = Object.keys(opts).filter(function (key) { return [constants_1.maxRetryCountProp, constants_1.onRetryProp, constants_1.domainProp].indexOf(key) === -1; });
        if (invalidOptions.length > 0) {
            throw new Error('option name: ' + invalidOptions.join(', ') + ' is not valid.');
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
        console.error('[assetsRetry] error captured', e);
    }
}
exports.default = init;
//# sourceMappingURL=assets-retry.js.map