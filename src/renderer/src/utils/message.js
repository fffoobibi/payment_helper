import { ElMessage } from 'element-plus'

const showMessage = (msg, callback, type) => {
  ElMessage({
    type,
    message: msg,
    duration: 2000,
    onClose: () => {
      callback && callback()
    }
  })
}

const message = {
  success: (msg, callback) => showMessage(msg, callback, 'success'),
  error: (msg, callback) => showMessage(msg, callback, 'error'),
  warning: (msg, callback) => showMessage(msg, callback, 'warning'),
  info: (msg, callback) => showMessage(msg, callback, 'info')
}

export default message