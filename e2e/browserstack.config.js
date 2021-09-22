const format = require('date-fns/format');
const now = format(new Date(), 'yyyy-MM-dd HH:mm:ss')

module.exports = {
    testEnvironment: 'jest-environment-selenium',
    setupFilesAfterEnv: ['jest-environment-selenium/dist/setup.js'],
    testEnvironmentOptions: {
        server: 'http://hub-cloud.browserstack.com/wd/hub',
        capabilities: {
            'build': process.env.BROWSERSTACK_BUILD_NAME || `${require('../package.json').version}_${now}`,
            'project': process.env.BROWSERSTACK_PROJECT_NAME || 'assets-retry',
            'browserstack.idleTimeout': 300,
            'browserstack.local': true,
            'browserstack.debug': true,
            'browserstack.localIdentifier': process.env.BROWSERSTACK_LOCAL_IDENTIFIER,
            'browserstack.user': process.env.BROWSERSTACK_USERNAME,
            'browserstack.key': process.env.BROWSERSTACK_ACCESS_KEY
        }
    },
    moduleFileExtensions: ['ts', 'tsx', 'js'],
    testRegex: 'e2e\\/(.*)\\.browserstack\\.(js|ts)'
}
