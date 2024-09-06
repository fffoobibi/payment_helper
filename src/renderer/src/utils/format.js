import Decimal from "decimal.js"

/**
 * 将时间戳或日期转换成指定格式
 * @param {String|Date|timestamp} date
 * @returns
 */
const dateTimeFmt = (date, showDetail = false) => {
    //  auto 0
    const autoZero = (n) => (String(n).length === 1 ? '0' : '') + n
    // string to timestamp
    const strToTimestamp = (str) => Date.parse(str.replace(/-/gi, '/'))
    let oriSecond = date
    if (typeof date === 'String') {
        oriSecond = strToTimestamp(date)
    } else if (date instanceof Date) {
        oriSecond = date.getTime() / 1000
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

    // just
    if (diffSecond < 60) {
        // within a minute
        return '刚刚'
    } else if (diffSecond < 3600) {
        // within an hour
        return `${Math.floor(diffSecond / 60)}分钟前`
    } else if (
        curDate.getFullYear() === Y &&
        curDate.getMonth() + 1 === m &&
        curDate.getDate() === d
    ) {
        return `${autoZero(H)}:${autoZero(i)}`
    }
    // yesterday
    let mewDate = new Date((curSecond - 86400) * 1000)
    if (mewDate.getFullYear() === Y && mewDate.getMonth() + 1 === m && mewDate.getDate() === d) {
        return `昨天`
    } else if (curDate.getFullYear() === Y) {
        if (showDetail) {
            return `${m}月${d}日 ${autoZero(H)}:${autoZero(i)}`
        }
        return `${m}月${d}日`
    }
    if (showDetail) {
        return `${Y}年${m}月${d}日 ${autoZero(H)}:${autoZero(i)}`
    }
    return `${Y}年${m}月${d}日`
}

/**
 * 数字千位分隔
 * @param {string|number} n
 * @returns
 */
const numberFmt = n => {
    if (!n) {
        return ''
    }
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

/**
 *
 * @param {number} timestamp
 * @returns
 */
const timestampToFormattedString = (timestamp) => {
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

    // 拼接成指定格式的字符串
    return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
}

/**
 *
 * @param {number|string|null} v1
 * @param {number|string|null} v2
 * @returns string
 */
const subNumbers = (v1, v2, digit = 2) => {
    const a = Decimal((v1 || '0').toString().replaceAll(',', ''))
    const b = Decimal((v2 || '0').toString().replaceAll(',', ''))
    const rs = a.sub(b).toFixed(digit)
    return rs
}

const maxText = (str, length = 15) => {
    if (!str) {
        return ''
    }
    const s = str.toString().trim()
    if (s.length >= length) {
        const str = s.slice(0, length) + '...'
        return str
    }
    return s
}
export {
    dateTimeFmt,
    numberFmt,
    timestampToFormattedString,
    subNumbers,
    maxText
}