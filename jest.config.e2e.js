module.exports = {
    testEnvironment: "jest-environment-selenium",
    setupFilesAfterEnv: ["jest-environment-selenium/dist/setup.js"],
    testEnvironmentOptions: {
        capabilities: { browserName: 'chrome' }
    },
    testRegex: 'e2e\\/(.*)\\.e2e\\.(js|ts)'
}
