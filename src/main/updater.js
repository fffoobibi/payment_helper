// import { autoUpdater } from 'electron-updater'
// const log = require('electron-log')
// const u = require('electron-updater')
// const autoUpdater = u.autoUpdater

// autoUpdater.logger = log
// autoUpdater.logger.transports.file.level = 'info'
// const { autoUpdater } = require('electron-updater');


// import up from "electron-updater"
// const autoUpdater = up.autoUpdater
// class Updater {
//   win = null
//   sendStatusToWindow(text) {
//     this.win.webContents.send('update-message', text)
//   }

//   init(win) {
//     this.win = win
//     autoUpdater.on('checking-for-update', () => {
//       this.sendStatusToWindow('Checking for update...')
//     })
//     autoUpdater.on('update-available', (info) => {
//       console.log('update ava')
//       this.sendStatusToWindow('Update available.')
//     })
//     autoUpdater.on('update-not-available', (info) => {
//       this.sendStatusToWindow('Update not available.')
//     })
//     autoUpdater.on('error', (err) => {
//       this.sendStatusToWindow('Error in auto-updater. ' + err)
//     })
//     autoUpdater.on('download-progress', (progressObj) => {
//       let log_message = 'Download speed: ' + progressObj.bytesPerSecond
//       log_message = log_message + ' - Downloaded ' + progressObj.percent + '%'
//       log_message = log_message + ' (' + progressObj.transferred + '/' + progressObj.total + ')'
//       this.sendStatusToWindow(log_message)
//     })

//     autoUpdater.on('update-downloaded', (info) => {
//       this.sendStatusToWindow('Update downloaded')
//     })
//   }
// }

// const updater = new Updater()
// // export { updater }
// module.exports = {
//   updater
// }
