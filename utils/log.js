const { Signale } = require('signale')

module.exports = new Signale({
    scope: 'app',
    logLevel: process.env.LOG_LEVEL || "info",
    types: {
        info: {
            badge: 'ℹ️',
            color: 'cyan',
            label: 'info',
            logLevel: 'info'
        },
        request: {
            badge: '->',
            color: 'gray',
            label: 'request',
            logLevel: 'info'
        }
    }
})