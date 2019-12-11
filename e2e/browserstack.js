const jest = require('jest')
const merge = require('merge-deep');
const device = require('./device.config')
const basicConfig = require('./browserstack.config')

const generateTask = env => {
    const jestConfig = merge(basicConfig, {
        testEnvironmentOptions: {
            capabilities: env
        }
    });
    return () => jest.runCLI(jestConfig, [__dirname])
}

const mobileTasks = device.mobile.map(generateTask)
const pcTasks = device.pc.map(generateTask)


async function runTest() {
    const testResults = [];
    // run mobile tests sequentially
    const mobilePromise = mobileTasks.reduce((prev, curr) => {
        return prev.then(prevResult => {
            prevResult && testResults.push(prevResult)
        }).then(curr);
    }, Promise.resolve())
    // run pc tests sequentially
    const pcPromise = pcTasks.reduce((prev, curr) => {
        return prev.then(prevResult => {
            prevResult && testResults.push(prevResult)
        }).then(curr);
    }, Promise.resolve())

    await Promise.all([mobilePromise, pcPromise]);
}

runTest()