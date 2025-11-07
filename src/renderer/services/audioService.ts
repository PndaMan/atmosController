import { ipcRenderer } from 'electron'
import { AudioSession, useAudioStore } from '../stores/audioStore'

class AudioService {
  private initialized = false

  initialize() {
    if (this.initialized) return

    // Listen for audio session updates from main process
    ipcRenderer.on('audio-sessions-updated', (_event, sessions: AudioSession[]) => {
      useAudioStore.getState().setSessions(sessions)
    })

    // Request initial sessions
    this.getSessions()

    this.initialized = true
  }

  async getSessions(): Promise<AudioSession[]> {
    try {
      const sessions = await ipcRenderer.invoke('audio:get-sessions')
      useAudioStore.getState().setSessions(sessions)
      return sessions
    } catch (error) {
      console.error('Failed to get audio sessions:', error)
      return []
    }
  }

  async setVolume(sessionId: string, volume: number): Promise<boolean> {
    try {
      // Optimistically update UI
      useAudioStore.getState().setVolume(sessionId, volume)

      // Send to main process
      const result = await ipcRenderer.invoke('audio:set-volume', sessionId, volume)
      return result
    } catch (error) {
      console.error('Failed to set volume:', error)
      return false
    }
  }

  async setMute(sessionId: string, muted: boolean): Promise<boolean> {
    try {
      // Optimistically update UI
      useAudioStore.getState().setMute(sessionId, muted)

      // Send to main process
      const result = await ipcRenderer.invoke('audio:set-mute', sessionId, muted)
      return result
    } catch (error) {
      console.error('Failed to set mute:', error)
      return false
    }
  }

  async getMasterVolume(): Promise<number> {
    try {
      const volume = await ipcRenderer.invoke('audio:get-master-volume')
      useAudioStore.getState().setMasterVolume(volume)
      return volume
    } catch (error) {
      console.error('Failed to get master volume:', error)
      return 100
    }
  }

  async setMasterVolume(volume: number): Promise<boolean> {
    try {
      // Optimistically update UI
      useAudioStore.getState().setMasterVolume(volume)

      // Send to main process
      const result = await ipcRenderer.invoke('audio:set-master-volume', volume)
      return result
    } catch (error) {
      console.error('Failed to set master volume:', error)
      return false
    }
  }

  cleanup() {
    ipcRenderer.removeAllListeners('audio-sessions-updated')
    this.initialized = false
  }
}

export const audioService = new AudioService()
