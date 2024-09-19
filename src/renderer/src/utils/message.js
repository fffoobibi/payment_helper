import { ElMessage } from 'element-plus'

const showMessage = (msg, callback, type, duration = 2000) => {
  ElMessage({
    type,
    message: msg,
    duration: duration,
    onClose: () => {
      callback && callback()
    }
  })
}

const message = {
  success: (msg, callback) => showMessage(msg, callback, 'success'),
  error: (msg, callback) => showMessage(msg, callback, 'error', 5000),
  warning: (msg, callback) => showMessage(msg, callback, 'warning'),
  info: (msg, callback) => showMessage(msg, callback, 'info')
}

export default message