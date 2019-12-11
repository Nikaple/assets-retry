module.exports = {
    testEnvironment: "jest-environment-selenium",
    setupFilesAfterEnv: ["jest-environment-selenium/dist/setup.js"],
    testEnvironmentOptions: {
        capabilities: {
            browserName: 'chrome',
            'goog:chromeOptions': {
                args: ['--no-sandbox', '--headless', '--disable-gpu']
            },
        }
    },
    moduleFileExtensions: ['ts', 'tsx', 'js'],
    testRegex: 'e2e\\/(.*)\\.e2e\\.(js|ts)'
}
