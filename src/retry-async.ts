import {
    collectPropertyNames,
    stringReplace,
    isFunctionProperty,
    loadNextScript,
    safeCall,
    hasOwn,
    noop,
    getTargetUrl,
    loadNextLink,
    unique,
    isElementInCurrentContext
} from './util'

import {
    retryTimesProp,
    maxRetryCountProp,
    onRetryProp,
    domainProp,
    innerProxyProp,
    innerOnloadProp,
    innerOnerrorProp,
    linkTag,
    scriptTag,
    hookedIdentifier,
    ignoreIdentifier,
    doc,
    ScriptElementCtor,
    LinkElementCtor,
    win
} from './constants'
import { retryCollector } from './collector'
import { prepareDomainMap, extractInfoFromUrl } from './url'
import { InnerAssetsRetryOptions } from './assets-retry'

type DynamicElement = HTMLScriptElement | HTMLLinkElement

export interface HookedElement {
    [innerProxyProp]: DynamicElement
    [innerOnerrorProp]: (e: Partial<Event>) => void
    [x: string]: any
}

// cache all properties of HTMLScriptElement.prototype
// (including prototype properties) because it's big (length > 200)
// otherwise it would be calculated every time when
// a script request failed.
let scriptAndLinkProperties: string[]
try {
    scriptAndLinkProperties = unique([
        ...collectPropertyNames(ScriptElementCtor.prototype),
        ...collectPropertyNames(LinkElementCtor.prototype)
    ])
} catch (_) {
    /* noop */
}

/**
 * create the descriptor of hooked element object,
 * accessing any property on the hooked element object
 * will be delegated to the real HTMLElement
 * except onload/onerror events
 *
 * @param {any} self hookedScript
 * @param {object} opts
 * @returns
 */
const getHookedElementDescriptors = function(self: HookedElement, opts: InnerAssetsRetryOptions) {
    const maxRetryCount = opts[maxRetryCountProp]
    const domainMap = prepareDomainMap(opts[domainProp])
    const onRetry = opts[onRetryProp]
    return scriptAndLinkProperties.reduce(function(descriptor, key) {
        const isFn = isFunctionProperty(ScriptElementCtor.prototype, key)
        // for function properties,
        // do not assign getters/setters
        if (isFn) {
            descriptor[key] = {
                value: function() {
                    return (self[innerProxyProp] as any)[key].apply(self[innerProxyProp], arguments)
                }
            }
        } else {
            descriptor[key] = {
                set: function(newVal) {
                    const realElement = self[innerProxyProp]
                    if (key === 'onerror') {
                        self[innerOnerrorProp] = newVal
                        // hook error events,
                        // forward the original onerror handler
                        // to the next script element to load
                        realElement.onerror = function(event: Event | string) {
                            if (typeof event === 'string') return
                            event.stopPropagation && event.stopPropagation()
                            const callOriginalOnError = () =>
                                safeCall(self[innerOnerrorProp], realElement, event)
                            const url = getTargetUrl(realElement)
                            const [currentDomain, currentCollector] = extractInfoFromUrl(
                                url,
                                domainMap
                            )
                            const shouldIgnore = realElement.hasAttribute(ignoreIdentifier)
                            if (!currentDomain || !currentCollector || shouldIgnore) {
                                return callOriginalOnError()
                            }
                            if (!isElementInCurrentContext(event.target as Element)) {
                                return callOriginalOnError()
                            }
                            const newSrc = stringReplace(
                                url,
                                currentDomain,
                                domainMap[currentDomain]
                            )
                            const userModifiedSrc = onRetry(newSrc, url, currentCollector)
                            // if onRetry returns null, do not retry this url
                            if (userModifiedSrc === null) {
                                return callOriginalOnError()
                            }
                            // eslint-disable-next-line
                            if (typeof userModifiedSrc !== 'string') {
                                throw new Error('a string should be returned in `onRetry` function')
                            }
                            if (currentCollector[retryTimesProp] <= maxRetryCount) {
                                if (realElement instanceof ScriptElementCtor) {
                                    loadNextScript(realElement, userModifiedSrc, noop, true)
                                } else if (realElement instanceof LinkElementCtor) {
                                    loadNextLink(realElement, userModifiedSrc)
                                }
                            } else {
                                callOriginalOnError()
                            }
                        }
                        return
                    }
                    if (key === 'onload') {
                        self[innerOnloadProp] = newVal
                        self[innerProxyProp].onload = function(event: Event) {
                            if (newVal && !newVal._called) {
                                newVal._called = true
                                newVal.call(self[innerProxyProp], event)
                            }
                        }
                        return
                    }
                    ;(realElement as any)[key] = newVal
                },
                get() {
                    return (self[innerProxyProp] as any)[key]
                }
            }
        }
        return descriptor
    }, {} as PropertyDescriptorMap)
}

const createHookedElement = function(
    $element: DynamicElement,
    opts: InnerAssetsRetryOptions
): HookedElement {
    $element.setAttribute(hookedIdentifier, 'true')
    const $hookedElement: HookedElement = {
        [innerProxyProp]: $element,
        [innerOnerrorProp]: noop
    }
    const descriptors = getHookedElementDescriptors($hookedElement, opts)
    Object.defineProperties($hookedElement, descriptors)
    $hookedElement.onload = noop
    $hookedElement.onerror = noop
    return $hookedElement
}

/**
 * hook `document.createElement`
 * @param {InnerAssetsRetryOptions} opts
 */
const hookCreateElement = function(opts: InnerAssetsRetryOptions) {
    const originalCreateElement = doc.createElement
    ;(doc as any).createElement = function(name: string, options: any): any {
        if (name === scriptTag || name === linkTag) {
            return createHookedElement((originalCreateElement as any).call(doc, name), opts)
        }
        if (name === 'iframe') {
            const iframeElement = (originalCreateElement as any).call(doc, name) as HTMLIFrameElement
            iframeElement.addEventListener('load', () => {
                const window = iframeElement.contentWindow as any
                if (window) {
                    hookPrototypes(window)
                }
            });
            return iframeElement
        }
        return originalCreateElement.call(doc, name, options)
    }
}

/**
 * create a hooked function which hooks every method of target.
 * if a method is hooked and its arguments contains the inner script tag
 * it will be replaced with the value of inner script tag
 *
 * @param {any} target hook target
 */
const hookPrototype = function(target: any) {
    const functionKeys = Object.keys(target).filter(key => isFunctionProperty(target, key))
    functionKeys.forEach(key => {
        const originalFunc = target[key]
        target[key] = function(): any {
            const args = [].slice.call(arguments).map((item: any) => {
                if (!item) return item
                return hasOwn.call(item, innerProxyProp) ? item[innerProxyProp] : item
            })
            return originalFunc.apply(this, args)
        }
    })
}

function hookPrototypes(window?: Window | null) {
    try {
        const realWindow: any = window || win
        // eslint-disable-next-line
        if (typeof realWindow.Node !== 'undefined') {
            hookPrototype(realWindow.Node.prototype)
        }
        // eslint-disable-next-line
        if (typeof realWindow.Element !== 'undefined') {
            hookPrototype(realWindow.Element.prototype)
        }
    } catch (e) {
        // ignore cross origin errors
        if (window === win) {
            throw e;
        }
    }
}
/**
 * init asynchronous retrying of script tags
 * @param {InnerAssetsRetryOptions} opts
 * @returns
 */
export default function initAsync(opts: InnerAssetsRetryOptions) {
    hookCreateElement(opts)
    hookPrototypes()
    
    return retryCollector
}
