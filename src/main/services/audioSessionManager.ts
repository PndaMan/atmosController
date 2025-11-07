import { BrowserWindow, app } from 'electron'
import { spawn } from 'child_process'
import path from 'path'

export interface AudioSession {
  id: string
  name: string
  volume: number
  isMuted: boolean
  appName: string
  pid?: number
  icon?: string
}

export class AudioSessionManager {
  private window: BrowserWindow | null = null
  private updateInterval: NodeJS.Timeout | null = null
  private sessions: Map<string, AudioSession> = new Map()
  private masterVolume: number = 80
  private scriptsPath: string

  constructor() {
    // Path to PowerShell scripts
    // In development: scripts are in project root
    // In production: scripts are in resources folder (extraResources)
    if (app.isPackaged) {
      this.scriptsPath = path.join(process.resourcesPath, 'scripts')
    } else {
      this.scriptsPath = path.join(__dirname, '../../scripts')
    }
    this.initialize()
  }

  private async initialize() {
    console.log('[AudioManager] Initializing PowerShell audio bridge...')
    console.log(`[AudioManager] Scripts path: ${this.scriptsPath}`)

    // Fetch initial master volume
    try {
      this.masterVolume = await this.fetchMasterVolume()
    } catch (error) {
      console.error('[AudioManager] Failed to get initial master volume:', error)
    }
  }

  setWindow(window: BrowserWindow) {
    this.window = window
  }

  /**
   * Execute a PowerShell script and return parsed JSON result
   */
  private async executePowerShell(scriptName: string, args: string[] = []): Promise<any> {
    return new Promise((resolve, reject) => {
      const scriptPath = path.join(this.scriptsPath, scriptName)
      const ps = spawn('powershell.exe', [
        '-ExecutionPolicy', 'Bypass',
        '-NoProfile',
        '-File', scriptPath,
        ...args
      ])

      let stdout = ''
      let stderr = ''

      ps.stdout.on('data', (data) => {
        stdout += data.toString()
      })

      ps.stderr.on('data', (data) => {
        stderr += data.toString()
      })

      ps.on('close', (code) => {
        if (code !== 0 && code !== null) {
          reject(new Error(`PowerShell script exited with code ${code}: ${stderr}`))
          return
        }

        try {
          const result = JSON.parse(stdout.trim())
          resolve(result)
        } catch (error) {
          reject(new Error(`Failed to parse PowerShell output: ${stdout}`))
        }
      })

      ps.on('error', (error) => {
        reject(new Error(`Failed to spawn PowerShell: ${error.message}`))
      })
    })
  }

  /**
   * Fetch all audio sessions from PowerShell using comprehensive WASAPI script
   */
  private async fetchAudioSessions(): Promise<AudioSession[]> {
    try {
      const result = await this.executePowerShell('AudioSessionControl.ps1', ['-Action', 'list'])

      if (Array.isArray(result)) {
        return result.map((session: any) => ({
          id: session.Id || session.Pid?.toString() || Math.random().toString(),
          name: session.Name || 'Unknown',
          volume: Math.round(session.Volume) || 100,
          isMuted: Boolean(session.IsMuted),
          appName: session.Name || 'Unknown',
          pid: session.Pid,
          icon: session.Icon
        }))
      }

      return []
    } catch (error) {
      console.error('[AudioManager] Failed to fetch audio sessions:', error)
      return []
    }
  }

  /**
   * Fetch master volume from PowerShell
   */
  private async fetchMasterVolume(): Promise<number> {
    try {
      const result = await this.executePowerShell('Get-MasterVolume.ps1')
      return result.volume || 50
    } catch (error) {
      console.error('[AudioManager] Failed to get master volume:', error)
      return 50
    }
  }

  startMonitoring() {
    // Send initial update immediately
    this.updateSessions()

    // Poll every 1 second for real-time updates
    this.updateInterval = setInterval(() => {
      this.updateSessions()
    }, 1000)
  }

  stopMonitoring() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval)
      this.updateInterval = null
    }
  }

  private async updateSessions() {
    try {
      const sessions = await this.fetchAudioSessions()

      // Update sessions map
      this.sessions.clear()
      sessions.forEach(session => {
        this.sessions.set(session.id, session)
      })

      this.sendSessionsToRenderer()
    } catch (error) {
      console.error('[AudioManager] Error updating sessions:', error)
    }
  }

  private sendSessionsToRenderer() {
    if (!this.window) return

    const sessionsArray = Array.from(this.sessions.values())
    this.window.webContents.send('audio-sessions-updated', sessionsArray)
  }

  getAllSessions(): AudioSession[] {
    return Array.from(this.sessions.values())
  }

  async setVolume(sessionId: string, volume: number): Promise<boolean> {
    const clampedVolume = Math.max(0, Math.min(100, volume))
    const session = this.sessions.get(sessionId)

    if (!session || !session.pid) {
      return false
    }

    try {
      const result = await this.executePowerShell('AudioSessionControl.ps1', [
        '-Action', 'setvolume',
        '-ProcessId', session.pid.toString(),
        '-Volume', clampedVolume.toString()
      ])

      if (result.success) {
        session.volume = clampedVolume
        this.sendSessionsToRenderer()
        console.log(`[AudioManager] Set volume for ${session.name} (PID ${session.pid}) to ${clampedVolume}%`)
        return true
      }

      return false
    } catch (error) {
      console.error(`[AudioManager] Failed to set volume:`, error)
      return false
    }
  }

  async setMute(sessionId: string, muted: boolean): Promise<boolean> {
    const session = this.sessions.get(sessionId)

    if (!session || !session.pid) {
      return false
    }

    try {
      const result = await this.executePowerShell('AudioSessionControl.ps1', [
        '-Action', 'setmute',
        '-ProcessId', session.pid.toString(),
        '-Mute', muted ? '1' : '0'
      ])

      if (result.success) {
        session.isMuted = muted
        this.sendSessionsToRenderer()
        console.log(`[AudioManager] ${muted ? 'Muted' : 'Unmuted'} ${session.name} (PID ${session.pid})`)
        return true
      }

      return false
    } catch (error) {
      console.error(`[AudioManager] Failed to set mute:`, error)
      return false
    }
  }

  getMasterVolume(): number {
    return this.masterVolume
  }

  async setMasterVolume(volume: number): Promise<boolean> {
    const clampedVolume = Math.max(0, Math.min(100, volume))

    try {
      const result = await this.executePowerShell('Set-MasterVolume.ps1', [
        '-Volume', clampedVolume.toString()
      ])

      if (result.success) {
        this.masterVolume = clampedVolume
        console.log(`[AudioManager] Set master volume to ${clampedVolume}%`)
        return true
      }

      return false
    } catch (error) {
      console.error(`[AudioManager] Failed to set master volume:`, error)
      return false
    }
  }

  cleanup() {
    this.stopMonitoring()
    console.log('[AudioManager] Cleanup complete')
  }
}

export const audioManager = new AudioSessionManager()
