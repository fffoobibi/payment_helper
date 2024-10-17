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
  viewImages: (urls, index = 0) => ipcRenderer.send('open-images', urls, index, 'image'),
  newWindow: (urlname, params = {}, options = {}) => ipcRenderer.send('new-window', urlname, params, options),
  viewLog: () => ipcRenderer.send('open-log', 'log'),
  files: {
    readFile: (path, callback) => {
      fs.readFile(path, 'utf8', (err, data) => {
        callback(err, data)
      }
      )
    }
  },
  update: {
    open: (version) => ipcRenderer.send('open-update', version, 'update'),
    install: () => ipcRenderer.send('open-update:install'),
    download: () => ipcRenderer.send('open-update:download'),
    cancel: () => ipcRenderer.send('open-update:cancel'),
    checkForUpdates: (showMsgIfNew = true) => ipcRenderer.invoke('open-update:checkForUpdates', showMsgIfNew),
  },
  sql: {
    query: (sql, params) => ipcRenderer.invoke('sql-query', sql, params),
    insert: (table, data) => ipcRenderer.invoke('sql-insert', table, data),
    update: (table, data, where) => ipcRenderer.invoke('sql-update', table, data, where),
    delete: (table, where) => ipcRenderer.invoke('sql-delete', table, where),
  },
  operate: {
    query: (sql, params) => ipcRenderer.invoke('operate-sql-query', sql, params),
    insert: (table, data) => ipcRenderer.invoke('operate-sql-insert', table, data),
    update: (table, data, where) => ipcRenderer.invoke('operate-sql-update', table, data, where),
    delete: (table, where) => ipcRenderer.invoke('operate-sql-delete', table, where),
    record: (data) => ipcRenderer.send('operate-sql:record', data),
    getRecords: userId => ipcRenderer.invoke('operate-sql:getRecords', userId),
    onRecordEvent: callback => {
      ipcRenderer.on('operate-sql:record-event', (_event, data) => {
        callback(data)
      })
    }
  },
  // excel
  openExcel: (user, config) => ipcRenderer.send('open-excel', user, config, 'excel',),
  onOpenExcel: (callback, statusCallback) => {
    ipcRenderer.on('open-excel:success', (_event, user, file, data) => {
      callback(user, file, data)
    })
    ipcRenderer.on('open-excel:ok', (event) => {
      statusCallback()
    })
    ipcRenderer.on('open-excel:error', (event) => {
      statusCallback()
    })
    ipcRenderer.on('open-excel:cancel', (event) => {
      statusCallback()
    })
  },
  sendSelectData: (data) => ipcRenderer.send('open-excel:data', data),
  onExcelData: (callback) => ipcRenderer.on('open-excel:batch-select-excel-data', (event, data) => callback(data)),
  sendExcelColorData: (data) => ipcRenderer.send('open-excel:excelColor-change', data),
  onNewExcelColor: (callback) => ipcRenderer.on('open-excel:excelColor-new', (event, data) => callback(data)),

  // 主进程 -> 渲染进程的事件
  onCapture: (callback) => ipcRenderer.on('key-capture', (_event, data) => callback(data)),
  onShortCutCapture: callback => ipcRenderer.on('shortcut-key-capture', (_event, data) => callback(data)),
  onPreviewImage: (callback) => ipcRenderer.on('open-images:success', (_event, urls, index, render) => callback(urls, index, render)),
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
  onNewWindow: (callback) => ipcRenderer.on('load-window', (_event, urlname, params) => callback(urlname, params)),
  onOpenLog: (callback, aCallback) => {
    ipcRenderer.on('open-log:success', (event, content, path) => {
      callback(content, path)
    })
    ipcRenderer.on('open-log:append', (event, content, path) => {
      aCallback?.(content, path)
    })
  },
  // update
  onUpdater: (callback) => ipcRenderer.on('open-update:message', (event, key, msg, ...args) => callback(key, msg, ...args)),
  onOpenUpdate: (callback) => ipcRenderer.on('open-update:success', (_event, version) => callback(version))
}

contextBridge.exposeInMainWorld('electron', electron)