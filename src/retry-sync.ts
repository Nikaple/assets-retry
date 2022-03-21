import {
    stringReplace,
    loadNextScript,
    loadNextLink,
    hashTarget,
    randomString,
    arrayFrom,
    getCssRules,
    getTargetUrl
} from './util'
import { InnerAssetsRetryOptions } from './assets-retry'
import { extractInfoFromUrl, splitUrl } from './url'
import {
    retryTimesProp,
    failedProp,
    hookedIdentifier,
    succeededProp,
    doc,
    retryIdentifier,
    onRetryProp,
    onSuccessProp,
    onFailProp,
    domainProp,
    maxRetryCountProp,
    ScriptElementCtor,
    LinkElementCtor,
    ImageElementCtor,
    ignoreIdentifier
} from './constants'

const retryCache: { [x: string]: boolean } = {}

/**
 * init synchronous retrying of assets,
 * this includes the retrying of
 * script, link and img tags
 *
 * @export
 * @param {InnerAssetsRetryOptions} opts
 */
export default function initSync(opts: InnerAssetsRetryOptions) {
    // opts入参
    const onRetry = opts[onRetryProp]
    const onSuccess = opts[onSuccessProp]
    const onFail = opts[onFailProp]
    const domainMap = opts[domainProp]
    /**
     * capture error on window
     * when js / css / image failed to load
     * reload the target with new domain
     *
     * @param {ErrorEvent} event
     * @returns
     */
    const errorHandler = function(event: Event) {
        if (!event) {
            return
        }
        const target = event.target || event.srcElement
        // 判断是否是HTMLScriptElement、HTMLLinkElement、HTMLImageElement获取对应的链接
        const originalUrl = getTargetUrl(target)
        if (!originalUrl) {
            // not one of script / link / image element
            return
        }
        // 获取当前请求的domain、和收集器（retryTimes次数，failed失败请求url数组、succeeded成功请求url数组）
        const [currentDomain, currentCollector] = extractInfoFromUrl(originalUrl, domainMap)
        // 是否存在忽略标识 data-assets-retry-ignore
        const hasIgnoreIdentifier =
            target instanceof HTMLElement && target.hasAttribute(ignoreIdentifier)
        if (!currentCollector || !currentDomain || hasIgnoreIdentifier) {
            return
        }
        // 重载次数自增
        currentCollector[retryTimesProp]++
        // 重载失败的url入栈
        currentCollector[failedProp].push(originalUrl)
        // 是否达到最大重试次数
        const isFinalRetry = currentCollector[retryTimesProp] > opts[maxRetryCountProp]
        if (isFinalRetry) {
            // srcPath: /ssi/js/jweixin-1.6.0true.js
            const [srcPath] = splitUrl(originalUrl, domainMap)
            onFail(srcPath)
        }
        // 没有可切换的域名或是达到最大重载次数
        if (!domainMap[currentDomain] || isFinalRetry) {
            // can not find a domain to switch
            // or failed too many times
            return
        }
        // 重载新域名
        const newDomain = domainMap[currentDomain]
        // 替换成新域名后的新url
        const newUrl = stringReplace(originalUrl, currentDomain, newDomain)
        // 用户在onRetry回调用是否重写新url，如果用户在onRetry不做任何返回，则不在尝试请求
        const userModifiedUrl = onRetry(newUrl, originalUrl, currentCollector)
        // if onRetry returns null, do not retry this url
        if (userModifiedUrl === null) {
            return
        }
        // eslint-disable-next-line
        if (typeof userModifiedUrl !== 'string') {
            throw new Error('a string should be returned in `onRetry` function')
        }
        // cache retried elements
        // 如果该标签已经在重载，就不用再重载了，永远只重载一次（dataRetryId唯一性，所以retryCache[elementId]没有再赋值false）
        const elementId = hashTarget(target)
        if (retryCache[elementId]) {
            return
        }
        retryCache[elementId] = true
        if (
            target instanceof ScriptElementCtor &&
            !target.getAttribute(hookedIdentifier) &&
            target.src
        ) {
            loadNextScript(target, userModifiedUrl)
            return
        }
        if (
            target instanceof LinkElementCtor &&
            !target.getAttribute(hookedIdentifier) &&
            target.href
        ) {
            loadNextLink(target, userModifiedUrl)
            return
        }
        if (target instanceof ImageElementCtor && target.src) {
            target.setAttribute(retryIdentifier, randomString())
            target.src = userModifiedUrl
        }
    }

    /**
     * test is link element loaded in load event
     *
     * @param {Event} event
     */
    const loadHandler = function(event: Event) {
        if (!event) {
            return
        }
        const target = event.target || event.srcElement
        const originalUrl = getTargetUrl(target)
        if (!originalUrl) {
            // not one of script / link / image element
            return
        }
        if(target instanceof HTMLElement && !target.getAttribute(retryIdentifier)){
            // 针对于没有触发重载的资源，不做任何处理
            return;
        }
        const [_, currentCollector] = extractInfoFromUrl(originalUrl, domainMap)
        const [srcPath] = splitUrl(originalUrl, domainMap)
        const callOnSuccess = () => {
            if (currentCollector) {
                currentCollector[succeededProp].push(originalUrl)
            }
            onSuccess(srcPath)
        }
        // script / img tags succeeded to load without retry, add to collector
        if (!(target instanceof LinkElementCtor)) {
            callOnSuccess()
            return
        }
        // 获取所有style样式标签
        const supportStyleSheets = doc.styleSheets
        // do not support styleSheets API
        if (!supportStyleSheets) {
            return
        }
        // 类数组标签节点转化
        const styleSheets = arrayFrom(doc.styleSheets) as any[]
        // 过滤出加载完成style样式target，取第一个
        const targetStyleSheet = styleSheets.filter(styleSheet => {
            return styleSheet.href === (target as any).href
        })[0]
        const rules = getCssRules(targetStyleSheet)
        if (rules === null) {
            return
        }
        // if the loaded stylesheet does not have rules, treat as failed
        if (rules.length === 0) {
            errorHandler(event)
            return
        }
        callOnSuccess()
    }

    doc.addEventListener('error', errorHandler, true)
    doc.addEventListener('load', loadHandler, true)
}
