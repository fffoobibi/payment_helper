import { ipcMain } from 'electron'


const onLogin = (callback) => {
  ipcMain.on('login', (e, data) => {
    callback(data)
  })
}

const onWindow = (callback) => {
  ipcMain.on('window', (e, data) => {
    callback(e, data)
  })
}

export {
  onLogin,
  onWindow
}