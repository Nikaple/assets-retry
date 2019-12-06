import { stringReplace, loadNextScript, loadNextLink } from './util'
import { InnerAssetsRetryOptions } from './assets-retry'
import { extractInfoFromUrl } from './url'
import {
    retryTimesProp,
    failedProp,
    hookedIdentifier,
    maxRetryCountProp,
    succeededProp,
    win,
    doc
} from './constants'

/**
 * init synchronous retrying of assets,
 * this includes the retrying of
 * script, link and img tags
 *
 * @export
 * @param {InnerAssetsRetryOptions} opts
 */
export default function initSync(opts: InnerAssetsRetryOptions) {
    const onRetry = opts.onRetry
    const getTargetUrl = function(target: EventTarget | null) {
        if (target instanceof HTMLScriptElement || target instanceof HTMLImageElement) {
            return target.src
        }
        if (target instanceof HTMLLinkElement) {
            return target.href
        }
        return null
    }
    /**
     * capture error on window
     * when js / css / image failed to load
     * reload the target with new domain
     *
     * @param {ErrorEvent} event
     * @returns
     */
    const errorHandler = function(event: ErrorEvent) {
        if (!event) {
            return
        }
        const target = event.target || event.srcElement
        const domainMap = opts.domain
        const originalUrl = getTargetUrl(target)
        if (!originalUrl) {
            // not one of script / link / image element
            return
        }
        const [currentDomain, currentCollector] = extractInfoFromUrl(originalUrl, domainMap)
        if (!currentCollector || !currentDomain) {
            return
        }
        currentCollector[retryTimesProp]++
        currentCollector[failedProp].push(originalUrl)
        if (!domainMap[currentDomain] || currentCollector[retryTimesProp] > opts.maxRetryCount) {
            // can not find a domain to switch
            // or failed too many times
            return
        }
        const newDomain = domainMap[currentDomain]
        const newUrl = stringReplace(originalUrl, currentDomain, newDomain)
        const userModifiedUrl = onRetry(newUrl, originalUrl, currentCollector)
        // if onRetry returns null, do not retry this url
        if (userModifiedUrl === null) {
            return
        }
        // eslint-disable-next-line
        if (typeof userModifiedUrl !== 'string') {
            throw new Error('a string should be returned in `onRetry` function')
        }
        console.log('[document.onerror]', userModifiedUrl)
        const onloadCallback = () => {
            currentCollector[succeededProp].push(userModifiedUrl)
        }
        if (target instanceof HTMLScriptElement && !target.getAttribute(hookedIdentifier) && target.src) {
            loadNextScript(target, userModifiedUrl, onloadCallback)
            return
        }
        if (target instanceof HTMLLinkElement && target.href) {
            loadNextLink(target, userModifiedUrl, onloadCallback)
            return
        }
        if (target instanceof HTMLImageElement && target.src) {
            target.src = userModifiedUrl
            target.onload = onloadCallback
        }
    }

    doc.addEventListener('error', errorHandler, true)
}
