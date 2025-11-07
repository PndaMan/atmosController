import { ipcRenderer } from 'electron'

class WindowService {
  minimize() {
    ipcRenderer.invoke('window:minimize')
  }

  maximize() {
    ipcRenderer.invoke('window:maximize')
  }

  close() {
    ipcRenderer.invoke('window:close')
  }
}

export const windowService = new WindowService()
