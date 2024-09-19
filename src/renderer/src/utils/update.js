import { toRaw } from 'vue'
class Update {
  async checkUpdates(showMsg) {
    return await electron.update.checkForUpdates(showMsg)
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
