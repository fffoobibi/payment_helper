import { contextBridge, ipcRenderer } from 'electron'

const electron = {
  login: (data) => ipcRenderer.send('login', data),
  window: (data) => ipcRenderer.send('window', data),
  config: {
    set: (key, value) => ipcRenderer.invoke('set-config', key, value),
    get: (key, defaultValue) => ipcRenderer.invoke('get-config', key, defaultValue),
    getDefault: (key) => ipcRenderer.invoke('get-default', key),
    setDefault: (key, value) => ipcRenderer.invoke('set-default', key, value)
  }
}

contextBridge.exposeInMainWorld('electron', electron)
