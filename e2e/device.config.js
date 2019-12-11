
const mobileStacks = [
    {
        browserName: 'android',
        device: 'Samsung Galaxy Note 4',
        os_version: '4.4',
        realMobile: true
    },
    {
        browserName: 'android',
        device: 'OnePlus 6T',
        os_version: '9.0',
        realMobile: true
    },
    {
        browserName: 'iPhone',
        device: 'iPhone 7',
        os_version: '10',
        realMobile: true
    },
    {
        browserName: 'iPhone',
        device: 'iPhone XS',
        os_version: '13',
        realMobile: true
    },
]

const pcStacks = [
    {
        browserName: 'Chrome',
        browser_version: '47.0',
        os: 'Windows',
        os_version: '10',
    },
    {
        browserName: 'Chrome',
        browser_version: '78.0',
        os: 'Windows',
        os_version: '10',
    },
    {
        browserName: 'Edge',
        browser_version: '15.0',
        os: 'Windows',
        os_version: '10',
    },
    {
        browserName: 'Edge',
        browser_version: '18.0',
        os: 'Windows',
        os_version: '10',
        timeout: 120000
    },
    {
        browserName: 'Firefox',
        browser_version: '32.0',
        os: 'Windows',
        os_version: '10',
    },
    {
        browserName: 'Firefox',
        browser_version: '71.0',
        os: 'Windows',
        os_version: '10',
    },
    {
        browserName: 'Safari',
        browser_version: '10.0',
        os: 'OS X',
        os_version: 'Sierra'
    },
    {
        browserName: 'Safari',
        browser_version: '12.0',
        os: 'OS X',
        os_version: 'Mojave'
    },
    {
        browserName: 'IE',
        browser_version: '10.0',
        os: 'Windows',
        os_version: '7',
        timeout: '120000'
    },
    {
        browserName: 'IE',
        browser_version: '11.0',
        os: 'Windows',
        os_version: '10',
        timeout: '120000'
    },
]

module.exports = {
    mobile: mobileStacks,
    pc: pcStacks
}