import { contextBridge, ipcRenderer } from 'electron'

const electron = {
  // 渲染进程 -> 主进程的调用
  login: data => ipcRenderer.invoke('login', data),
  window: (action, data) => ipcRenderer.invoke('win-action', { action, data }),
  capture: () => ipcRenderer.invoke('btn-capture'),
  log: (level, ...args) => ipcRenderer.send('log-event', level, ...args),
  config: {
    set: (key, value) => ipcRenderer.invoke('set-config', key, value),
    get: (key, defaultValue) => ipcRenderer.invoke('get-config', key, defaultValue),
    getDefault: (key) => ipcRenderer.invoke('get-default', key),
    setDefault: (key, value) => ipcRenderer.invoke('set-default', key, value),
  },

  // 主进程 -> 渲染进程的事件
  onCapture: callback => ipcRenderer.on('key-capture', (_event, data) => callback(data)),
}

contextBridge.exposeInMainWorld('electron', electron)