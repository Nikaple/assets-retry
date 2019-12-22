const capabilities = configuration.capabilities
const baseUri = `http://${capabilities['browserstack.user']}.browserstack.com`

describe('BrowserStack', () => {
    const expectStatToBe = async target => {
        const stat = await driver.executeScript('return window.stat')
        expect(stat).toEqual(target)
    }

    beforeEach(() => {
        jest.setTimeout(capabilities.timeout || 60000)
    })

    const targetInfo = capabilities.realMobile
        ? `${capabilities.device} ${capabilities.browserName} ${capabilities.os_version}`
        : `${capabilities.browserName} ${capabilities.browser_version}`

    // BrowserStack is fairly slow, so we only run complex test
    it(`should be able to pass complex test on ${targetInfo}`, async () => {
        await driver.get(`${baseUri}/e2e/fixture/views/all.html`)
        // background-images is the slowest
        await driver.wait(async () => {
            const backgroundImageSync = await driver.executeScript(
                'return getComputedStyle(document.getElementById("cssSync")).backgroundImage'
            )
            const backgroundImageAsync = await driver.executeScript(
                'return getComputedStyle(document.getElementById("cssAsync")).backgroundImage'
            )
            const backgroundImageStyleTag = await driver.executeScript(
                'return getComputedStyle(document.getElementById("styleTag")).backgroundImage'
            )
            const asyncLoaded = await driver.executeScript(
                'return window.loadedScripts.async === true'
            )
            return (
                /fixture/.test(backgroundImageSync) &&
                /fixture/.test(backgroundImageAsync) &&
                /fixture/.test(backgroundImageStyleTag) &&
                asyncLoaded
            )
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
