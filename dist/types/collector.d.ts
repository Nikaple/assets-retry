/** @description data collector */
import { retryTimesProp, succeededProp, failedProp } from './constants';
export interface RetryCollector {
    [x: string]: RetryStatistics;
}
export interface RetryStatistics {
    [retryTimesProp]: number;
    [succeededProp]: string[];
    [failedProp]: string[];
}
export declare const retryCollector: RetryCollector;
