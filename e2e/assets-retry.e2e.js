/** @type import('selenium-webdriver/chrome').Driver */
var d = driver
/** @type import('selenium-webdriver/lib/until'). */
var u = until

const baseUri = 'http://localhost:5000'
const expectStatToBe = async target => {
    const stat = await d.executeScript('return window.stat')
    expect(stat).toEqual(target)
}
const waitForCssSelector = async selector => {
    return d.wait(u.elementLocated(By.css(selector)), 5000)
}
describe('individual integration tests', () => {
    it('should be able to retry sync scripts', async () => {
        await d.get(`${baseUri}/e2e/fixture/views/script-sync.html`)
        await waitForCssSelector('script[src*="fixture"]')
        const isVendorLoaded = await d.executeScript('return window.loadedScripts.vendor')
        expect(isVendorLoaded).toBe(true)
        await expectStatToBe({
            '/scripts/vendor.js': {
                failed: [`${baseUri}/e2e/not-exist/scripts/vendor.js`],
                retryTimes: 1,
                succeeded: [`${baseUri}/e2e/fixture/scripts/vendor.js`]
            },
            '/scripts/not-exist-vendor.js': {
                failed: [
                    `${baseUri}/e2e/not-exist/scripts/not-exist-vendor.js`,
                    `${baseUri}/e2e/fixture/scripts/not-exist-vendor.js`
                ],
                retryTimes: 2,
                succeeded: []
            }
        })
    })

    it('should be able to retry sync styles', async () => {
        await d.get(`${baseUri}/e2e/fixture/views/style-sync.html`)
        await waitForCssSelector('link[href*="fixture"]')
        const backgroundRepeat = await d.executeScript(
            'return getComputedStyle(document.body).backgroundRepeat'
        )
        const isCssLoaded = backgroundRepeat === 'no-repeat'
        expect(isCssLoaded).toBe(true)
        await expectStatToBe({
            '/styles/sync.css': {
                failed: [`${baseUri}/e2e/not-exist/styles/sync.css`],
                retryTimes: 1,
                succeeded: [`${baseUri}/e2e/fixture/styles/sync.css`]
            },
            '/styles/not-exist-sync.css': {
                failed: [
                    `${baseUri}/e2e/not-exist/styles/not-exist-sync.css`,
                    `${baseUri}/e2e/fixture/styles/not-exist-sync.css`
                ],
                retryTimes: 2,
                succeeded: []
            }
        })
    })

    it('should be able to retry img tags', async () => {
        await d.get(`${baseUri}/e2e/fixture/views/img-tag.html`)
        await waitForCssSelector('img')
        await d.wait(async () => {
            const src = await d.executeScript('return document.images.img.src')
            const isImgLoaded = /fixture/.test(src)
            return isImgLoaded
        })
        await expectStatToBe({
            '/images/img-tag.png': {
                failed: [`${baseUri}/e2e/not-exist/images/img-tag.png`],
                retryTimes: 1,
                succeeded: [`${baseUri}/e2e/fixture/images/img-tag.png`]
            },
            '/images/not-exist-img-tag.png': {
                failed: [
                    `${baseUri}/e2e/not-exist/images/not-exist-img-tag.png`,
                    `${baseUri}/e2e/fixture/images/not-exist-img-tag.png`
                ],
                retryTimes: 2,
                succeeded: []
            }
        })
    })

    it('should be able to retry async scripts', async () => {
        await d.get(`${baseUri}/e2e/fixture/views/script-async.html`)
        await waitForCssSelector('script[src*="fixture"]')
        const isAsyncLoaded = await d.executeScript('return window.loadedScripts.async')
        expect(isAsyncLoaded).toBe(true)
        const result = await d.findElement(By.id('result')).getText()
        const isCallbackOk = result === 'load'
        expect(isCallbackOk).toBe(true)
        await expectStatToBe({
            '/scripts/async.js': {
                failed: [`${baseUri}/e2e/not-exist/scripts/async.js`],
                retryTimes: 1,
                succeeded: [`${baseUri}/e2e/fixture/scripts/async.js`]
            },
            '/scripts/not-exist-async.js': {
                failed: [
                    `${baseUri}/e2e/not-exist/scripts/not-exist-async.js`,
                    `${baseUri}/e2e/fixture/scripts/not-exist-async.js`
                ],
                retryTimes: 2,
                succeeded: []
            }
        })
    })

    it('should be able to retry background images', async () => {
        await d.get(`${baseUri}/e2e/fixture/views/background-image-sync.html`)
        await waitForCssSelector('link')
        // wait for browser to retry background image
        await d.wait(async () => {
            const backgroundImage = await d.executeScript(
                'return getComputedStyle(cssSync).backgroundImage'
            )
            return /fixture/.test(backgroundImage)
        })
        // background-image do not show in stats
        await expectStatToBe({})
    })

    it('should be able to retry async background images', async () => {
        await d.get(`${baseUri}/e2e/fixture/views/background-image-async.html`)
        await waitForCssSelector('link')
        // wait for browser to retry background image
        await d.wait(async () => {
            const backgroundImage = await d.executeScript(
                'return getComputedStyle(cssAsync).backgroundImage'
            )
            return /fixture/.test(backgroundImage)
        })
        // background-image do not show in stats
        await expectStatToBe({})
    })

    it('should be able to pass complex test', async () => {
        await d.get(`${baseUri}/e2e/fixture/views/all.html`)
        // background-images is the slowest
        await d.wait(async () => {
            const backgroundImageSync = await d.executeScript(
                'return getComputedStyle(cssSync).backgroundImage'
            )
            const backgroundImageAsync = await d.executeScript(
                'return getComputedStyle(cssAsync).backgroundImage'
            )
            return /fixture/.test(backgroundImageSync) && /fixture/.test(backgroundImageAsync)
        })
        // wait for browser to retry background image
        // background-image do not show in stats
        await expectStatToBe({
            '/images/img-tag.png': {
                failed: [`${baseUri}/e2e/not-exist/images/img-tag.png`],
                retryTimes: 1,
                succeeded: [`${baseUri}/e2e/fixture/images/img-tag.png`]
            },
            '/scripts/async.js': {
                failed: [`${baseUri}/e2e/not-exist/scripts/async.js`],
                retryTimes: 1,
                succeeded: [`${baseUri}/e2e/fixture/scripts/async.js`]
            },
            '/scripts/sync.js': {
                failed: [`${baseUri}/e2e/not-exist/scripts/sync.js`],
                retryTimes: 1,
                succeeded: [`${baseUri}/e2e/fixture/scripts/sync.js`]
            },
            '/scripts/vendor.js': {
                failed: [`${baseUri}/e2e/not-exist/scripts/vendor.js`],
                retryTimes: 1,
                succeeded: [`${baseUri}/e2e/fixture/scripts/vendor.js`]
            },
            '/styles/async.css': {
                failed: [`${baseUri}/e2e/not-exist/styles/async.css`],
                retryTimes: 1,
                succeeded: [`${baseUri}/e2e/fixture/styles/async.css`]
            },
            '/styles/sync.css': {
                failed: [`${baseUri}/e2e/not-exist/styles/sync.css`],
                retryTimes: 1,
                succeeded: [`${baseUri}/e2e/fixture/styles/sync.css`]
            }
        })
    })
})
