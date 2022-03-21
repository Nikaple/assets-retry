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
    unique
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
    LinkElementCtor
} from './constants'
import { retryCollector } from './collector'
import { prepareDomainMaps, extractInfoFromUrl } from './url'
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
    // 获取script&link标签中所有的属性，合并后的属性
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
    // 最大重试次数
    const maxRetryCount = opts[maxRetryCountProp]
    // prepareDomainMap(['a.cdn', 'b.cdn', 'c.cdn']) ---> {'a.cdn': 'b.cdn', 'b.cdn': 'c.cdn', 'c.cdn': 'a.cdn'}
    const domainMap = prepareDomainMaps(opts[domainProp])
    // 通过该参数可自定义 URL 的转换方式
    const onRetry = opts[onRetryProp]
    // scriptAndLinkProperties script&link标签中所有的属性，合并后的属性
    return scriptAndLinkProperties.reduce(function(descriptor, key) {
        // 判断是否是function
        const isFn = isFunctionProperty(ScriptElementCtor.prototype, key)
        // for function properties,
        // do not assign getters/setters
        if (isFn) {
            descriptor[key] = {
                value: function() {
                    // 如果是一个function 就用window.HTMLScriptElement call一下
                    return (self[innerProxyProp] as any)[key].apply(self[innerProxyProp], arguments)
                }
            }
        } else {
            descriptor[key] = {
                set: function(newVal) {
                    // 真实未被代理的Element（script、link对象）
                    const realElement = self[innerProxyProp]
                    // 代理onerror事件
                    if (key === 'onerror') {
                        self[innerOnerrorProp] = newVal
                        // hook error events,
                        // forward the original onerror handler
                        // to the next script element to load
                        realElement.onerror = function(event: Event | string) {
                            // script、link的event 错误对象是如下：
                            // var target = e.target || e.srcElement;
                            // var isElementTarget = target instanceof HTMLScriptElement || target instanceof HTMLLinkElement || target instanceof HTMLImageElement;
                            if (typeof event === 'string') return
                            event.stopPropagation && event.stopPropagation()
                            const callOriginalOnError = () =>
                                safeCall(self[innerOnerrorProp], realElement, event)
                            // 获取script的src、link的href
                            const url = getTargetUrl(realElement)
                            // 获取当前请求的domain、和收集器（retryTimes次数，failed失败请求url数组、succeeded成功请求url数组）
                            const [currentDomain, currentCollector] = extractInfoFromUrl(
                                url,
                                domainMap
                            )
                            // 此标签是否 data-assets-retry-ignore 忽略重试
                            const shouldIgnore = realElement.hasAttribute(ignoreIdentifier)
                            // 没有currentDomain或currentCollector收集器或是忽略标签 直接调用原onerror
                            if (!currentDomain || !currentCollector || shouldIgnore) {
                                return callOriginalOnError()
                            }
                            // 获取替换域名后的完成url: http://a.com/a.js --> http://b.com/a.js
                            const newSrc = stringReplace(
                                url, // 原请求完整链接
                                currentDomain, // 原请求域名
                                domainMap[currentDomain] // 重载需替换域名
                            )
                            // 重要： 调用用户自定义onRetry方法，传递currentUrl, originalUrl, statistics。可以在这里替换请求连接或是更改domain
                            const userModifiedSrc = onRetry(newSrc, url, currentCollector)
                            // if onRetry returns null, do not retry this url
                            if (userModifiedSrc === null) {
                                return callOriginalOnError()
                            }
                            // eslint-disable-next-line
                            if (typeof userModifiedSrc !== 'string') {
                                throw new Error('a string should be returned in `onRetry` function')
                            }
                            // 是否达到重载的最大次数
                            if (currentCollector[retryTimesProp] <= maxRetryCount) {
                                if (realElement instanceof ScriptElementCtor) {
                                    // 加载script脚本
                                    loadNextScript(realElement, userModifiedSrc, noop, true)
                                } else if (realElement instanceof LinkElementCtor) {
                                    // 加载link标签
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
    // 给script、link标签打上自定义标签 data-assets-retry-hooked = true
    $element.setAttribute(hookedIdentifier, 'true')
    // 定义元素钩子
    const $hookedElement: HookedElement = {
        [innerProxyProp]: $element,
        [innerOnerrorProp]: noop // 空函数
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
    // 改写document.createElement方法
    const originalCreateElement = doc.createElement
    ;(doc as any).createElement = function(name: string, options: any): any {
        // 针对script、link标签包裹一层
        if (name === scriptTag || name === linkTag) {
            // (originalCreateElement as any).call(doc, name) 返回dom对象
            return createHookedElement((originalCreateElement as any).call(doc, name), opts)
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
                // 针对script、link 进行过滤代理
                return hasOwn.call(item, innerProxyProp) ? item[innerProxyProp] : item
            })
            return originalFunc.apply(this, args)
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
    // TODO: hookPrototype原因是？
    // eslint-disable-next-line
    if (typeof Node !== 'undefined') {
        hookPrototype(Node.prototype)
    }
    // eslint-disable-next-line
    if (typeof Element !== 'undefined') {
        hookPrototype(Element.prototype)
    }
    // TODO: 为啥需要return？
    // return retryCollector
}
