import { toRaw } from 'vue'
class Update {
  checkUpdates(showMsg) {
    electron.update.checkForUpdates(showMsg)
    // update: {
    //     download: () => ipcRenderer.send('update:download'),
    //     cancel: () => ipcRenderer.send('update:cancel'),
    //     checkForUpdates: () => ipcRenderer.send('update:checkForUpdates'),
    //   },
  }
  download() {
    electron.update.download()
  }
  cancel() {
    electron.update.cancel()
  }
  install() {
    electron.update.install()
  }
  open(version) {
    electron.update.open(toRaw(version))
  }
}

const updater = new Update()

export default updater
