class Logger {
    info(...args) {
        electron.log("info", ...args)
    }
    error(...args) {
        electron.log("error", ...args)
    }
    debug(...args) {
        electron.log("debug", ...args)
    }
    warn(...args) {
        electron.log("warn", ...args)
    }

}


const logger = new Logger()

export default logger