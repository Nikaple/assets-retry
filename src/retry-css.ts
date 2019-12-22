import { arrayFrom, stringReplace, toSlug, supportRules, getCssRules } from './util'
import { doc } from './constants'
import { getCurrentDomain, DomainMap } from './url'
import { InnerAssetsRetryOptions } from './assets-retry'

type UrlProperty = 'backgroundImage' | 'borderImage' | 'listStyleImage'
// cache for <link rel="stylesheet" />
const handledStylesheets: { [x: string]: boolean } = {}
// cache for <style />
const handledStyleTags: HTMLStyleElement[] = []

const processRules = function(
    name: UrlProperty,
    rule: CSSStyleRule,
    styleSheet: CSSStyleSheet,
    styleRules: CSSStyleRule[],
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
    const [_, originalUrl] = targetRule.match(/^url\(["']?(.+?)["']?\)/) || []
    if (!originalUrl) {
        return
    }
    const currentDomain = getCurrentDomain(originalUrl, domainMap)
    if (!currentDomain || !domainMap[currentDomain]) {
        return
    }
    const urlList = Object.keys(domainMap)
        .map(domain => {
            const newUrl = stringReplace(originalUrl, currentDomain, domain)
            const userModifiedUrl = onRetry(newUrl, originalUrl, null)
            return `url("${userModifiedUrl}")`
        })
        .join(',')
    const cssText = rule.selectorText + `{ ${toSlug(name)}: ${urlList} !important; }`
    try {
        styleSheet.insertRule(cssText, styleRules.length)
    } catch (_) {
        styleSheet.insertRule(cssText, 0)
    }
}

const processStyleSheets = (styleSheets: CSSStyleSheet[], opts: InnerAssetsRetryOptions) => {
    const urlProperties: UrlProperty[] = ['backgroundImage', 'borderImage', 'listStyleImage']
    // TODO: iterating stylesheets may cause performance issues
    // maybe find other approaches?
    styleSheets.forEach((styleSheet: CSSStyleSheet) => {
        const rules = getCssRules(styleSheet);
        if (rules === null) {
            return;
        }
        const styleRules = arrayFrom(rules) as CSSStyleRule[]
        styleRules.forEach(rule => {
            urlProperties.forEach(cssProperty => {
                processRules(cssProperty, rule, styleSheet, styleRules, opts)
            })
        })

        if (styleSheet.href) {
            handledStylesheets[styleSheet.href] = true
        }
        if (styleSheet.ownerNode instanceof HTMLStyleElement) {
            handledStyleTags.push(styleSheet.ownerNode)
        }
    })
}

const getStyleSheetsToBeHandled = function(styleSheets: StyleSheetList, domainMap: DomainMap) {
    return (arrayFrom(styleSheets) as CSSStyleSheet[]).filter(styleSheet => {
        if (!supportRules(styleSheet)) {
            return false;
        }
        // <style /> tags
        if (!styleSheet.href) {
            const ownerNode = styleSheet.ownerNode;
            if (ownerNode instanceof HTMLStyleElement && handledStyleTags.indexOf(ownerNode) > -1) {
                return false;
            }
            return true;
        }
        if (handledStylesheets[styleSheet.href]) {
            return false;
        }
        const currentDomain = getCurrentDomain(styleSheet.href, domainMap);
        return !!currentDomain
    })

}

export default function initCss(opts: InnerAssetsRetryOptions) {
    // detect is support styleSheets
    const supportStyleSheets = doc.styleSheets
    const domainMap = opts.domain
    if (!supportStyleSheets) return false
    setInterval(() => {
        const newStyleSheets = getStyleSheetsToBeHandled(doc.styleSheets, domainMap)
        if (newStyleSheets.length > 0) {
            processStyleSheets(newStyleSheets, opts)
        }
    }, 250)
}
