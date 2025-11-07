import { ipcMain, BrowserWindow } from 'electron'

export function registerWindowHandlers() {
  // Minimize window
  ipcMain.handle('window:minimize', (event) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    window?.minimize()
  })

  // Maximize/restore window
  ipcMain.handle('window:maximize', (event) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    if (window) {
      if (window.isMaximized()) {
        window.unmaximize()
      } else {
        window.maximize()
      }
    }
  })

  // Close window
  ipcMain.handle('window:close', (event) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    window?.close()
  })

  console.log('[IPC] Window handlers registered')
}
