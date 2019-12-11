module.exports = {
    testEnvironment: 'jest-environment-selenium',
    setupFilesAfterEnv: ['jest-environment-selenium/dist/setup.js'],
    testEnvironmentOptions: {
        server: 'http://hub-cloud.browserstack.com/wd/hub',
        capabilities: {
            build: require('../package.json').version,
            project: 'assets-retry',
            'browserstack.local': true,
            'browserstack.debug': true,
            'browserstack.user': 'nikaplezhou1',
            'browserstack.key': process.env.BROWSERSTACK_KEY
        }
    },
    moduleFileExtensions: ['ts', 'tsx', 'js'],
    testRegex: 'e2e\\/(.*)\\.browserstack\\.(js|ts)'
}
