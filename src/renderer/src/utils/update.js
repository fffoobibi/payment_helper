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
    open(){
        electron.update.open()
    }

}


const updater = new Update()

export default updater