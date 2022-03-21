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
    win
} from './constants'
import { Domain, DomainMap, prepareDomainMaps } from './url'
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
        // eslint-disable-next-line
        // 域名列表，只有在域名列表中的资源，才会被重试，未设置domain直接报错
        if (typeof opts[domainProp] !== 'object') {
            throw new Error('opts.domain cannot be non-object.')
        }
        // 获取配置key值 [maxRetryCount, onRetry, onSuccess, onFail, domain]
        const optionList = [maxRetryCountProp, onRetryProp, onSuccessProp, onFailProp, domainProp]
        // 过滤用户配置key(拿到不符合的值)，防止未定义值干扰
        const invalidOptions = Object.keys(opts).filter(key => optionList.indexOf(key) === -1)
        // 如果出现校验不通过的key值，直接报错
        if (invalidOptions.length > 0) {
            throw new Error('option name: ' + invalidOptions.join(', ') + ' is not valid.')
        }
        // 内部默认配置，用户配置覆盖默认配置
        const innerOpts: InnerAssetsRetryOptions = {
            [maxRetryCountProp]: opts[maxRetryCountProp] || 3, // 最大重试次数
            [onRetryProp]: opts[onRetryProp] || identity, // 重载请求之前方法调用，可改写重载的url，一般用于有逻辑判断后修改重url或是重载前的一个拦截
            [onSuccessProp]: opts[onSuccessProp] || noop, //对于给定资源，要么调用 onSuccess ，要么调用 onFail，标识其最终的加载状态,加载详细信息（成功的 URL、失败的 URL 列表、重试次数）
            [onFailProp]: opts[onFailProp] || noop, //fail 详情
            [domainProp]: prepareDomainMaps(opts[domainProp]) // 域名列表，只有在域名列表中的资源，才会被重试
        }
        // 初始化异步资源
        initAsync(innerOpts)
        initSync(innerOpts)
        // process.env.__RETRY_IMAGE__ build时构建如果false就会绕过css 重试
        if (__RETRY_IMAGE__) {
            // initCss(innerOpts)
        }
        return retryCollector
    } catch (e) {
        win.console && console.error('[assetsRetry] error captured', e)
    }
}
