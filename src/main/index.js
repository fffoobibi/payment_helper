import { app, shell, BrowserWindow, Tray, Menu } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import trayIcon from '../../resources/favicon.ico?asset'
import { onLogin, onWindow } from './ipc'
import db from './db'

const NODE_ENV = process.env.NODE_ENV

const loginWidth = 320
const loginHeight = 320
const mainWidth = 900
const mainHeight = 670

function createWindow() {
  // Create the browser window.
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
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: false,
      sandbox: false
    }
  })

  if (NODE_ENV === 'development') {
    // mainWindow.webContents.openDevTools()
  }

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
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
  const contextMenu = [
    { label: '退出', click: () => app.quit() },
  ]
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
  // 登录
  onLogin((data) => {
    mainWindow.setResizable(true)
    mainWindow.setSize(mainWidth, mainHeight)
    mainWindow.center() // 窗口居中
    mainWindow.setMaximizable(true) // 窗口可放大
    mainWindow.setMinimumSize(mainWidth, mainHeight)  // 窗口最小尺寸为默认尺寸

    // TODO: 添加托盘操作
    contextMenu.unshift({ label: data.username, click: () => { } })
  })

  onWindow((e, { action, data }) => {
    const webContents = e.sender
    const win = BrowserWindow.fromWebContents(webContents)
    switch (action) {
      case 'minimize': win.minimize(); break;
      case 'maximize': win.maximize(); break;
      case 'unmaximize': win.unmaximize(); break;
      case 'pin': win.setAlwaysOnTop(data.isPin); break;
      case 'close': {
        if (data.closeType == 0) {
          win.close()
        } else {
          win.setSkipTaskbar(true)
          win.hide()
        }
        break
      }
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
