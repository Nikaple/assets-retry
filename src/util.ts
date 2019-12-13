import { scriptTag, linkTag, doc, retryIdentifier } from './constants'

export const identity = function<T>(x: T): T {
    return x
}
export const noop = () => {
    /* noop */
}

export const hasOwn = Object.prototype.hasOwnProperty
/**
 * safely calls a function
 *
 * @template T this
 * @template R ReturnType<func>
 * @param {(this: T, ...callbackArgs: any[]) => R} func
 * @param {T} thisArg
 * @param {*} args
 * @returns {R}
 */
export const safeCall = function<T, R>(
    func: (this: T, ...callbackArgs: any[]) => R,
    thisArg: T,
    args: any
): R {
    // eslint-disable-next-line
    if (typeof func !== 'function') {
        return null as any
    }
    return func.call(thisArg, args)
}

/**
 * replace a substring with new one
 *
 * @param {string} current current string
 * @param {string} oldStr substring to replace
 * @param {string} newStr new string
 * @returns
 */
export const stringReplace = function(current: string, oldStr: string, newStr: string) {
    const idx = current.indexOf(oldStr)
    if (idx === -1) {
        return current;
    }
    return current.substring(0, idx) + newStr + current.substring(idx + oldStr.length)
}

/**
 * convert a camelCase string to a dash-separated string.
 *
 * @param {string} str
 * @returns
 */
export const toSlug = function(str: string) {
    return str.replace(/([a-z])([A-Z])/g, (_, $1, $2) => `${$1}-${$2.toLowerCase()}`)
}

/**
 * set default value for object
 *
 * @param {any} obj object
 * @param {string} key key
 * @param {any} defaultValue default value
 */
export const setDefault = function(obj: any, key: string, defaultValue: any) {
    obj[key] = obj[key] || defaultValue
}

/**
 * transform an array-like object to array
 *
 * @template T
 * @param {ArrayLike<T>} arrayLike
 * @returns {T[]}
 */
export const arrayFrom = function<T>(arrayLike: ArrayLike<T>): T[] {
    return [].slice.call(arrayLike)
}
/**
 * collect all property names from current object to its ancestor
 *
 * @param {any} obj
 * @returns
 */
export const collectPropertyNames = function(obj: any) {
    const getProto = Object.getPrototypeOf
        ? Object.getPrototypeOf
        : function(x: any) {
              return x.__proto__
          }
    let keys = Object.keys(obj);
    while (getProto(obj)) {
        keys = keys.concat(Object.keys(getProto(obj)))
        obj = getProto(obj)
    }
    return keys.filter(key => key !== 'constructor');
}

/**
 * @example
 * isFunctionProperty(HTMLScriptElement.prototype, 'src); // false
 * isFunctionProperty(HTMLScriptElement.prototype, 'getAttribute'); // true
 * @param {any} proto
 * @param {string} key
 * @returns
 */
export const isFunctionProperty = function(proto: any, key: string) {
    try {
        return typeof proto[key] === 'function'
    } catch (e) {
        // TypeError: Illegal invocation
        // when evaluating properties like
        // HTMLScriptElement.prototype.src
        return false
    }
}

/**
 * on some browsers, calling `document.write` when 
 * `document.readyState` is `loading` will clear the whole
 * page, which is not what we wanted.
 *
 * @returns
 */
export const supportDocumentWrite = () => {
    return !(/Edge|MSIE|rv:/i.test(navigator.userAgent))
}

/**
 * loads a new script element by previous failed script element
 *
 * @param {HTMLScriptElement} $script previous script element
 * @param {string} newSrc new url to try
 */
export const loadNextScript = function(
    $script: HTMLScriptElement,
    newSrc: string,
    onload: () => void = noop
) {
    // when dealing with failed script tags in html,
    // use `document.write` to ensure the correctness
    // of loading order
    if (doc.readyState === 'loading' && supportDocumentWrite()) {
        const retryId = randomString()
        const newHtml = $script.outerHTML
            // delete previous retry id
            .replace(/data-retry-id="[^"]+"/, '')
            .replace(/src=(?:"[^"]+"|.+)([ >])/, `${retryIdentifier}=${retryId} src="${newSrc}"$1`)
        doc.write(newHtml)
        const newScript = doc.querySelector(
            `script[${retryIdentifier}="${retryId}"]`
        ) as HTMLScriptElement
        if (newScript) {
            newScript.onload = onload
        }
        return
    }
    const $newScript = doc.createElement(scriptTag)
    // copy script properties except src:
    // type, noModule, charset, async, defer,
    // crossOrigin, text, referrerPolicy, event,
    // htmlFor, integrity (chrome)
    Object.keys(HTMLScriptElement.prototype).forEach(function(key: string) {
        if (key !== 'src' && ($script as any)[key] && typeof ($script as any)[key] !== 'object') {
            try {
                ;($newScript as any)[key] = ($script as any)[key]
            } catch (_) {
                /* noop */
            }
        }
    })
    $newScript.src = newSrc
    $newScript.onload = $script.onload
    $newScript.onerror = $script.onerror
    $newScript.setAttribute(retryIdentifier, randomString())
    // webpack nonce for csp
    const originalNonce = $script.getAttribute('nonce')
    if (originalNonce) {
        $newScript.setAttribute('nonce', originalNonce)
    }
    doc.getElementsByTagName('head')[0].appendChild($newScript)
}


/**
 * get rules from styleSheet
 *
 * @param {CSSStyleSheet} styleSheet
 * @returns
 */
export const getCssRules = function(styleSheet: CSSStyleSheet) {
    try {
        return styleSheet.rules
    } catch (_) {
        try {
            return styleSheet.cssRules
        } catch (_) {
            return null
        }
    }
}
/**
 * test if current browser support CSSRuleList
 *
 * @param {CSSStyleSheet} styleSheet
 * @returns
 */
export const supportRules = function(styleSheet: CSSStyleSheet) {
    const rules = getCssRules(styleSheet)
    return !!rules
}

/**
 * loads a new link element by previous failed link element
 *
 * @param {HTMLLinkElement} $link previous link element
 * @param {string} newHref new url to try
 */
export const loadNextLink = function($link: HTMLLinkElement, newHref: string, onload: () => void) {
    const $newLink = doc.createElement(linkTag)
    // copy link properties except href:
    // disabled, href, crossOrigin, rel, relList, media, hreflang,
    // type, as, referrerPolicy, sizes, imageSrcset, imageSizes,
    // charset, rev, target, sheet, integrity, import (chrome)
    Object.keys(HTMLLinkElement.prototype).forEach(function(key: string) {
        if (key !== 'href' && ($link as any)[key] && typeof ($link as any)[key] !== 'object') {
            try {
                ;($newLink as any)[key] = ($link as any)[key]
            } catch (_) {
                /* noop */
            }
        }
    })
    $newLink.href = newHref
    $newLink.onload = onload
    $newLink.setAttribute(retryIdentifier, randomString())
    doc.getElementsByTagName('head')[0].appendChild($newLink)
}

export const hashTarget = function(element: EventTarget | null) {
    if (!element) {
        return 'null'
    }
    if (!(element instanceof HTMLElement)) {
        return 'not_supported'
    }
    const nodeName = element.nodeName;
    const src = (element as any).src;
    const href = (element as any).href;
    const dataRetryId = element.getAttribute(retryIdentifier);
    return [nodeName, src, href, dataRetryId].join(';')
}

export const randomString = () => Math.random().toString(36).slice(2)