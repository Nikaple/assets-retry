import initAsync from '../src/retry-async'
import { innerScriptProp, innerOnloadProp, innerOnerrorProp } from '../src/constants'
const originalCreateElement = document.createElement

describe('initAsync', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
    })
    it('should not break toString functions on DOM methods', () => {
        initAsync({ domain: { localhost: 'localhost' }, maxRetryCount: 1, onRetry: x => x })
        expect(document.createElement.toString()).toMatch(/native code/)
        expect(document.body.appendChild.toString()).toMatch(/native code/)
        expect(document.body.append.toString()).toMatch(/native code/)
    })
    it("should not break normal DOM functions", () => {
        const $script = originalCreateElement.call(document, 'script');
        document.body.append($script)
        expect(document.body.innerHTML).toBe("<script></script>")
        
        const $div = document.createElement('div')
        // support null as argument
        document.body.insertBefore($div, null);
        expect(document.body.innerHTML).toBe("<script></script><div></div>")
    })
    it('can append HookedScript to DOM', () => {
        const hookedScript = document.createElement('script') as any;
        expect(hookedScript[innerScriptProp]).toBeInstanceOf(HTMLScriptElement)
        document.body.append(hookedScript);
        expect(document.body.innerHTML).toBe("<script data-assets-retry-hooked=\"true\"></script>")
    })
    it('should set property on the real script element', () => {
        const hookedScript = document.createElement('script') as any;
        hookedScript.src = 'http://localhost/'
        hookedScript.onload = jest.fn()
        hookedScript.onerror = jest.fn()
        expect(typeof hookedScript[innerOnloadProp]).toBe('function')
        expect(typeof hookedScript[innerOnerrorProp]).toBe('function')
        expect(hookedScript[innerScriptProp].src).toBe('http://localhost/')
        expect(hookedScript.src).toBe('http://localhost/')
        expect(typeof hookedScript[innerScriptProp].onload).toBe('function')
        expect(typeof hookedScript.onload).toBe('function')
    })
})
