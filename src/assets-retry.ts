import initAsync from './retry-async'
import initSync from './retry-sync'
import initCss from './retry-css'
import { RetryStatistics, retryCollector } from './collector'
import {
    maxRetryCountProp,
    onRetryProp,
    onSuccessProp,
    onFailProp,
    domainProp,
    win,
    styleImageNoImportant
} from './constants'
import { Domain, DomainMap, prepareDomainMap } from './url'
import { identity, noop } from './util'

export type RetryFunction = (
    currentUrl: string,
    originalUrl: string,
    retryCollector: null | RetryStatistics
) => string | null
export type SuccessFunction = (currentPath: string) => void
export type FailFunction = (currentPath: string) => void

export interface AssetsRetryOptions {
    [maxRetryCountProp]: number
    [onRetryProp]?: RetryFunction
    [onSuccessProp]?: SuccessFunction
    [onFailProp]?: FailFunction
    [domainProp]: Domain
    [styleImageNoImportant]?: boolean
}

export interface InnerAssetsRetryOptions {
    [maxRetryCountProp]: number
    [onRetryProp]: RetryFunction
    [onSuccessProp]: SuccessFunction
    [onFailProp]: FailFunction
    [domainProp]: DomainMap
    [styleImageNoImportant]: boolean
}

export default function init(opts: AssetsRetryOptions = {} as any) {
    try {
        // eslint-disable-next-line
        if (typeof opts[domainProp] !== 'object') {
            throw new Error('opts.domain cannot be non-object.')
        }
        const optionList = [maxRetryCountProp, onRetryProp, onSuccessProp, onFailProp, domainProp, styleImageNoImportant]
        const invalidOptions = Object.keys(opts).filter(key => optionList.indexOf(key) === -1)
        if (invalidOptions.length > 0) {
            throw new Error('option name: ' + invalidOptions.join(', ') + ' is not valid.')
        }
        const innerOpts: InnerAssetsRetryOptions = {
            [maxRetryCountProp]: opts[maxRetryCountProp] || 3,
            [onRetryProp]: opts[onRetryProp] || identity,
            [onSuccessProp]: opts[onSuccessProp] || noop,
            [onFailProp]: opts[onFailProp] || noop,
            [domainProp]: prepareDomainMap(opts[domainProp]),
            [styleImageNoImportant]: opts[styleImageNoImportant] || false
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
