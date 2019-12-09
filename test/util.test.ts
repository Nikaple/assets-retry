import {
    identity,
    noop,
    hasOwn,
    safeCall,
    stringReplace,
    toSlug,
    setDefault,
    arrayFrom,
    collectPropertyNames,
    isFunctionProperty,
} from '../src/util'

describe('basic utilities', () => {
    it('tests identity', () => {
        const obj = {}
        expect(identity(obj)).toBe(obj)
    })
    it('tests noop', () => {
        expect(noop()).toBe(undefined)
    })
    it('tests hasOwn', () => {
        expect(hasOwn).toBe(Object.prototype.hasOwnProperty)
    })
})

describe('safeCall', () => {
    it('can handle undefined or null', () => {
        // eslint-disable-next-line
        expect(safeCall(undefined as any, {}, {})).toBe(null)
        expect(safeCall(null as any, {}, {})).toBe(null)
    })
    it('can call function with this', () => {
        function eventHandler(this: any, event: any) {
            return { event, self: this }
        }
        const self = {}
        expect(safeCall(eventHandler, self, 'event')).toEqual({ event: 'event', self })
    })
})

describe('stringReplace', () => {
    it('can replace substring in string', () => {
        expect(stringReplace('head_middle_tail', 'middle', 'test')).toBe('head_test_tail')
        expect(stringReplace('head_middle_tail', 'head', 'test')).toBe('test_middle_tail')
        expect(stringReplace('head_middle_tail', 'tail', 'test')).toBe('head_middle_test')
    })

    it('can handle bad cases', () => {
        expect(stringReplace('head_middle_tail', 'foo', 'bar')).toBe('head_middle_tail')
    })
})

describe('toSlug', () => {
    it('can convert camelCase to dash separated words', () => {
        expect(toSlug('fooBar')).toBe('foo-bar')
        expect(toSlug('Bar')).toBe('Bar')
        expect(toSlug('foo')).toBe('foo')
    })
})

describe('setDefault', () => {
    it('can set default value for object', () => {
        const obj = {} as any
        setDefault(obj, 'a', 'a')
        expect(obj.a).toEqual('a')
    })
})

describe('arrayFrom', () => {
    it('can transform array like to array', () => {
        expect(arrayFrom({ 0: 'a', 1: 'b', length: 2 })).toEqual(['a', 'b'])
    })
})

describe('collectPropertyNames', () => {
    it('can collect all prototype properties', () => {
        class GrandFather {
            veryOld() {
                return
            }
        }
        class Father extends GrandFather {
            old() {
                return
            }
        }
        class Me extends Father {
            young() {
                return
            }
        }
        expect(new Set(collectPropertyNames(new Me()))).toEqual(
            new Set(['veryOld', 'old', 'young'])
        )
    })
})

describe('isFunctionProperty', () => {
    it('can get correct type for property', () => {
        expect(isFunctionProperty(HTMLScriptElement.prototype, 'src')).toBe(false)
        expect(isFunctionProperty(HTMLScriptElement.prototype, 'appendChild')).toBe(true)
    })
})
