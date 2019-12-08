import { arrayFrom, stringReplace, toSlug } from './util'
import { doc } from './constants'
import { getCurrentDomain } from './url'
import { InnerAssetsRetryOptions } from './assets-retry'

type UrlProperty = 'backgroundImage' | 'borderImage' | 'listStyleImage'
// cache
const handledStylesheets: { [x: string]: boolean } = {}
const supportRules = function(styleSheet: any) {
    try {
        return styleSheet.rules && styleSheet.rules.length > 0
    } catch (_) {
        return false
    }
}
const processRules = function(
    name: UrlProperty,
    rule: CSSStyleRule,
    styleSheet: CSSStyleSheet,
    opts: InnerAssetsRetryOptions
) {
    const domainMap = opts.domain
    const onRetry = opts.onRetry
    const targetRule = rule.style && rule.style[name]
    if (!targetRule) {
        return
    }
    // skip data-uri
    if (/^url\(["']?data:/.test(targetRule)) {
        return
    }
    const [_, originalUrl] = targetRule.match(/^url\(["|'](.*)["|']\)/) || []
    if (!originalUrl) {
        return
    }
    const currentDomain = getCurrentDomain(originalUrl, domainMap)
    if (!currentDomain || !domainMap[currentDomain]) {
        return
    }
    const urlList = Object.keys(domainMap)
        .filter(domain => domain !== currentDomain)
        .map(domain => {
            const newUrl = stringReplace(originalUrl, currentDomain, domain)
            const userModifiedUrl = onRetry(newUrl, originalUrl, null)
            return `url("${userModifiedUrl}")`
        })
        .join(',')
    const cssText = rule.selectorText + `{ ${toSlug(name)}: ${urlList}; }`
    try {
        styleSheet.insertRule(cssText, styleSheet.rules.length)
    } catch (_) {
        styleSheet.insertRule(cssText, 0)
    }
}

const processStyleSheets = (styleSheets: StyleSheet[], opts: InnerAssetsRetryOptions) => {
    const urlProperties: UrlProperty[] = ['backgroundImage', 'borderImage', 'listStyleImage']
    // TODO: iterating stylesheets may cause performance issues
    // maybe find other approaches?
    styleSheets.forEach((styleSheet: any) => {
        // styleSheet
        if (!supportRules(styleSheet)) {
            return
        }
        if (handledStylesheets[styleSheet.href]) {
            return
        }
        const styleRules = arrayFrom(styleSheet.rules as CSSStyleRule[])
        styleRules.forEach((rule, ruleIndex) => {
            urlProperties.forEach(cssProperty => {
                processRules(cssProperty, rule, styleSheet, opts)
            })
        })

        if (styleSheet.href) {
            handledStylesheets[styleSheet.href] = true
        }
    })
}

export default function initCss(opts: InnerAssetsRetryOptions) {
    // detect is support styleSheets
    const supportStyleSheets = document.styleSheets
    if (!supportStyleSheets) return false
    const styleSheets = arrayFrom(doc.styleSheets)
    let currentStyleSheetLength = styleSheets.length;
    setInterval(() => {
        const newStyleSheets = arrayFrom(doc.styleSheets)
        const newStyleSheetsLength = newStyleSheets.length;
        if (newStyleSheetsLength > currentStyleSheetLength) {
            processStyleSheets(newStyleSheets, opts)
            currentStyleSheetLength = newStyleSheetsLength
        }
    }, 250)
}
