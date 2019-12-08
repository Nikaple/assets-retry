module.exports = {
    transform: {
        '.(ts|tsx)': 'ts-jest'
    },
    testEnvironment: 'jest-environment-jsdom-global',
    testRegex: '(/__tests__/.*|\\.(test|spec))\\.(ts|tsx|js)$',
    moduleFileExtensions: ['ts', 'tsx', 'js'],
    coveragePathIgnorePatterns: ['/node_modules/', '/test/'],
    coverageThreshold: {
        global: {
            branches: 90,
            functions: 95,
            lines: 95,
            statements: 95
        }
    },
    collectCoverageFrom: ['src/*.{js,ts}']
}
