const format = require('date-fns/format');
const now = format(new Date(), 'yyyy-MM-dd HH:mm:ss')

module.exports = {
    testEnvironment: 'jest-environment-selenium',
    setupFilesAfterEnv: ['jest-environment-selenium/dist/setup.js'],
    testEnvironmentOptions: {
        server: 'http://hub-cloud.browserstack.com/wd/hub',
        capabilities: {
            build: `${require('../package.json').version}_${now}`,
            project: 'assets-retry',
            'browserstack.idleTimeout': 300,
            'browserstack.local': true,
            'browserstack.debug': true,
            'browserstack.user': 'nikaplezhou1',
            'browserstack.key': process.env.BROWSERSTACK_KEY
        }
    },
    moduleFileExtensions: ['ts', 'tsx', 'js'],
    testRegex: 'e2e\\/(.*)\\.browserstack\\.(js|ts)'
}
