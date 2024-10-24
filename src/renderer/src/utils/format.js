import Decimal from "decimal.js"

/**
 * 将时间戳或日期转换成指定格式
 * @param {String|Date|timestamp} date
 * @param {number} type 格式：1) y年m月d日  2) yyyy-mm-dd hh:ii   3) yyyy-mm-dd  4) y年m月d日 hh:ii  5) mmddhhiiss
 * @returns
 */
const dateTimeFmt = (date, type = 1) => {
    //  auto 0
    const autoZero = (n) => (String(n).length === 1 ? '0' : '') + n
    // string to timestamp
    const strToTimestamp = (str) => Date.parse(str.replace(/-/gi, '/'))
    let oriSecond = date
    if (typeof date === 'String') {
        oriSecond = strToTimestamp(date)
    } else if (date instanceof Date) {
        oriSecond = Math.round(date.getTime() / 1000)
    }
    if (oriSecond > 9999999999) {
        oriSecond /= 1000
    }
    let curSecond = parseInt(new Date().getTime() / 1000)
    let diffSecond = curSecond - oriSecond

    let curDate = new Date(curSecond * 1000)
    let oriDate = new Date(oriSecond * 1000)

    let Y = oriDate.getFullYear()
    let m = oriDate.getMonth() + 1
    let d = oriDate.getDate()
    let H = oriDate.getHours()
    let i = oriDate.getMinutes()
    let s = oriDate.getSeconds()

    if (type == 1) {
        // just
        if (diffSecond < 60) {
            // within a minute
            return '刚刚'
        } else if (diffSecond < 3600) {
            // within an hour
            return `${Math.round(diffSecond / 60)}分钟前`
        }
        // yesterday
        let mewDate = new Date((curSecond - 86400) * 1000)
        if (mewDate.getFullYear() === Y && mewDate.getMonth() + 1 === m && mewDate.getDate() === d) {
            return `昨天`
        } else if (curDate.getFullYear() === Y) {
            return `${m}月${d}日`
        }
        return `${Y}年${m}月${d}日`
    } else if (type == 2) {
        return `${Y}-${autoZero(m)}-${autoZero(d)} ${autoZero(H)}:${autoZero(i)}`
    } else if (type == 3) {
        return `${Y}-${autoZero(m)}-${autoZero(d)}`
    } else if (type == 4) {
        // just
        if (diffSecond < 60) {
            // within a minute
            return '刚刚'
        } else if (diffSecond < 3600) {
            // within an hour
            return `${Math.round(diffSecond / 60)}分钟前`
        }
        // yesterday
        let mewDate = new Date((curSecond - 86400) * 1000)
        if (mewDate.getFullYear() === Y && mewDate.getMonth() + 1 === m && mewDate.getDate() === d) {
            return `昨天 ${autoZero(H)}:${autoZero(i)}`
        } else if (curDate.getFullYear() === Y) {
            return `${m}月${d}日 ${autoZero(H)}:${autoZero(i)}`
        }
        return `${Y}年${m}月${d}日 ${autoZero(H)}:${autoZero(i)}`
    } else if (type == 5) {
        return `${autoZero(m)}${autoZero(d)}${autoZero(H)}${autoZero(i)}${autoZero(s)}`
    } else if (type === 6) {
        let _y = curDate.getFullYear()
        let _m = curDate.getMonth() + 1
        let _d = curDate.getDate()
        if (_y === Y && _m === m && _d === d) {
            return `${autoZero(H)}:${autoZero(i)}:${autoZero(s)}`
        }
        // yesterday
        let mewDate = new Date((curSecond - 86400) * 1000)
        if (mewDate.getFullYear() === Y && mewDate.getMonth() + 1 === m && mewDate.getDate() === d) {
            return `昨天 ${autoZero(H)}:${autoZero(i)}`
        } else if (curDate.getFullYear() === Y) {
            return `${m}月${d}日 ${autoZero(H)}:${autoZero(i)}`
        }
        return `${Y}年${m}月${d}日 ${autoZero(H)}:${autoZero(i)}`
    }
}

/**
 * 数字千位分隔
 * @param {string|number} n
 * @returns
 */
const numberFmt = (n, strict=true) => {
    if (!n) return ''
    const v =  n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    if(!strict && v.endsWith('.00')){
        return v.replaceAll('.00', '')
    }
    return v
}

const amountFormatter = value => `${value}`.replace(/[^\-?\d.]/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ',')
const amountParser = value => value.replace(/[^\-?\d.]/g, '')
const accountFormatter = value => `${value}`.replace(/\D/g, '').replace(/....(?!$)/g, '$& ')
const accountParser = value => value.replace(/\s/g, '')

/**
 *
 * @param {number} timestamp
 * @returns
 */
const timestampToFormattedString = (timestamp, sep = false, getNormal = false) => {
    // 确保时间戳是以秒为单位
    if (!timestamp) {
        return ''
    }
    const date = new Date(timestamp * 1000);

    // 获取年月日时分秒
    const year = date.getFullYear();
    const month = ("0" + (date.getMonth() + 1)).slice(-2); // 加1是因为月份从0开始
    const day = ("0" + date.getDate()).slice(-2);
    const hours = ("0" + date.getHours()).slice(-2);
    const minutes = ("0" + date.getMinutes()).slice(-2);
    const seconds = ("0" + date.getSeconds()).slice(-2);

    if (sep) {
        return `${year}${month}${day}_${hours}_${minutes}_${seconds}`
    }
    if (getNormal) {
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }
    // 拼接成指定格式的字符串
    return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * 
 * @param {Date|Number} date 
 * @returns 
 */
const getMonthDaysFromDate = (date) => {
    if (!date) {
        return ""
    }
    if (typeof date === 'number' || (date instanceof Number)) {
        date = new Date(date * 1000)
    }

    const year = date.getFullYear(); // 获取年份
    const month = date.getMonth(); // 获取月份，注意月份是从0开始的

    const firstDay = new Date(year, month, 1); // 当月的第一天
    const lastDay = new Date(year, month + 1, 0); // 下个月的0号，即当月的最后一天

    return {
        firstDay: firstDay,
        lastDay: lastDay
    };
}

/**
 *
 * @param {Date|Number} date
 * @returns String
 */
const formatDate = (date, opt = { start: false, end: false, sep: "-", sepLast: ":", trancate: '' }) => {
    if (!date) {
        return ""
    }
    if (typeof date === 'number' || (date instanceof Number)) {
        date = new Date(date * 1000)
    }
    const { start = false, end = false, sep = "-", sepLast = ":", trancate = '' } = opt
    const year = date.getFullYear();
    const month = ("0" + (date.getMonth() + 1)).slice(-2);
    const day = ("0" + date.getDate()).slice(-2);
    const hours = ("0" + date.getHours()).slice(-2);
    const minutes = ("0" + date.getMinutes()).slice(-2);
    const seconds = ("0" + date.getSeconds()).slice(-2);
    const r = `${year}${sep}${month}${sep}${day}`

    if (trancate == 'y') {
        return `${year}`
    }
    else if (trancate == 'm') {
        return `${year}${sep}${month}`
    }
    else if (trancate == 'd') {
        return r
    }
    if (start) {
        return r + ' 00:00:00'
    }
    if (end) {
        return r + ' 23:59:59'
    }
    return r + ` ${hours}${sepLast}${minutes}${sepLast}${seconds}`
}

/**
 *
 * @param {number|string|null} v1
 * @param {number|string|null} v2
 * @returns string
 */
const subNumbers = (v1, v2, digit = 2) => {
    const a = new Decimal((v1 || '0').toString().replaceAll(',', ''))
    const b = new Decimal((v2 || '0').toString().replaceAll(',', ''))
    const rs = a.sub(b).toFixed(digit)
    return rs
}

const addNumbers = (v1, v2, digit = 2) => {
    const a = new Decimal((v1 || '0').toString().replaceAll(',', ''))
    const b = new Decimal((v2 || '0').toString().replaceAll(',', ''))
    const rs = a.plus(b).toFixed(digit)
    return rs
}

const maxText = (str, length = 10) => {
    if (!str) {
        return ''
    }
    const s = str.toString().trim()
    if (s.length > length + 1) {
        const str = s.slice(0, length - 2) + '...'
        return str
    }
    return s
}


const strToDate = (dateStr, format = 'YYYY-MM-DD') => {
    // 解析格式字符串
    const formatParts = format.split(/[^YMD]+/);
    const separator = format.replace(/[YMD]/g, '')[0];

    // 使用分隔符分割日期字符串
    const dateParts = dateStr.split(separator);
    if (dateParts.length !== 3) {
        throw new Error('Date format does not match the separator or format parts count.');
    }

    // 映射年月日到相应的值
    let year, month, day;
    formatParts.forEach((part, index) => {
        const value = parseInt(dateParts[index], 10);
        if (part === 'YYYY') {
            year = value;
        } else if (part === 'MM') {
            month = value;
        } else if (part === 'DD') {
            day = value;
        }
    });

    // 创建Date对象，注意月份从0开始，所以需要减1
    const date = new Date(year, month - 1, day);

    // 检查日期是否有效
    if (date.getFullYear() != year || date.getMonth() + 1 != month || date.getDate() != day) {
        throw new Error('Invalid date.');
    }

    return date;
}

/**
 * @param  {string | Date} scala
 * @param {number} days
 * @param {string} fmt
 * @returns {Date}
*/
const until = (scala, days, fmt = 'YYYY-MM-DD') => {
    let start
    if (typeof scala === 'string') {
        start = strToDate(scala, fmt)
    } else {
        start = scala
    }
    start.setTime(start.getTime() - 3600 * 1000 * 24 * days * 2)
    return start
}


export {
    dateTimeFmt,
    numberFmt,
    getMonthDaysFromDate,
    timestampToFormattedString,
    formatDate,
    subNumbers,
    addNumbers,
    maxText,
    amountFormatter,
    amountParser,
    accountFormatter,
    accountParser,
    strToDate,
    until
}