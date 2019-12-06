import { innerScriptProp, innerOnerrorProp } from './constants';
import { InnerAssetsRetryOptions } from './assets-retry';
export interface HookedScript {
    [innerScriptProp]: HTMLScriptElement;
    [innerOnerrorProp]: (e: Partial<Event>) => void;
    [x: string]: any;
}
/**
 * init asynchronous retrying of script tags
 * @param {InnerAssetsRetryOptions} opts
 * @returns
 */
export default function initAsync(opts: InnerAssetsRetryOptions): import("./collector").RetryCollector;
