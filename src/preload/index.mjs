import { contextBridge, ipcRenderer } from 'electron'

const electron = {
  login: data => ipcRenderer.send('login', data),
  window: data => ipcRenderer.send('window', data),
  config: {
    set: key => ipcRenderer.invoke("set-config", key),
    get: key => ipcRenderer.invoke("get-config", key)
  }
}

contextBridge.exposeInMainWorld('electron', electron)
