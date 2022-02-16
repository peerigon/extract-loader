module.exports = {
    transformIgnorePatterns: ['^.+\\.html','test/modules/','node_modules/(?!(sucrase)/)'],
    transform: {
        '^.+\\.(js|jsx|ts|tsx|mjs)$': 'babel-jest',
    },
}
