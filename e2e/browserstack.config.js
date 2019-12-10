const commonConfig = {
    build: require('../package.json').version,
    project: 'assets-retry',
    'browserstack.local': true,
    'browserstack.debug': true,
    'browserstack.user': 'nikaplezhou1',
    'browserstack.key': process.env.BROWSERSTACK_KEY
}
const mobileConfig = {
    browserName: process.env.BROWSER || '',
    device: process.env.DEVICE,
    realMobile: 'true',
    os_version: process.env.OS_VERSION 
}
const pcConfig = {
    browserName: process.env.BROWSER || '',
    browser_version: process.env.BROWSER_VERSION || '',
    os: process.env.OS || 'Windows',
    os_version: process.env.OS_VERSION || '10',
}
const platformConfig = process.env.MOBILE ? mobileConfig : pcConfig;
module.exports = {
    testEnvironment: 'jest-environment-selenium',
    setupFilesAfterEnv: ['jest-environment-selenium/dist/setup.js'],
    testEnvironmentOptions: {
        server: 'http://hub-cloud.browserstack.com/wd/hub',
        capabilities: Object.assign(commonConfig, platformConfig)
    },
    moduleFileExtensions: ['ts', 'tsx', 'js'],
    testRegex: 'e2e\\/(.*)\\.browserstack\\.(js|ts)'
}
