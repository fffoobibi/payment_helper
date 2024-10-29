import {toRaw} from "vue"
class Logger {
    info(...args) {
        electron.log("info", ...toRaw(args))
    }
    error(...args) {
        electron.log("error", ...toRaw(args))
    }
    debug(...args) {
        electron.log("debug", ...toRaw(args))
    }
    warn(...args) {
        electron.log("warn", ...toRaw(args))
    }

}


const logger = new Logger()

export default logger