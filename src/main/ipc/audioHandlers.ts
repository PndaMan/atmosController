import { ipcMain } from 'electron'
import { audioManager } from '../services/audioSessionManager'

export function registerAudioHandlers() {
  // Get all audio sessions
  ipcMain.handle('audio:get-sessions', () => {
    return audioManager.getAllSessions()
  })

  // Set volume for specific session
  ipcMain.handle('audio:set-volume', (_event, sessionId: string, volume: number) => {
    return audioManager.setVolume(sessionId, volume)
  })

  // Set mute for specific session
  ipcMain.handle('audio:set-mute', (_event, sessionId: string, muted: boolean) => {
    return audioManager.setMute(sessionId, muted)
  })

  // Get master volume
  ipcMain.handle('audio:get-master-volume', () => {
    return audioManager.getMasterVolume()
  })

  // Set master volume
  ipcMain.handle('audio:set-master-volume', (_event, volume: number) => {
    return audioManager.setMasterVolume(volume)
  })

  console.log('[IPC] Audio handlers registered')
}
