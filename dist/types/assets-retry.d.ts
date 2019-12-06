import { RetryStatistics } from './collector';
import { maxRetryCountProp, onRetryProp, domainProp } from './constants';
import { Domain, DomainMap } from './url';
export declare type RetryFunction = (currentUrl: string, originalUrl: string, retryCollector: null | RetryStatistics) => string | null;
export interface AssetsRetryOptions {
    [maxRetryCountProp]: number;
    [onRetryProp]: RetryFunction;
    [domainProp]: Domain;
}
export interface InnerAssetsRetryOptions {
    [maxRetryCountProp]: number;
    [onRetryProp]: RetryFunction;
    [domainProp]: DomainMap;
}
export default function init(opts?: AssetsRetryOptions): import("./collector").RetryCollector | undefined;
