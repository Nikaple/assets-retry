import { innerProxyProp, innerOnloadProp, innerOnerrorProp } from '../src/constants'
import initAsync from '../src/retry-async'
import { noop } from '../src/util'
const originalCreateElement = document.createElement

describe('initAsync', () => {
    beforeAll(() => {
        initAsync({
            domain: { localhost: 'localhost' },
            maxRetryCount: 1,
            onRetry: x => x,
            onSuccess: noop,
            onFail: noop
        })
    })
    beforeEach(() => {
        document.body.innerHTML = ''
    })
    it('should not break normal DOM functions', () => {
        const $script = originalCreateElement.call(document, 'script')
        document.body.append($script)
        expect(document.body.innerHTML).toBe('<script></script>')

        const $div = document.createElement('div')
        // support null as argument
        document.body.insertBefore($div, null)
        expect(document.body.innerHTML).toBe('<script></script><div></div>')
    })
    it('can append HookedScript to DOM', () => {
        const hookedScript = document.createElement('script') as any
        expect(hookedScript[innerProxyProp]).toBeInstanceOf(HTMLScriptElement)
        document.body.append(hookedScript)
        expect(document.body.innerHTML).toBe('<script data-assets-retry-hooked="true"></script>')
    })
    it('should set property on the real script element', () => {
        const hookedScript = document.createElement('script') as any
        hookedScript.src = 'http://localhost/'
        hookedScript.onload = jest.fn()
        hookedScript.onerror = jest.fn()
        expect(typeof hookedScript[innerOnloadProp]).toBe('function')
        expect(typeof hookedScript[innerOnerrorProp]).toBe('function')
        expect(hookedScript[innerProxyProp].src).toBe('http://localhost/')
        expect(hookedScript.src).toBe('http://localhost/')
        expect(typeof hookedScript[innerProxyProp].onload).toBe('function')
        expect(typeof hookedScript.onload).toBe('function')
    })
    it('should be able to call onload callback', cb => {
        const $script = document.createElement('script') as any
        const stubOnload = jest.fn()
        // no such port
        $script.src = 'https://raw.githubusercontent.com/Nikaple/assets-retry/master/dist/assets-retry.umd.js'
        // only test onload, because jsdom do not trigger onerror callbacks
        $script.onload = () => {
            stubOnload()
            expect(stubOnload).toBeCalledTimes(1)
            cb()
        }
        document.body.appendChild($script)
    })
})
