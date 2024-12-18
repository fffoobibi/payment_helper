import { toRaw, ref } from 'vue'
import notification from './notification'
import { useUserStore, useExcelStore, useScreenShortStore } from '../stores'
import { useLocalConfig } from '../stores/config'
import appInfo from "../../../../package.json"

const isDev = !import.meta.env.PROD

const viewImages = (urls, index = 0) => {
  const r = toRaw(urls)
  electron.viewImages(r, index)
}

const getIndexFromArray = (array, callback) => {
  for (let i = 0; i < array.length; i++) {
    if (callback(array[i])) {
      return i
    }
  }
}

/**
 * 导出为excel
 * @param  { (()=>void ) | null} all
 * @param  { (()=>void ) | null} callback
 * @param  { ((err: String)=>void) | null } errback
 * @param  { (()=>void ) | null} cancel
 * @return { (data: any[], fileName: String)=>void}
*/
const setUpExportToExcel = (all, callback, errback, cancel) => {
  const sender = electron.onExportExcel(() => {
    notification.success('EXCEL文件已导出!')
    all?.()
    callback?.()
  }, (err) => {
    notification.warning('EXCEL文件导出失败!')
    all?.()
    errback?.(err)
  }, () => {
    all?.()
    cancel?.()
  })
  return sender
}

const setUpCapture = (callback) => {
  // 截图
  electron.onCapture(async src => {
    callback(src)
  })

  const crop = () => {
    electron.capture().catch(err => {
      notification.error('截图失败!')
      logger.error('capture fail', err)
    })
  }
  return crop
}

const useFutureControl = () => {
  const current = ref(appInfo.version)

  const convert = v => {
    let c = current.value.replaceAll('.', '')
    let r = v.replaceAll('.', '')
    const maxLen = Math.max(r.length, c.length)
    let l = c.padEnd(maxLen, '0')
    let t = r.padEnd(maxLen, '0')
    return [parseInt(l), parseInt(t)]
  }

  const eq = v => {
    if (!import.meta.env.PROD) return true
    const [r, t] = convert(v)
    return r == t
  }
  const gt = v => {
    if (!import.meta.env.PROD) return true
    const [r, t] = convert(v)
    return r > t
  }

  const gte = v => {
    if (!import.meta.env.PROD) return true
    const [r, t] = convert(v)
    return r >= t
  }
  const lt = v => {
    if (!import.meta.env.PROD) return true
    const [r, t] = convert(v)
    return r < t
  }
  const lte = v => {
    if (!import.meta.env.PROD) return true
    const [r, t] = convert(v)
    return r < + t
  }

  return {
    current, gt, gte, lt, lte, eq
  }
}
const useExcelBatchPayment = (callback = null, screenTag='batchExcel') => {
  const title = ref('新增打款')
  const batch = ref(false)
  const batchData = ref([])
  const show = ref(false)
  const store = useUserStore()
  const cfgStore = useLocalConfig()
  const ex = useExcelStore()
  const screen = useScreenShortStore()

  const openBatch = () => {
    ex.excelLoading = true
    electron.openExcel(toRaw(store.user), toRaw(cfgStore.excelColors))
  }
  const close = () => {
    show.value = false
    title.value = '新增打款'
    batch.value = false
    screen.setTag('unset')
  }
  electron.onExcelData(data => {
    show.value = true
    title.value = '批量新增打款 ' + `(${data.length})`
    batch.value = true
    batchData.value.splice(0)
    batchData.value.push(...data)
    callback?.()
    screen.setTag(screenTag)
  })
  electron.onNewExcelColor(data => {
    cfgStore.excelColors = data
  })
  return {
    openBatch, close, title, batch, batchData, show
  }
}

/**
 * 根据索引获取Excel列字母
 * @param {*} index 索引（从1开始）
 * @returns A-Z, AA-ZZ, AAA...
 */
const getExcelColumnLetter = (index) => {
  if (index < 0) {
    throw new Error('Index must be non-negative')
  }

  let columnLetter = ''
  while (index > 0) {
    index--
    let remainder = index % 26
    columnLetter = String.fromCharCode(65 + remainder) + columnLetter
    index = Math.floor(index / 26)
  }
  return columnLetter
}

const setItem = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value))
}
const getItem = key => {
  const v = localStorage.getItem(key)
  if (v !== null) {
    console.log('get item', key, JSON.parse(v))
    return JSON.parse(v)
  }
}
export { setItem, getItem, viewImages, getIndexFromArray, setUpExportToExcel, setUpCapture, getExcelColumnLetter, isDev, useExcelBatchPayment, useFutureControl }
