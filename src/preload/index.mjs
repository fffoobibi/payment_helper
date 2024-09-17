import { contextBridge, ipcRenderer } from 'electron'
import fs from "fs"
const electron = {
  // 渲染进程 -> 主进程的调用
  login: (data) => ipcRenderer.invoke('login', data),
  toLogin: () => ipcRenderer.invoke('to-login'),
  window: (action, data) => ipcRenderer.invoke('win-action', { action, data }),
  capture: () => ipcRenderer.invoke('btn-capture'),
  log: (level, ...args) => ipcRenderer.send('log-event', level, ...args),
  config: {
    set: (key, value) => ipcRenderer.invoke('set-config', key, value),
    get: (key, defaultValue) => ipcRenderer.invoke('get-config', key, defaultValue),
    getDefault: (key, defaultValue) => ipcRenderer.invoke('get-default', key, defaultValue),
    setDefault: (key, value) => ipcRenderer.invoke('set-default', key, value)
  },
  viewImages: (urls, index = 0) => ipcRenderer.send('view-images', urls, index),
  viewLog: () => ipcRenderer.send('open-log'),
  files: {
    readFile: (path, callback) => {
      fs.readFile(path, 'utf8', (err, data) => {
        callback(err, data)
      }
      )
    }
  },
  update: {
    open: (version) => ipcRenderer.send('open-update', version),
    install: () => ipcRenderer.send('update:install'),
    download: () => ipcRenderer.send('update:download'),
    cancel: () => ipcRenderer.send('update:cancel'),
    checkForUpdates: (showMsgIfNew = true) => ipcRenderer.send('update:checkForUpdates', showMsgIfNew),
  },
  // 主进程 -> 渲染进程的事件
  onCapture: (callback) => ipcRenderer.on('key-capture', (_event, data) => callback(data)),
  onPreviewImage: (callback) => ipcRenderer.on('preview-images', (_event, urls, index, render) => callback(urls, index, render)),
  onExportExcel: (scallback, fcallback, ccallback) => {
    ipcRenderer.on('export-excel-success', () => {
      scallback?.()
    })

    ipcRenderer.on('export-excel-error', (event, error) => {
      fcallback?.(error)
    })
    ipcRenderer.on('export-excel-cancel', () => {
      ccallback?.()
    })
    return (data, fileName) => {
      ipcRenderer.send('export-excel', data, fileName)
    }
  },
  onOpenLog: (callback, aCallback) => {
    ipcRenderer.on('log-result', (event, content, path) => {
      callback(content, path)
    })
    ipcRenderer.on('log-append', (event, content, path) => {
      aCallback?.(content, path)
    })
  },
  // update
  onUpdater: (callback) => ipcRenderer.on('updater-message', (event, key, msg, ...args) => callback(key, msg, ...args)),
  onOpenUpdate: (callback) => ipcRenderer.on('update:dialog', (_event, version) => callback(version))

}

contextBridge.exposeInMainWorld('electron', electron)