import { retryCollector, RetryStatistics } from './collector'
import { retryTimesProp, failedProp, succeededProp } from './constants'

export type Domain = string[] | { [x: string]: string }
export interface DomainMap {
    [x: string]: string
}

/**
 * generate the domain map from user
 * @example
 * generateDomainMap(['a.cdn', 'b.cdn', 'c.cdn']) // {'a.cdn': 'b.cdn', 'b.cdn': 'c.cdn', 'c.cdn': 'a.cdn'}
 *
 * @param {Domain} domains
 * @returns {DomainMap}
 */
export const prepareDomainMap = function(domains: Domain): DomainMap {
    // array
    if (Array.isArray(domains)) {
        return domains.reduce(function(domainMap, domain, idx, array) {
            domainMap[domain] = array[(idx + 1) % array.length]
            return domainMap
        }, {} as DomainMap)
    }
    // object
    return domains
}

/**
 * get path from src
 * @example
 * getUrlPath('https://a.cdn/js/1.js', 'a.cdn'); // '/js/1.js'
 * getUrlPath('https://a.cdn/namespace/js/1.js', 'a.cdn/namespace'); // '/js/1.js'
 * @param {string} src script src
 * @param {string} currentDomain domain name
 * @returns {string}
 */
export const getUrlPath = function(src: string, currentDomain: string) {
    return src.substr(src.indexOf(currentDomain) + currentDomain.length, src.length)
}

/**
 * find out the domain of current loading script
 *
 * @param {string} src
 * @param {{ [x: string]: string }} domainMap
 * @returns
 */
export const getCurrentDomain = function(src: string, domainMap: DomainMap) {
    return (
        Object.keys(domainMap)
            .filter(function(domain) {
                return src.indexOf(domain) > -1
            })
            // sort by length (relevance)
            .sort((prev, next) => next.length - prev.length)[0]
    )
}

/**
 * extract domain from url, and get the
 * corresponding statistic collector
 * @param {string} url
 * @returns
 */
export const extractInfoFromUrl = function(
    url: string,
    domainMap: DomainMap
): [string?, RetryStatistics?] {
    const currentDomain = getCurrentDomain(url, domainMap)
    if (!currentDomain) {
        return []
    }
    const srcPath = getUrlPath(url, currentDomain)
    retryCollector[srcPath] = retryCollector[srcPath] || {
        [retryTimesProp]: 0,
        [failedProp]: [],
        [succeededProp]: []
    }
    return [currentDomain, retryCollector[srcPath]]
}
