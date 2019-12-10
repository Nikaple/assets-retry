const runTestCase = require('./run-test-case');

describe('individual integration tests', () => {
    runTestCase({
        baseUri: 'http://localhost:5000',
        // driver, until, by are global variables
        // provided by jest-environment-selenium
        driver,
        until,
        By
    })
})