import { arrayFrom, stringReplace, toSlug, supportRules, getCssRules } from './util'
import { doc, domainProp, onRetryProp, StyleElementCtor } from './constants'
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
    const domainMap = opts[domainProp]
    const onRetry = opts[onRetryProp]
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
    if (!currentDomain) {
        return
    }

    let domain = currentDomain;
    const urlMap: Record<string, boolean> = { [domain]: true };
    while (domain && domainMap[domain]) {
        const newDomain = domainMap[domain];
        if (urlMap[newDomain]) {
            break;
        }
        urlMap[newDomain] = true;
        domain = newDomain;
    }
    const urlList = Object.keys(urlMap)
        .map(domain => {
            const newUrl = stringReplace(originalUrl, currentDomain, domain)
            const userModifiedUrl = onRetry(newUrl, originalUrl, null)
            return userModifiedUrl ? `url("${userModifiedUrl}")` : null;
        })
        .filter(Boolean)
        .join(',')
    const cssText = rule.selectorText + `{ ${toSlug(name)}: ${urlList} ${opts.styleImageNoImportant ? '' : '!important'}; }`
    try {
        styleSheet.insertRule(cssText, styleRules.length)
    } catch (_) {
        styleSheet.insertRule(cssText, 0)
    }
}

const processStyleSheets = (styleSheets: CSSStyleSheet[], opts: InnerAssetsRetryOptions) => {
    const urlProperties: UrlProperty[] = ['backgroundImage', 'borderImage', 'listStyleImage']
    styleSheets.forEach((styleSheet: CSSStyleSheet) => {
        const rules = getCssRules(styleSheet)
        if (rules === null) {
            return
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
        if (styleSheet.ownerNode instanceof StyleElementCtor) {
            handledStyleTags.push(styleSheet.ownerNode)
        }
    })
}

const getStyleSheetsToBeHandled = (styleSheets: StyleSheetList, domainMap: DomainMap): CSSStyleSheet[] => {
    const sheetsArray = arrayFrom(styleSheets) as unknown as CSSStyleSheet[];
    return sheetsArray.filter(styleSheet => {
        if (!supportRules(styleSheet)) {
            return false
        }
        // <style /> tags
        if (!styleSheet.href) {
            const ownerNode = styleSheet.ownerNode
            if (ownerNode instanceof StyleElementCtor && handledStyleTags.indexOf(ownerNode) > -1) {
                return false
            }
            return true
        }
        if (handledStylesheets[styleSheet.href]) {
            return false
        }
        const currentDomain = getCurrentDomain(styleSheet.href, domainMap)
        return !!currentDomain
    })
}

export default function initCss(opts: InnerAssetsRetryOptions) {
    // detect is support styleSheets
    const supportStyleSheets = doc.styleSheets
    const domainMap = opts[domainProp]
    if (!supportStyleSheets) return false
    setInterval(() => {
        const newStyleSheets = getStyleSheetsToBeHandled(doc.styleSheets, domainMap)
        if (newStyleSheets.length > 0) {
            processStyleSheets(newStyleSheets, opts)
        }
    }, 250)
}
