import { app, shell, BrowserWindow, Tray, Menu, globalShortcut, ipcMain, dialog, crashReporter } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import Screenshots from 'electron-screenshots'
import Store from 'electron-store'
import icon from '../../resources/icon.png?asset'
import trayIcon from '../../resources/favicon.ico?asset'
import log from 'electron-log'
import fs from 'fs'
import db from './db.js'
import { OperateDataBase } from './operatedb.js'
import * as XLSX from 'xlsx'
import * as CONSTANTS from './constants.js'

import _ from 'electron-updater'
// import * as UPDATER from 'electron-updater'
import { hash } from 'crypto'
const autoUpdater = _.autoUpdater

// 配置文件
const store = new Store()
console.log(store.path)
const getCurrentConfig = (key, defaultValue) => {
  const v = store.get('currentUserId', null)
  if (v === null || v === undefined) {
    return null
  }
  const field = `${v}.${key}`
  const rs = store.get(field)
  let r = rs || {}
  if (r.value === undefined) {
    return defaultValue
  }
  return r.value
}

// 更新管理
class Updater {
  win = null
  showIfNew = true
  flag = false

  sendStatusToWindow(event, text, ...args) {
    try {
      this.win.webContents.send('open-update:message', event, text, ...args)
      if (is.dev) {
        console.log('open-update:message ==>', event)
      }
    } catch (err) { }
  }

  _initMainCallback() {
    try {
      ipcMain.on('open-update:download', (_event) => {
        autoUpdater.downloadUpdate()
      })
      ipcMain.on('open-update:cancel', (_event) => { })
      ipcMain.on('open-update:install', (_event) => {
        autoUpdater.quitAndInstall(false, true)
      })
      ipcMain.handle('open-update:checkForUpdates', async (_event, showIfNew) => {
        try {
          this.showIfNew = showIfNew
          const rs = await autoUpdater.checkForUpdates()
          return rs
        } catch (err) {
          console.error('error in checkForUpdates')
        }
      })
    } catch (err) {
      console.log('err in set up update', err)
    }
  }

  init(win) {
    this.win = win
    if (!this.flag) {
      ipcMain.on('open-update', (event, version, hash) => {
        manager.createWindow(
          'update',
          (frame) => {
            frame.webContents.send('open-update:success', version)
            this.win = frame
          },
          { width: 600, height: 300, resizable: false, hash }
        )
      })

      autoUpdater.autoDownload = false
      autoUpdater.logger = log
      const isPro = store.get('pro')?.value ?? true
      // const debugFeedLocalUrl = 'http://36.32.174.26:5018/updates'
      // const debugFeedLocalUrl = 'http://192.168.0.10:20010/upload'
      // const debugFeedLocalUrl = CONSTANTS.debugFeedLocalUrl
      const feedUrl = isPro ? (store.get('versionFormalUrl')?.value ?? CONSTANTS.feedUrl) : (store.get('versionTestUrl')?.value ?? CONSTANTS.debugFeedUrl)
      if (is.dev) {
        autoUpdater.forceDevUpdateConfig = true
      }
      autoUpdater.setFeedURL(feedUrl)

      autoUpdater.on('checking-for-update', () => {
        this.sendStatusToWindow('checking-for-update', 'Checking for update...')
      })

      autoUpdater.on('update-available', (info) => {
        this.sendStatusToWindow('update-available', info, this.showIfNew)
      })

      autoUpdater.on('update-not-available', (info) => {
        this.sendStatusToWindow('update-not-available', info)
      })

      autoUpdater.on('error', (err, msg) => {
        this.sendStatusToWindow('error', err, msg)
      })

      autoUpdater.on('download-progress', (progressObj) => {
        this.sendStatusToWindow('download-progress', progressObj)
      })

      autoUpdater.on('update-downloaded', (info) => {
        this.sendStatusToWindow('update-downloaded', info)
      })

      this._initMainCallback()
      // autoUpdater.checkForUpdatesAndNotify().then((info) => {
      //   // console.log('info ', info)
      // })
    }
  }
}

const updater = new Updater()

// 窗口管理
class WindowManger {
  windows = new Map()

  /**
   * @param {String} name
   * @param {(win: BrowserWindow)=>void} after
   * @param {{title: String, width: Number, height: Number, resizable: Boolean, hash: String}} createOptions
   */
  createWindow(
    name,
    after,
    createOptions = { title: '', width: mainWidth, height: mainHeight, resizable: true, hash },
    openDevTools = false
  ) {
    let flag = false
    if (!this.windows.has(name)) {
      const win = new BrowserWindow({
        width: createOptions.width ?? mainWidth,
        height: createOptions.height ?? mainHeight,
        frame: false,
        transparent: true,
        closable: true,
        resizable: createOptions.resizable ?? true,
        maximizable: true,
        alwaysOnTop: true,
        center: true,
        show: false,
        autoHideMenuBar: true,
        title: createOptions.title ?? '',
        titleBarStyle: 'hidden',
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          webSecurity: false,
          sandbox: false,
          preload: join(__dirname, '../preload/index.mjs')
        }
      })
      win.__child = true
      this.windows.set(name, win)
      flag = true
    }
    const previewWindow = this.windows.get(name)

    if (is.dev) {
      if (flag) {
        previewWindow
          .loadURL(process.env['ELECTRON_RENDERER_URL'])
          .then(() => {
            after(previewWindow)
            previewWindow.show()
            if (openDevTools) {
              previewWindow.webContents.openDevTools()
            }
          })
          .catch((err) => {
            log.error('open fail', err)
          })
      } else {
        after(previewWindow)
        previewWindow.setAlwaysOnTop(true, "screen-saver")
        previewWindow.show()
        previewWindow.center()

        if (openDevTools) {
          previewWindow.webContents.openDevTools()
        }
      }
    } else {
      if (flag) {
        previewWindow
          .loadFile(join(__dirname, '../renderer/index.html'), { hash: hash.toString() })
          .then(() => {
            after(previewWindow)
            previewWindow.setAlwaysOnTop(true, "screen-saver")
            previewWindow.show()
            // previewWindow.webContents.openDevTools()
          })
          .catch((err) => {
            log.error('open fail', err, 'hash ', hash)
          })
      } else {
        after(previewWindow)
        previewWindow.setAlwaysOnTop(true, "screen-saver")
        previewWindow.show()
        previewWindow.center()
      }
    }
  }

  get(name) {
    return this.windows.get(name)
  }

  destroy(name) {
    this.get(name).close()
    this.windows.delete(name)
  }

  onCloseType(closeType) {
    try {
      switch (closeType) {
        case 2: // 图片
          this.get('preview').hide()
          break
        case 3: //日志
          this.get('log').hide()
          break
        case 4: // 更新
          this.destroy('update')
          break
        case 5: // 更新
          this.destroy('excel')
          break
        case 6:
          this.destroy('detail')
          break
        default:
          break
      }
    } catch (err) {
      log.error('err in close type', err)
    }

  }

  onClose() {
    this.windows.forEach((frame) => {
      try {
        frame.close()
      } catch (err) {
        log.error('err in app close', err)
      }
    })
  }
}

const manager = new WindowManger()

// 日志配置
const formatDate = (date) => {
  function padZero(num) {
    return num < 10 ? '0' + num : num
  }

  const year = date.getFullYear()
  const month = padZero(date.getMonth() + 1) // getMonth() 返回的是从0开始的月份
  const day = padZero(date.getDate())
  const hours = padZero(date.getHours())
  const minutes = padZero(date.getMinutes())
  const seconds = padZero(date.getSeconds())
  const milliseconds = date.getMilliseconds().toString().padStart(3, '0') // 确保毫秒有三位数

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}
const maxFiles = 5
log.transports.custom = (msg) => {
  const logWin = manager.get('log')
  if (logWin) {
    const text = log.transports.file.transforms[3](msg)
    const data = `[${formatDate(msg.date)}] [${msg.level}] ` + text
    logWin.webContents.send('open-log:append', data, log.transports.file.resolvePathFn())
  }
}
log.transports.file.maxSize = 10 * 1024 * 1024 // 日志大小
log.transports.file.level = 'debug' // level
log.transports.console.level = false
log.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}] [{level}] {text}'
log.transports.file.resolvePathFn = () => {
  const directoryPath = join(app.getPath('home'), '.payment_helper/logs')
  const logFileName = is.dev ? 'payment_helper_dev.log' : 'payment_helper.log'
  // 确保日志目录存在
  try {
    if (!fs.existsSync(directoryPath)) {
      fs.mkdirSync(directoryPath, { recursive: true })
    }
  } catch (error) {
    console.error(`Error creating directory: ${error.message}`)
    return null
  }

  const logPath = join(directoryPath, logFileName)

  // 检查当前日志文件大小
  if (fs.existsSync(logPath) && fs.statSync(logPath).size >= log.transports.file.maxSize) {
    // 如果当前日志文件超过最大大小，轮转日志文件
    for (let i = maxFiles - 1; i > 0; i--) {
      const oldPath = join(directoryPath, `${logFileName}.${i}`)
      const newPath = join(directoryPath, `${logFileName}.${i + 1}`)

      if (fs.existsSync(oldPath)) {
        fs.renameSync(oldPath, newPath)
      }
    }
    fs.renameSync(logPath, join(directoryPath, `${logFileName}.1`))
  }
  return logPath
}
// crashReporter.start()
const crashFilePath = app.getPath('crashDumps')
console.log('------crashFilePath------', crashFilePath)

crashReporter.start({
  productName: 'payment',
  uploadToServer: false, // 是否上传服务器
  ignoreSystemCrashHandler: false // 不忽略系统自带的奔溃处理，为 true 时表示忽略，奔溃时不会生成奔溃堆栈文件
})


const directoryPath = join(app.getPath('home'), '.payment_helper')
const dbPath = is.dev ? 'operate_dev.db' : 'operate.db'
const operateDb = new OperateDataBase(join(directoryPath, dbPath))

const loginWidth = 360
const loginHeight = 400
const mainWidth = 950 + 20 + 160
const mainHeight = 700 + 200

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    icon: icon,
    width: loginWidth,
    height: loginHeight,
    show: false,
    autoHideMenuBar: true,
    title: 'payhelper',
    titleBarStyle: 'hidden',
    frame: false,
    transparent: true,
    closable: true,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: join(__dirname, '../preload/index.mjs'),
      sandbox: false,
      webSecurity: is.dev ? true : false,
      devTools: is.dev ? true : false
    }
  })

  if (is.dev) {
    mainWindow.webContents.openDevTools()
  }

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.on('close', () => {
    manager.onClose()
    app.quit()
  })

  mainWindow.on('hide', () => {
    console.log('main hide ')
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // ================ 托盘操作 ================
  const tray = new Tray(trayIcon)
  const contextMenu = [{ label: '退出', click: () => app.quit() }]
  const menu = Menu.buildFromTemplate(contextMenu)
  tray.setContextMenu(menu)
  tray.setToolTip('百舟打款助手')
  tray.on('click', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide()
      mainWindow.setSkipTaskbar(true)
    } else {
      mainWindow.show()
      mainWindow.setSkipTaskbar(false)
    }
  })

  // ================ ipc 监听事件列表 ================
  // 登录成功
  ipcMain.handle('login', (e, data) => {
    mainWindow.setResizable(true)
    mainWindow.setSize(mainWidth, mainHeight)
    mainWindow.center() // 窗口居中
    mainWindow.setMaximizable(true) // 窗口可放大
    mainWindow.setMinimumSize(mainWidth, mainHeight) // 窗口最小尺寸为默认尺寸
    mainWindow.setResizable(true)

    // TODO: 添加托盘操作
    contextMenu.unshift({ label: data.username, click: () => { } })
  })

  // 去登录
  ipcMain.handle('to-login', (e) => {
    // mainWindow.setResizable(true)
    // mainWindow.setSize(loginWidth, loginHeight)
    // mainWindow.center() // 窗口居中
    // mainWindow.setResizable(false)
    // console.log('tologin ', mainWindow.getSize());

    mainWindow.setResizable(true)
    mainWindow.setSize(320, 320)
    mainWindow.center()
    mainWindow.setResizable(false)
    console.log('to login ')
  })

  // 窗口控制
  ipcMain.handle('win-action', (e, { action, data }) => {
    const webContents = e.sender
    const win = BrowserWindow.fromWebContents(webContents)
    switch (action) {
      case 'minimize':
        win.minimize()
        break
      case 'maximize':
        win.maximize()
        break
      case 'unmaximize':
        win.unmaximize()
        break
      case 'pin':
        win.setAlwaysOnTop(data.isPin)
        break
      case 'close': {
        if (data.closeType == 0) {
          win.close()
        } else if (data.closeType == 1) {
          win.hide()
        } else {
          manager.onCloseType(data.closeType)
        }
        break
      }
    }
  })

  // 截图事件
  const screenshots = new Screenshots()
  ipcMain.handle('btn-capture', (e) => {
    mainWindow.hide()
    screenshots.startCapture()
  })

  const state = { global: false }
  // 绑定全局快捷键
  globalShortcut.register('ctrl+q', () => {
    state.global = true
    mainWindow.hide()
    screenshots.startCapture()
  })

  // 点击确定按钮回调事件
  screenshots.on('ok', (e, buffer, bounds) => {
    // const src = 'data:image/png;base64,' + btoa(String.fromCharCode(...new Uint8Array(buffer)))

    const pined = getCurrentConfig("pinned", false)
    mainWindow.setAlwaysOnTop(pined, 'screen-saver')
    mainWindow.show()

    const src = 'data:image/png;base64,' + btoa(new Uint8Array(buffer).reduce((data, btye) => data + String.fromCharCode(btye), ''))
    if (state.global) {
      mainWindow.webContents.send('shortcut-key-capture', src)
    } else {
      mainWindow.webContents.send('key-capture', src)
    }
    state.global = false
  })

  // 点击取消按钮回调事件
  screenshots.on('cancel', () => {

    const pined = getCurrentConfig("pinned", false)
    mainWindow.setAlwaysOnTop(pined, 'screen-saver')
    mainWindow.show()

    screenshots.endCapture()
    state.global = false
  })
  // 点击保存按钮回调事件
  screenshots.on('save', (e, buffer, bounds) => {
    // console.log("capture", buffer, bounds)
    state.global = false
  })
  // esc取消
  globalShortcut.register('esc', () => {
    if (screenshots.$win?.isFocused()) {
      const pined = getCurrentConfig("pinned", false)
      mainWindow.setAlwaysOnTop(pined, 'screen-saver')

      mainWindow.show()
      screenshots.endCapture()
      state.global = false
    }
  })

  ipcMain.handle('set-config', (event, key, value) => {
    if (value !== undefined) {
      store.set(key, value)
    }
  })

  ipcMain.handle('get-config', (event, key, defaultValue) => {
    const rs = store.get(key, defaultValue)
    return rs
  })

  ipcMain.handle('get-default', (event, key, defaultValue) => {
    const v = store.get('currentUserId', null)
    if (v === null || v === undefined) {
      return null
    }
    const field = `${v}.${key}`
    const rs = store.get(field, defaultValue)
    return rs
  })

  ipcMain.handle('set-default', (event, key, value) => {
    const v = store.get('currentUserId', null)
    if (v === null || v === undefined) {
      return null
    }
    const field = `${v}.${key}`
    store.set(field, value)
  })

  // 图片
  ipcMain.on('open-images', (event, urls, index, hash) => {
    manager.createWindow(
      'preview',
      (frame) => {
        frame.webContents.send('open-images:success', urls, index, Date.now())
      },
      { title: 'preview', hash }
    )
  })

  // 日志
  ipcMain.on('open-log', (event, hash) => {
    manager.createWindow(
      'log',
      (frame) => {
        const filePath = log.transports.file.resolvePathFn()
        frame.webContents.send('open-log:success', '', filePath)
      },
      { title: 'log', hash }
    )
  })

  // excel保存
  ipcMain.on('export-excel', (event, data, defaultPath) => {
    dialog
      .showSaveDialog({
        title: '保存Excel文件',
        defaultPath,
        filters: [{ name: 'Excel files', extensions: ['xlsx'] }]
      })
      .then((result) => {
        if (!result.canceled && result.filePath) {
          try {
            const wb = XLSX.utils.book_new()
            const ws = XLSX.utils.json_to_sheet(data)
            XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')
            const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' })
            fs.writeFile(result.filePath, buffer, (err) => {
              if (err) {
                event.reply('export-excel-error', err.message) // 发送错误消息
              } else {
                event.reply('export-excel-success') // 发送成功消息
              }
            })
          } catch (error) {
            log.error('保存excel失败', err)
            event.reply('export-excel-error', error.message) // 发送错误消息
          }
        } else {
          event.reply('export-excel-cancel')
        }
      })
      .catch((err) => {
        log.error('保存excel失败', err)
      })
  })

  // excel编辑窗口
  const stox = (wb, excelColors) => {
    var out = []
    const styleObj = {}
    const styles = []
    Object.keys(excelColors).forEach((k, index) => {
      const v = excelColors[k]
      if (v.col !== undefined) {
        styleObj[v.col] = index
      }
      styles.push({ color: v.color })
    })

    wb.SheetNames.slice(0, 1).forEach((name) => {
      var o = { name: name, rows: {}, merges: [] }
      var ws = wb.Sheets[name]
      // var aoa = XLSX.utils.sheet_to_json(ws, { raw: false, header: 1 })
      // aoa.forEach((r, i) => {
      //   var cells = {}
      //   r.forEach((c, j) => {
      //     if (styleObj[j] !== undefined) {
      //       cells[j] = { text: c, style: styleObj[j] }
      //     } else {
      //       cells[j] = { text: c }
      //     }
      //   })
      //   o.rows[i] = { cells: cells }
      // })
      o.styles = styles

      // 设置合并单元格
      // if (ws['!merges']) {
      //   ws['!merges'].forEach((merge) => {
      //     let cell = o.rows[merge.s.r].cells[merge.s.c]
      //     //无内容单元格处理
      //     if (!cell) {
      //       cell = { text: '' }
      //     }
      //     cell.merge = [merge.e.r - merge.s.r, merge.e.c - merge.s.c]
      //     o.rows[merge.s.r].cells[merge.s.c] = cell

      //     // 修改 merges
      //     o.merges.push(XLSX.utils.encode_range(merge))
      //   })
      // }
      out.push(o)
    })
    return out
  }

  // excel编辑窗口
  const stoxNoFile = (excelColors) => {
    var out = []
    const styleObj = {}
    const styles = []
    Object.keys(excelColors).forEach((k, index) => {
      const v = excelColors[k]
      if (v.col !== undefined) {
        styleObj[v.col] = index
      }
      styles.push({ color: v.color })
    })
    var o = { name: 'sheet1', rows: {}, merges: [] }
    o.styles = styles
    out.push(o)
    return out
  }

  ipcMain.on('open-excel:data', (event, data) => {
    try {
      mainWindow.webContents.send('open-excel:batch-select-excel-data', data)
    } catch (err) {

    }
  })

  ipcMain.on('open-excel:excelColor-change', (event, data) => {
    try {
      mainWindow.webContents.send('open-excel:excelColor-new', data)
    } catch (err) {

    }
  })

  ipcMain.on('open-excel', (event, user, config, hash) => {
    try {
      const excelData = stoxNoFile(config)
      manager.createWindow(
        'excel',
        (frame) => {
          console.log('success ');
          frame.webContents.send('open-excel:success', user, 'temp.xlsx', excelData)
          mainWindow.webContents.send('open-excel:ok')
        },
        { title: 'excel', hash },
        true
      )
    } catch (error) {
      console.log('open excel fail ', error)
      log.error('Excel加载失败', error)
      mainWindow.webContents.send('open-excel:error', error.message)
    }
  })

  // 详情查看
  ipcMain.on('open-detail-dialog', (event, user, detailId, hash) => {
    try {
      manager.createWindow(
        'detail',
        (frame) => {
          frame.webContents.send('open-detail-dialog:success', user, detailId)
        },
        { title: 'detail', hash, width: 740 },
        false,
      )
    } catch (error) {
      log.error('详情窗口打开失败', error)
    }
  })

  // dialog
  //   .showOpenDialog({
  //     title: '打开Excel文件',
  //     defaultPath: app.getPath('desktop'),
  //     filters: [{ name: 'Excel files', extensions: ['xlsx', 'xls'] }],
  //     properties: ['openFile']
  //   })
  //   .then((result) => {
  //     if (!result.canceled && result.filePaths.length) {
  //       try {
  //         const fileBuffer = fs.readFileSync(result.filePaths[0])
  //         const workbook = XLSX.read(fileBuffer, { type: 'buffer' })
  //         const excelData = stox(workbook, config)
  //         manager.createWindow(
  //           'excel',
  //           (frame) => {
  //             frame.webContents.send('open-excel:success', user, result.filePaths[0], excelData)
  //             mainWindow.webContents.send('open-excel:ok')
  //           },
  //           { title: 'excel', hash },
  //           true
  //         )
  //       } catch (error) {
  //         log.error('Excel加载失败', error)
  //         mainWindow.webContents.send('open-excel:error', error.message)
  //         // event.reply('open-excel:error', error.message) // 发送错误消息
  //       }
  //     } else {
  //       mainWindow.webContents.send('open-excel:cancel')
  //       // event.reply('open-excel:cancel')
  //     }
  //   })
  //   .catch((err) => {
  //     log.error('保存excel失败', err)
  //   })

  updater.init(mainWindow)
  operateDb.initHandles(mainWindow)

}

ipcMain.on('log-event', (event, level, ...args) => {
  switch (level) {
    case 'info':
      log.info(...args)
      break
    case 'debug':
      log.debug(...args)
      break
    case 'warn':
      log.warn(...args)
      break
    case 'error':
      log.error(...args)
      break
    default:
      break
  }
})

ipcMain.on('new-window', (event, urlname, params, options) => {
  const newWin = new BrowserWindow({
    icon: icon,
    width: mainWidth,
    height: mainHeight,
    show: false,
    autoHideMenuBar: true,
    title: options.title ?? '新窗口',
    titleBarStyle: 'hidden',
    frame: false,
    transparent: true,
    closable: false,
    maximizable: true,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: join(__dirname, '../preload/index.mjs'),
      sandbox: false
    }
  })

  newWin.loadURL(process.env['ELECTRON_RENDERER_URL']).then(() => {
    newWin.show()
    newWin.center()
    newWin.webContents.send('load-window', urlname, params)
  })
})

// sql
ipcMain.handle('sql-query', async (event, sql, params) => {
  const result = await db.query(sql, params)
  if (result) return result
})

ipcMain.handle('sql-insert', async (event, table, data) => {
  const result = await db.insert(table, data)
  if (result) return result
})

ipcMain.handle('sql-update', async (event, table, data, where) => {
  const result = await db.update(table, data, where)
  if (result) return result
})

ipcMain.handle('sql-delete', async (event, table, where) => {
  const result = await db.delete(table, where)
  if (result) return result
})



// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
