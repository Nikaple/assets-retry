const { parse } = require('url')

module.exports = function runTestCase({ baseUri, driver, until, By }) {
    const expectStatToBe = async target => {
        const stat = await driver.executeScript('return window.stat')
        expect(stat).toEqual(target)
    }
    const expectSucceededToBe = async target => {
        const succeeded = await driver.executeScript('return window.succeeded')
        expect(succeeded.map(url => parse(url).path).sort()).toEqual(target.sort())
    }
    const expectFailedToBe = async target => {
        const failed = await driver.executeScript('return window.failed')
        expect(failed.map(url => parse(url).path).sort()).toEqual(target.sort())
    }
    const waitForCssSelector = async selector => {
        return driver.wait(until.elementLocated(By.css(selector)), 10000)
    }
    const getBackgroundImage = async selector => {
        return driver.executeScript(
            `return getComputedStyle(document.getElementById("${selector}")).backgroundImage`
        )
    }

    beforeEach(() => {
        jest.setTimeout(60000)
    })

    it('should be able to collect stats without retry', async () => {
        await driver.get(`${baseUri}/e2e/fixture/views/ok.html`)
        await waitForCssSelector('script[src*="fixture"]')
        const isOkLoaded = await driver.executeScript('return window.loadedScripts.ok')
        expect(isOkLoaded).toBe(true)
        await expectStatToBe({
            "/styles/ok.css": {
                "retryTimes": 0,
                "failed": [],
                "succeeded": [
                    `${baseUri}/e2e/fixture/styles/ok.css`
                ]
            },
            "/images/img-tag.png": {
                "retryTimes": 0,
                "failed": [],
                "succeeded": [
                    `${baseUri}/e2e/fixture/images/img-tag.png`
                ]
            },
            "/scripts/ok.js": {
                "retryTimes": 0,
                "failed": [],
                "succeeded": [
                    `${baseUri}/e2e/fixture/scripts/ok.js`
                ]
            }
        })
        await expectSucceededToBe(['/scripts/ok.js', '/images/img-tag.png', '/styles/ok.css'])
    })

    it('should be able to retry sync scripts', async () => {
        await driver.get(`${baseUri}/e2e/fixture/views/script-sync.html`)
        await waitForCssSelector('script[src*="fixture"]')
        const isVendorLoaded = await driver.executeScript('return window.loadedScripts.vendor')
        expect(isVendorLoaded).toBe(true)
        await expectStatToBe({
            '/scripts/ignore-vendor.js': {
                failed: [],
                retryTimes: 0,
                succeeded: []
            },
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
        await expectSucceededToBe(['/scripts/vendor.js'])
        await expectFailedToBe(['/scripts/not-exist-vendor.js'])
    })

    it('should be able to retry style styles', async () => {
        await driver.get(`${baseUri}/e2e/fixture/views/background-image-style-tag.html`)
        // wait for browser to retry background image
        await driver.wait(async () => {
            const backgroundImage = await getBackgroundImage('styleTag');
            return /fixture/.test(backgroundImage)
        })
        // background-image do not show in stats
        await expectStatToBe({})
        await expectSucceededToBe([])
        await expectFailedToBe([])
    })

    it('should be able to retry sync styles', async () => {
        await driver.get(`${baseUri}/e2e/fixture/views/style-sync.html`)
        await waitForCssSelector('link[href*="fixture"]')
        const backgroundRepeat = await driver.executeScript(
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
        await expectSucceededToBe(['/styles/sync.css'])
        await expectFailedToBe(['/styles/not-exist-sync.css'])
    })

    it('should be able to retry img tags', async () => {
        await driver.get(`${baseUri}/e2e/fixture/views/img-tag.html`)
        await waitForCssSelector('img')
        await driver.wait(async () => {
            const src = await driver.executeScript('return document.images.img.src')
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
        await expectSucceededToBe(['/images/img-tag.png'])
        await expectFailedToBe(['/images/not-exist-img-tag.png'])
    })

    it('should be able to retry async scripts', async () => {
        await driver.get(`${baseUri}/e2e/fixture/views/script-async.html`)
        await waitForCssSelector('script[src*="fixture"]')
        const isAsyncLoaded = await driver.executeScript('return window.loadedScripts.async')
        expect(isAsyncLoaded).toBe(true)
        await waitForCssSelector('#result')
        const result = await driver.findElement(By.id('result')).getText()
        const isCallbackOk = result === 'load'
        expect(isCallbackOk).toBe(true)
        await expectStatToBe({
            '/scripts/ignore-async.js': {
                failed: [],
                retryTimes: 0,
                succeeded: []
            },
            '/scripts/async.js': {
                failed: [`${baseUri}/e2e/not-exist/scripts/async.js`],
                retryTimes: 1,
                succeeded: [`${baseUri}/e2e/fixture/scripts/async.js`]
            },
            '/scripts/async2.js': {
                failed: [],
                retryTimes: 0,
                succeeded: [`${baseUri}/e2e/fixture/scripts/async2.js`]
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
        await expectSucceededToBe(['/scripts/async.js', '/scripts/async2.js'])
        await expectFailedToBe(['/scripts/not-exist-async.js'])
    })

    it('should be able to retry background images', async () => {
        await driver.get(`${baseUri}/e2e/fixture/views/background-image-sync.html`)
        await waitForCssSelector('link')
        // wait for browser to retry background image
        await driver.wait(async () => {
            const backgroundImage = await getBackgroundImage('cssSync')
            return /fixture/.test(backgroundImage)
        })
        // background-image do not show in stats
        await expectStatToBe({
            '/styles/sync.css': {
                failed: [],
                retryTimes: 0,
                succeeded: [`${baseUri}/e2e/fixture/styles/sync.css`]
            },
        })
        await expectSucceededToBe(['/styles/sync.css'])
        await expectFailedToBe([])
    })

    it('should be able to retry async background images', async () => {
        await driver.get(`${baseUri}/e2e/fixture/views/background-image-async.html`)
        await waitForCssSelector('link')
        // wait for browser to retry background image
        await driver.wait(async () => {
            const backgroundImage = await getBackgroundImage('cssAsync')
            return /fixture/.test(backgroundImage)
        })
        // background-image do not show in stats
        await expectStatToBe({
            '/styles/async.css': {
                failed: [],
                retryTimes: 0,
                succeeded: [`${baseUri}/e2e/fixture/styles/async.css`]
            },
        })
    })

    it('should be able to retry background images in style tags', async () => {
        await driver.get(`${baseUri}/e2e/fixture/views/background-image-style-tag.html`)
        // wait for browser to retry background image
        await driver.wait(async () => {
            const backgroundImage = await getBackgroundImage('styleTag')
            const backgroundImage2 = await getBackgroundImage('styleTag2')
            return /fixture/.test(backgroundImage) && /fixture/.test(backgroundImage2)
        })
        // background-image do not show in stats
        await expectStatToBe({})
        const backgroundImage = await getBackgroundImage('styleTag')
        const backgroundImage2 = await getBackgroundImage('styleTag2')

        expect(backgroundImage.includes('/not-exist/')).toBe(true)
        expect(backgroundImage.includes('/not-exist-1/')).toBe(false)

        expect(backgroundImage2.includes('/not-exist/')).toBe(false)
        expect(backgroundImage2.includes('/not-exist-1/')).toBe(true)
    })

    it('should be able to pass complex test', async () => {
        await driver.get(`${baseUri}/e2e/fixture/views/all.html`)
        // background-images is the slowest
        await driver.wait(async () => {
            const backgroundImageSync = await getBackgroundImage('cssSync')
            const backgroundImageAsync = await getBackgroundImage('cssAsync')
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
            "/scripts/ok.js": {
                "failed": [],
                "retryTimes": 0,
                "succeeded": [
                    `${baseUri}/e2e/fixture/scripts/ok.js`,
                ],
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
            "/scripts/test.js": {
                "failed": [],
                "retryTimes": 0,
                "succeeded": [`${baseUri}/e2e/fixture/scripts/test.js`],
            },
            '/scripts/vendor.js': {
                failed: [`${baseUri}/e2e/not-exist/scripts/vendor.js`],
                retryTimes: 1,
                succeeded: [`${baseUri}/e2e/fixture/scripts/vendor.js`]
            },
            "/styles/ok.css": {
                "failed": [],
                "retryTimes": 0,
                "succeeded": [`${baseUri}/e2e/fixture/styles/ok.css`],
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
        await expectSucceededToBe([
            '/styles/sync.css',
            '/scripts/vendor.js',
            '/images/img-tag.png',
            '/scripts/sync.js',
            '/scripts/ok.js',
            '/scripts/test.js',
            '/styles/async.css',
            '/styles/ok.css',
            '/scripts/async.js',
        ])
        await expectFailedToBe([])
    })
}
