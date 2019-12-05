import {
    collectPropertyNames,
    stringReplace,
    isFunctionProperty,
    loadNextScript,
    safeCall,
    hasOwn,
    noop
} from './util'

import {
    retryTimesProp,
    succeededProp,
    failedProp,
    maxRetryCountProp,
    onRetryProp,
    domainProp,
    innerScriptProp,
    innerOnloadProp,
    innerOnerrorProp,
    scriptTag,
    hookedIdentifier,
    doc,
    win
} from './constants'
import { retryCollector } from './collector'
import { prepareDomainMap, extractInfoFromUrl } from './url'
import { InnerAssetsRetryOptions } from './assets-retry'
import initCss from './retry-css'

export interface HookedScript {
    [innerScriptProp]: HTMLScriptElement
    [innerOnerrorProp]: (e: Partial<Event>) => void
    [x: string]: any
}

// cache all properties of HTMLScriptElement.prototype
// (including prototype properties) because it's big (length > 200)
// otherwise it would be calculated every time when
// a script request failed.
const scriptProperties = collectPropertyNames(HTMLScriptElement.prototype)

/**
 * create the descriptor of hooked script object,
 * accessing any property on the hooked script object
 * will be delegated to the real HTMLScriptElement
 * except onload/onerror events
 *
 * @param {any} self hookedScript
 * @param {object} opts
 * @returns
 */
const getHookedScriptDescriptors = function(self: HookedScript, opts: InnerAssetsRetryOptions) {
    const maxRetryCount = opts[maxRetryCountProp]
    const domainMap = prepareDomainMap(opts[domainProp])
    const onRetry = opts[onRetryProp]
    return scriptProperties.reduce(function(descriptor, key) {
        const isFn = isFunctionProperty(HTMLScriptElement.prototype, key)
        // for function properties,
        // do not assign getters/setters
        if (isFn) {
            descriptor[key] = {
                value: function() {
                    return (self[innerScriptProp] as any)[key].apply(
                        self[innerScriptProp],
                        arguments
                    )
                }
            }
        } else {
            descriptor[key] = {
                set: function(newVal) {
                    if (key === 'onerror') {
                        self[innerOnerrorProp] = newVal
                        // hook error events,
                        // forward the original onerror handler
                        // to the next script element to load
                        ;(self[innerScriptProp] as any).onerror = function(event: ErrorEvent) {
                            event.stopPropagation && event.stopPropagation()
                            const src = self[innerScriptProp].src
                            const [currentDomain, currentCollector] = extractInfoFromUrl(
                                src,
                                domainMap
                            )
                            if (!currentDomain || !currentCollector) {
                                return
                            }
                            const newSrc = stringReplace(
                                src,
                                currentDomain,
                                domainMap[currentDomain]
                            )
                            const userModifiedSrc = onRetry(newSrc, src, currentCollector)
                            // if onRetry returns null, do not retry this url
                            if (userModifiedSrc === null) {
                                return
                            }
                            if (typeof userModifiedSrc !== 'string') {
                                throw new Error('a string should be returned in `onRetry` function')
                            }
                            if (currentCollector[retryTimesProp] < maxRetryCount) {
                                loadNextScript(self[innerScriptProp], userModifiedSrc)
                            } else {
                                safeCall(self[innerOnerrorProp], self[innerScriptProp], event)
                            }
                        }
                        return
                    }
                    if (key === 'onload') {
                        self[innerOnloadProp] = newVal
                        self[innerScriptProp].onload = function(event: Event) {
                            const src = self[innerScriptProp].src
                            const [_, currentCollector] = extractInfoFromUrl(src, domainMap)
                            if (!currentCollector) {
                                return
                            }
                            if (currentCollector[failedProp].indexOf(src) === -1) {
                                currentCollector[succeededProp].push(src)
                            }
                            if (newVal && !newVal._called) {
                                newVal._called = true
                                newVal.call(self[innerScriptProp], event)
                            }
                        }
                        return
                    }
                    ;(self[innerScriptProp] as any)[key] = newVal
                },
                get() {
                    return (self[innerScriptProp] as any)[key]
                }
            }
        }
        return descriptor
    }, {} as PropertyDescriptorMap)
}

const createHookedScript = function(
    $script: HTMLScriptElement,
    opts: InnerAssetsRetryOptions
): HookedScript {
    $script.setAttribute(hookedIdentifier, 'true')
    const $hookedScript: HookedScript = {
        [innerScriptProp]: $script,
        [innerOnerrorProp]: noop
    }
    const descriptors = getHookedScriptDescriptors($hookedScript, opts)
    Object.defineProperties($hookedScript, descriptors)
    return $hookedScript
}

/**
 * hook `document.createElement`
 * @param {InnerAssetsRetryOptions} opts
 */
const hookCreateElement = function(opts: InnerAssetsRetryOptions) {
    const originalCreateElement = doc.createElement
    ;(doc as any).createElement = function(name: string, options: any): any {
        if (name === scriptTag) {
            return createHookedScript((originalCreateElement as any).call(doc, scriptTag), opts)
        }
        return originalCreateElement.call(doc, name, options)
    }
    doc.createElement.toString = function() {
        return 'function createElement() { [native code] }'
    }
}

/**
 * create a hooked function which hooks every method of target.
 * if a method is hooked and its arguments contains the inner script tag
 * it will be replaced with the value of inner script tag
 *
 * @param {any} target hook target
 */
const hookPrototype = function(target: any, opts: InnerAssetsRetryOptions) {
    const functionKeys = Object.keys(target).filter(key => isFunctionProperty(target, key))
    functionKeys.forEach(key => {
        const originalFunc = target[key]
        target[key] = function(): any {
            const args = [].slice.call(arguments).map((item: any) => {
                return hasOwn.call(item, innerScriptProp) ? item[innerScriptProp] : item
            })
            if (__RETRY_IMAGE__) {
                const isInsertOp =
                    [
                        'append',
                        'appendChild',
                        'insertBefore',
                        'replaceChild',
                        'insertAdjacentElement',
                        'prepend'
                    ].indexOf(key) > -1
                if (isInsertOp && args[0] instanceof HTMLLinkElement) {
                    args[0].addEventListener('load', () => {
                        setTimeout(() => initCss(opts), 100)
                    })
                }
            }
            return originalFunc.apply(this, args)
        }
        // keep original toString
        if (/^\w+$/.test(key)) {
            target[key].toString = new Function(`return 'function ${key}() { [native code] }'`)
        }
    })
}
/**
 * init asynchronous retrying of script tags
 * @param {InnerAssetsRetryOptions} opts
 * @returns
 */
export default function initAsync(opts: InnerAssetsRetryOptions) {
    hookCreateElement(opts)
    if (typeof Node !== 'undefined') {
        hookPrototype(Node.prototype, opts)
    }
    if (typeof Element !== 'undefined') {
        hookPrototype(Element.prototype, opts)
    }
    return retryCollector
}
