/** @description data collector */

import { retryTimesProp, succeededProp, failedProp } from './constants'

export interface RetryCollector {
    [x: string]: RetryStatistics
}

export interface RetryStatistics {
    [retryTimesProp]: number
    [succeededProp]: string[]
    [failedProp]: string[]
}

// statistic collector
export const retryCollector: RetryCollector = {}
