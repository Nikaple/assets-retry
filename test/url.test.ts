import { prepareDomainMap, getCurrentDomain, getUrlPath, extractInfoFromUrl } from '../src/url'
import { retryCollector } from '../src/collector'

beforeEach(() => {
    Object.keys(retryCollector).forEach(key => {
        delete retryCollector[key]
    })
})

describe('prepareDomainMap', () => {
    it('accepts array', () => {
        expect(prepareDomainMap(['a', 'b'])).toEqual({ a: 'b', b: 'a' })
    })
    it('accepts object', () => {
        const obj = { a: 'b', b: 'c' };
        expect(prepareDomainMap(obj)).toBe(obj);
    })
})

describe('getCurrentDomain', () => {
    it('can extract domain', () => {
        const domainMap = { 'a.cdn': 'b.cdn', 'b.cdn': 'c.cdn' }
        expect(getCurrentDomain('http://a.cdn/js/1.js', domainMap)).toBe('a.cdn')
        expect(getCurrentDomain('http://c.cdn/js/1.js', domainMap)).toBe(undefined)
    })
    it('can extract domain with namespace', () => {
        const domainMap = { 'a.cdn/namespace': 'b.cdn' }
        expect(getCurrentDomain('http://a.cdn/namespace/js/1.js', domainMap)).toBe(
            'a.cdn/namespace'
        )
    })
})

describe('getUrlPath', () => {
    it('can extract path', () => {
        expect(getUrlPath('https://a.cdn/js/1.js', 'a.cdn')).toBe('/js/1.js')
    })
    it('can extract path with namespace', () => {
        expect(getUrlPath('https://a.cdn/namespace/js/1.js', 'a.cdn/namespace')).toBe('/js/1.js')
    })
})

describe('extractInfoFromUrl', () => {
    it('can extract info', () => {
        retryCollector['/js/1.js'] = {} as any
        const domainMap = { 'a.cdn': 'b.cdn' }
        expect(extractInfoFromUrl('http://a.cdn/js/1.js', domainMap)).toEqual([
            'a.cdn',
            retryCollector['/js/1.js']
        ])
    })
})
