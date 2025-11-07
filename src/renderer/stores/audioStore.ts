import { create } from 'zustand'

export interface AudioSession {
  id: string
  name: string
  volume: number
  isMuted: boolean
  appName: string
  pid?: number
}

interface AudioState {
  sessions: AudioSession[]
  masterVolume: number
  setSessions: (sessions: AudioSession[]) => void
  setVolume: (sessionId: string, volume: number) => void
  setMute: (sessionId: string, muted: boolean) => void
  setMasterVolume: (volume: number) => void
}

export const useAudioStore = create<AudioState>((set) => ({
  sessions: [],
  masterVolume: 100,

  setSessions: (sessions) => set({ sessions }),

  setVolume: (sessionId, volume) =>
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === sessionId ? { ...s, volume } : s
      )
    })),

  setMute: (sessionId, muted) =>
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === sessionId ? { ...s, isMuted: muted } : s
      )
    })),

  setMasterVolume: (volume) => set({ masterVolume: volume })
}))
