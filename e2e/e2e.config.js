module.exports = {
    testEnvironment: "jest-environment-selenium",
    setupFilesAfterEnv: ["jest-environment-selenium/dist/setup.js"],
    testEnvironmentOptions: {
        capabilities: {
            browserName: 'firefox'
        }
    },
    moduleFileExtensions: ['ts', 'tsx', 'js'],
    testRegex: '(.*)\\.e2e\\.(js|ts)'
}
