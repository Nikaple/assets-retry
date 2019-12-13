import { stringReplace, loadNextScript, loadNextLink, hashTarget, randomString, arrayFrom, getCssRules } from './util'
import { InnerAssetsRetryOptions } from './assets-retry'
import { extractInfoFromUrl } from './url'
import {
    retryTimesProp,
    failedProp,
    hookedIdentifier,
    succeededProp,
    doc,
    retryIdentifier
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
    const errorHandler = function(event: Event) {
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
        // cache retried elements
        const elementId = hashTarget(target);
        if (retryCache[elementId]) {
            return;
        }
        retryCache[elementId] = true;
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
            target.setAttribute(retryIdentifier, randomString())
            target.src = userModifiedUrl
            target.onload = onloadCallback
        }
    }

    /**
     * test is link element loaded in load event
     *
     * @param {Event} event
     */
    const loadHandler = function(event: Event) {
        if (!event) {
            return;
        }
        const target = event.target || event.srcElement;
        // only handle link element
        if (!(target instanceof HTMLLinkElement)) {
            return;
        }
        const supportStyleSheets = doc.styleSheets
        // do not support styleSheets API
        if (!supportStyleSheets) {
            return;
        }
        const styleSheets = arrayFrom(doc.styleSheets) as CSSStyleSheet[]
        const targetStyleSheet = styleSheets.filter(styleSheet => {
            return styleSheet.href === target.href
        })[0]
        const rules = getCssRules(targetStyleSheet)
        if (rules === null) {
            return
        }
        if (rules.length === 0) {
            errorHandler(event)
        }
    }

    doc.addEventListener('error', errorHandler, true)
    doc.addEventListener('load', loadHandler, true)
}
