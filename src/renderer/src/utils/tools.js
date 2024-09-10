import { toRaw } from 'vue'
import notification from './notification'

const viewImages = (urls, index = 0) => {
  const r = toRaw(urls)
  console.log('view images', urls)
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

export { viewImages, getIndexFromArray, setUpExportToExcel, setUpCapture }
