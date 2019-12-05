import initAsync from './retry-async'
import initSync from './retry-sync'
import initCss from './retry-css'
import { RetryStatistics, retryCollector } from './collector'
import { maxRetryCountProp, onRetryProp, domainProp, win } from './constants'
import { Domain, DomainMap, prepareDomainMap } from './url'
import { setDefault, identity } from './util'

export type RetryFunction = (
    currentUrl: string,
    originalUrl: string,
    retryCollector: null | RetryStatistics
) => string | null

export interface AssetsRetryOptions {
    [maxRetryCountProp]: number
    [onRetryProp]: RetryFunction
    [domainProp]: Domain
}

export interface InnerAssetsRetryOptions {
    [maxRetryCountProp]: number
    [onRetryProp]: RetryFunction
    [domainProp]: DomainMap
}

export default function init(opts: AssetsRetryOptions = {} as any) {
    try {
        setDefault(opts, maxRetryCountProp, 3)
        setDefault(opts, onRetryProp, identity)
        if (typeof opts[domainProp] !== 'object') {
            throw new Error('opts.domain cannot be non-object.')
        }
        const innerOpts: InnerAssetsRetryOptions = {
            [maxRetryCountProp]: opts[maxRetryCountProp],
            [onRetryProp]: opts[onRetryProp],
            [domainProp]: prepareDomainMap(opts[domainProp])
        }
        initAsync(innerOpts)
        initSync(innerOpts)
        if (__RETRY_IMAGE__) {
            initCss(innerOpts)
        }
        return retryCollector
    } catch (e) {
        console.error('[assetsRetry] error captured')
    }
}
