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
        const originalUrl = getTargetUrl(target)
        if (!originalUrl) {
            // not one of script / link / image element
            return
        }
        const [currentDomain, currentCollector] = extractInfoFromUrl(originalUrl, domainMap)
        const hasIgnoreIdentifier =
            target instanceof HTMLElement && target.hasAttribute(ignoreIdentifier)
        if (!currentCollector || !currentDomain || hasIgnoreIdentifier) {
            return
        }
        currentCollector[retryTimesProp]++
        currentCollector[failedProp].push(originalUrl)
        const isFinalRetry = currentCollector[retryTimesProp] > opts[maxRetryCountProp]
        if (isFinalRetry) {
            const [srcPath] = splitUrl(originalUrl, domainMap)
            onFail(srcPath)
        }
        if (!domainMap[currentDomain] || isFinalRetry) {
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
        const supportStyleSheets = doc.styleSheets
        // do not support styleSheets API
        if (!supportStyleSheets) {
            return
        }
        const styleSheets = arrayFrom(doc.styleSheets) as any[]
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
