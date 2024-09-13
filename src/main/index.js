import { app, shell, BrowserWindow, Tray, Menu, globalShortcut, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import Screenshots from 'electron-screenshots'
import Store from 'electron-store'
import icon from '../../resources/icon.png?asset'
import trayIcon from '../../resources/favicon.ico?asset'
import log from 'electron-log'
import fs from 'fs'
import * as XLSX from "xlsx"



// 日志配置
log.transports.file.maxSize = 10 * 1024 * 1024 // 日志大小
log.transports.file.level = 'debug' // level
log.transports.console.level = false
log.transports.file.resolvePathFn = () => {
  const directoryPath = join(app.getPath('home'), '.payment_helper/logs')
  try {
    if (!fs.existsSync(directoryPath)) {
      fs.mkdirSync(directoryPath, { recursive: true })
    }
  } catch (error) {
    console.error(`Error creating directory: ${error.message}`)
  }
  return join(directoryPath, 'main.log')
}


// 配置文件
const store = new Store()
console.log('store ', store.path)

const loginWidth = 320
const loginHeight = 320
const mainWidth = 950
const mainHeight = 700


function formatDate(date) {
  function padZero(num) {
    return num < 10 ? '0' + num : num;
  }

  const year = date.getFullYear();
  const month = padZero(date.getMonth() + 1); // getMonth() 返回的是从0开始的月份
  const day = padZero(date.getDate());
  const hours = padZero(date.getHours());
  const minutes = padZero(date.getMinutes());
  const seconds = padZero(date.getSeconds());
  const milliseconds = date.getMilliseconds().toString().padStart(3, '0'); // 确保毫秒有三位数

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;
}

function createWindow() {
  // Create the browser window.
  let webSecurity
  if (is.dev) {
    webSecurity = true
  } else {
    webSecurity = false
  }

  const _windows = {
    preview: null,
    log: null
  }


  log.transports.custom = (msg) => {
    if (_windows.log) {
      
      const s0 = log.transports.file.transforms[3](msg)
      const s1 = "[" + formatDate(msg.date) + "] " + `[${msg.level}]  ` + s0
      console.log('sn ...', msg.toString())
      _windows.log.webContents.send('log-append', s1, log.transports.file.resolvePathFn())
    }
  }

  const createOtherWindow = (name, create, after, openDevTools = false) => {
    let flag = false
    if (_windows[name] == null) {
      _windows[name] = create()
      flag = true
    }
    const previewWindow = _windows[name]

    if (is.dev) {
      if (flag) {
        previewWindow
          .loadURL(process.env['ELECTRON_RENDERER_URL'])
          .then(() => {
            previewWindow.show()
            after(previewWindow)
          })
          .catch((err) => {
            log.error('open fail', err)
          })
      } else {
        previewWindow.show()
        previewWindow.center()
        if (openDevTools) {
          previewWindow.openDevTools()
        }
        after(previewWindow)
      }
    } else {
      if (flag) {
        previewWindow
          .loadFile(join(__dirname, '../renderer/index.html'))
          .then(() => {
            previewWindow.show()
            if (openDevTools) {
              previewWindow.openDevTools()
            }
            after(previewWindow)
          })
          .catch((err) => {
            log.error('open fail', err)
          })
      } else {
        previewWindow.show()
        previewWindow.center()
        after(previewWindow)
      }
    }
  }

  const mainWindow = new BrowserWindow({
    icon: icon,
    width: loginWidth,
    height: loginHeight,
    show: false,
    autoHideMenuBar: true,
    title: '百舟打款助手',
    titleBarStyle: 'hidden',
    frame: false,
    transparent: true,
    closable: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: join(__dirname, '../preload/index.mjs'),
      sandbox: false,
      webSecurity: webSecurity
    }
  })


  if (is.dev) {
    mainWindow.webContents.openDevTools()
  }

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.on('closed', () => {
    console.log('main closed ');
    // if (_windows.log) {
    //   console.log('close log window',  _windows.log);
    //   _windows.log.close()
    //   _windows.log = null
    // }
    // if (_windows.preview) {
    //   _windows.preview.close()
    // }
    // console.log('quit ...');
    // app.quit()
  })

  mainWindow.on('hide', () => {
    console.log('main hide ');
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

    mainWindow.setResizable(true);
    console.log('Current size:', mainWindow.getSize());
    mainWindow.setSize(320, 320);
    mainWindow.center();
    console.log('New size after to-login:', mainWindow.getSize());
    // 设置窗口不可再次调整大小
    mainWindow.setResizable(false);
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
        }
        else if (data.closeType == 1) {
          win.hide()
        }
        else if (data.closeType == 2) {
          if (_windows.preview === null) {
            _windows.preview = win
          }
          win.setSkipTaskbar(true)
          win.hide()
        } else if (data.closeType == 3) {
          if (_windows.log === null) {
            _windows.log = win
          }
          win.setSkipTaskbar(true)
          win.hide()
        }
        break
      }
    }
  })

  // 截图事件
  const screenshots = new Screenshots()
  ipcMain.handle('btn-capture', (e) => {
    screenshots.startCapture()
  })

  // 绑定全局快捷键
  globalShortcut.register('ctrl+q', () => {
    screenshots.startCapture()
  })
  // 点击确定按钮回调事件
  screenshots.on('ok', (e, buffer, bounds) => {
    // const src = 'data:image/png;base64,' + btoa(String.fromCharCode(...new Uint8Array(buffer)))
    const src =
      'data:image/png;base64,' +
      btoa(new Uint8Array(buffer).reduce((data, btye) => data + String.fromCharCode(btye), ''))
    mainWindow.webContents.send('key-capture', src)
  })
  // 点击取消按钮回调事件
  screenshots.on('cancel', () => {
    screenshots.endCapture()
  })
  // 点击保存按钮回调事件
  screenshots.on('save', (e, buffer, bounds) => {
    // console.log("capture", buffer, bounds)
  })
  // esc取消
  globalShortcut.register('esc', () => {
    if (screenshots.$win?.isFocused()) {
      screenshots.endCapture()
    }
  })

  ipcMain.handle('set-config', (event, key, value) => {
    console.log('set ', key, value)
    if (value !== undefined) {
      store.set(key, value)
    }
  })

  ipcMain.handle('get-config', (event, key, defaultValue) => {
    const rs = store.get(key, defaultValue)
    console.log('get ', key, rs, defaultValue)
    return rs
  })

  ipcMain.handle('get-default', (event, key, defaultValue) => {
    const v = store.get('currentUserId', null)
    if (v === null || v === undefined) {
      return null
    }
    const field = `${v}.${key}`
    const rs = store.get(field, defaultValue)
    console.log('get default ===> ', key, v, defaultValue)
    return rs
  })

  ipcMain.handle('set-default', (event, key, value) => {
    const v = store.get('currentUserId', null)
    if (v === null || v === undefined) {
      return null
    }
    const field = `${v}.${key}`
    store.set(field, value)
    console.log('set default ===> ', key, v)
  })

  // 图片查看
  ipcMain.on('view-images', (event, urls, index) => {
    createOtherWindow('preview', () => {
      return new BrowserWindow({
        icon: icon,
        width: mainWidth,
        height: mainHeight,
        show: false,
        autoHideMenuBar: true,
        title: '图片查看',
        titleBarStyle: 'hidden',
        frame: false,
        transparent: true,
        closable: false,
        resizable: true,
        maximizable: true,
        minWidth: mainWidth,
        minHeight: mainHeight,
        alwaysOnTop: true,
        center: true,
        webPreferences: {
          nodeIntegration: true,
          contextIsolation: true,
          preload: join(__dirname, '../preload/index.mjs'),
          sandbox: false
        }
      })
    }, frame => {
      frame.webContents.send('preview-images', urls, index, Date.now())
    })
  })

  // 日志打开
  ipcMain.on('open-log', (event) => {
    createOtherWindow('log', () => {
      return new BrowserWindow({
        icon: icon,
        width: mainWidth,
        height: mainHeight,
        show: false,
        autoHideMenuBar: true,
        title: '日志',
        titleBarStyle: 'hidden',
        frame: false,
        transparent: true,
        closable: false,
        resizable: true,
        maximizable: true,
        minWidth: mainWidth,
        minHeight: mainHeight,
        alwaysOnTop: true,
        center: true,
        webPreferences: {
          nodeIntegration: true,
          contextIsolation: true,
          preload: join(__dirname, '../preload/index.mjs'),
          sandbox: false
        }
      })
    }, frame => {
      const filePath = log.transports.file.resolvePathFn()
      frame.webContents.send('log-result', '', filePath)
    }, true)
  })

  // excel保存
  ipcMain.on('export-excel', (event, data, defaultPath) => {
    dialog.showSaveDialog({
      title: '保存Excel文件',
      defaultPath,
      filters: [{ name: 'Excel files', extensions: ['xlsx'] }]
    }).then(result => {
      if (!result.canceled && result.filePath) {
        try {
          const wb = XLSX.utils.book_new();
          const ws = XLSX.utils.json_to_sheet(data);
          XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
          const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
          fs.writeFile(result.filePath, buffer, err => {
            if (err) {
              event.reply('export-excel-error', err.message)  // 发送错误消息
            } else {
              event.reply('export-excel-success')  // 发送成功消息
            }
          });
        } catch (error) {
          log.error("保存excel失败", err)
          event.reply('export-excel-error', error.message);  // 发送错误消息
        }
      } else {
        event.reply('export-excel-cancel')
      }
    }).catch(err => {
      log.error("保存excel失败", err)
    });
  });


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
}

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


// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
