import initAsync from './retry-async'
import initSync from './retry-sync'
import initCss from './retry-css'
import { RetryStatistics, retryCollector } from './collector'
import { maxRetryCountProp, onRetryProp, onSuccessProp, onFailProp, domainProp, win } from './constants'
import { Domain, DomainMap, prepareDomainMap } from './url'
import { setDefault, identity } from './util'

export type RetryFunction = (
    currentUrl: string,
    originalUrl: string,
    retryCollector: null | RetryStatistics
) => string | null

export type SuccessFunction = (
    currentUrl: string | null
) => string | null

export type FailFunction = (
    currentUrl: string,
    isFinal: boolean
) => string | null

export interface AssetsRetryOptions {
    [maxRetryCountProp]: number
    [onRetryProp]: RetryFunction
    [onSuccessProp]: SuccessFunction
    [onFailProp]: FailFunction
    [domainProp]: Domain
}

export interface InnerAssetsRetryOptions {
    [maxRetryCountProp]: number
    [onRetryProp]: RetryFunction
    [onSuccessProp]: SuccessFunction
    [onFailProp]: FailFunction
    [domainProp]: DomainMap
}

export default function init(opts: AssetsRetryOptions = {} as any) {
    try {
        setDefault(opts, maxRetryCountProp, 3)
        setDefault(opts, onRetryProp, identity)
        setDefault(opts, onSuccessProp, identity)
        setDefault(opts, onFailProp, identity)
        // eslint-disable-next-line
        if (typeof opts[domainProp] !== 'object') {
            throw new Error('opts.domain cannot be non-object.')
        }
        const invalidOptions = Object.keys(opts).filter(key => [maxRetryCountProp, onRetryProp, onSuccessProp, onFailProp, domainProp].indexOf(key) === -1)
        if (invalidOptions.length > 0) {
            throw new Error('option name: ' + invalidOptions.join(', ') + ' is not valid.')
        }
        const innerOpts: InnerAssetsRetryOptions = {
            [maxRetryCountProp]: opts[maxRetryCountProp],
            [onRetryProp]: opts[onRetryProp],
            [onSuccessProp]: opts[onSuccessProp],
            [onFailProp]: opts[onFailProp],
            [domainProp]: prepareDomainMap(opts[domainProp])
        }
        initAsync(innerOpts)
        initSync(innerOpts)
        if (__RETRY_IMAGE__) {
            initCss(innerOpts)
        }
        return retryCollector
    } catch (e) {
        win.console && console.error('[assetsRetry] error captured', e)
    }
}
