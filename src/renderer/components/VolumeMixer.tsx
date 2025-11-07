import { useEffect, useRef, useState, useCallback, memo } from 'react'
import { useAudioStore } from '../stores/audioStore'
import { audioService } from '../services/audioService'
import { motion, AnimatePresence } from 'framer-motion'

interface AudioSession {
  id: string
  name: string
  volume: number
  isMuted: boolean
  appName: string
  pid?: number
  icon?: string
}

const SessionControl = memo(function SessionControl({
  session,
  volume,
  isMuted,
  onVolumeChange,
  onMuteToggle
}: {
  session: AudioSession
  volume: number
  isMuted: boolean
  onVolumeChange: (sessionId: string, e: React.FormEvent<HTMLInputElement>) => void
  onMuteToggle: (sessionId: string, currentMuted: boolean) => void
}) {
  return (
    <motion.div
      key={session.id}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="glass-dark rounded-md p-3 border border-white/5 hover:border-white/10 transition-all duration-150"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {session.icon ? (
            <img
              src={`data:image/png;base64,${session.icon}`}
              alt={session.name}
              className="w-4 h-4 flex-shrink-0"
            />
          ) : (
            <div className="w-4 h-4 rounded bg-white/10 flex-shrink-0 flex items-center justify-center">
              <span className="text-[8px] text-white/40">♪</span>
            </div>
          )}
          <span className="text-xs text-white/60 font-light truncate">
            {session.name}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-white/40 font-mono">
            {volume}%
          </span>
          <button
            onClick={() => onMuteToggle(session.id, isMuted)}
            className={`w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold
                      transition-all duration-150 border
                      ${
                        isMuted
                          ? 'bg-red-500/20 border-red-500/40 text-red-400'
                          : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'
                      }`}
          >
            {isMuted ? 'M' : 'S'}
          </button>
        </div>
      </div>
      <input
        type="range"
        min="0"
        max="100"
        value={volume}
        onChange={(e) => onVolumeChange(session.id, e)}
        onInput={(e) => onVolumeChange(session.id, e)}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        draggable={false}
        disabled={isMuted}
        className="w-full h-0.5 bg-white/10 rounded-full appearance-none cursor-pointer will-change-auto
                 disabled:opacity-30 disabled:cursor-not-allowed
                 [&::-webkit-slider-thumb]:appearance-none
                 [&::-webkit-slider-thumb]:w-2.5
                 [&::-webkit-slider-thumb]:h-2.5
                 [&::-webkit-slider-thumb]:rounded-full
                 [&::-webkit-slider-thumb]:bg-white/60
                 [&::-webkit-slider-thumb]:hover:bg-white/90
                 [&::-webkit-slider-thumb]:transition-colors
                 [&::-webkit-slider-thumb]:cursor-grab
                 [&::-webkit-slider-thumb]:active:cursor-grabbing
                 disabled:[&::-webkit-slider-thumb]:cursor-not-allowed"
      />
    </motion.div>
  )
})

const MasterVolumeControl = memo(function MasterVolumeControl({
  storeMasterVolume
}: {
  storeMasterVolume: number
}) {
  const [localMasterVolume, setLocalMasterVolume] = useState(storeMasterVolume)
  const [isDraggingMaster, setIsDraggingMaster] = useState(false)

  const masterVolumeTimeout = useRef<NodeJS.Timeout | null>(null)
  const masterVolumeThrottle = useRef<NodeJS.Timeout | null>(null)
  const lastMasterVolumeSent = useRef<number>(storeMasterVolume)

  useEffect(() => {
    return () => {
      if (masterVolumeTimeout.current) clearTimeout(masterVolumeTimeout.current)
      if (masterVolumeThrottle.current) clearTimeout(masterVolumeThrottle.current)
    }
  }, [])

  useEffect(() => {
    if (!isDraggingMaster) {
      setLocalMasterVolume(storeMasterVolume)
    }
  }, [storeMasterVolume, isDraggingMaster])

  const handleMasterVolumeChange = useCallback((e: React.FormEvent<HTMLInputElement>) => {
    const value = parseInt((e.target as HTMLInputElement).value)

    setLocalMasterVolume(value)
    setIsDraggingMaster(true)

    if (!masterVolumeThrottle.current) {
      masterVolumeThrottle.current = setTimeout(() => {
        if (lastMasterVolumeSent.current !== value) {
          audioService.setMasterVolume(value)
          lastMasterVolumeSent.current = value
        }
        masterVolumeThrottle.current = null
      }, 100)
    }

    if (masterVolumeTimeout.current) {
      clearTimeout(masterVolumeTimeout.current)
    }

    masterVolumeTimeout.current = setTimeout(() => {
      if (lastMasterVolumeSent.current !== value) {
        audioService.setMasterVolume(value)
        lastMasterVolumeSent.current = value
      }
      setIsDraggingMaster(false)
    }, 30)
  }, [])

  return (
    <div className="glass rounded-md p-4 border border-white/5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] text-white/40 font-light tracking-wider">MASTER</span>
        <span className="text-xs text-white/60 font-mono">{localMasterVolume}%</span>
      </div>
      <input
        type="range"
        min="0"
        max="100"
        value={localMasterVolume}
        onChange={handleMasterVolumeChange}
        onInput={handleMasterVolumeChange}
        onMouseDown={(e) => {
          e.stopPropagation()
          setIsDraggingMaster(true)
        }}
        onMouseUp={() => setIsDraggingMaster(false)}
        onTouchStart={(e) => {
          e.stopPropagation()
          setIsDraggingMaster(true)
        }}
        onTouchEnd={() => setIsDraggingMaster(false)}
        draggable={false}
        className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer will-change-auto
                   [&::-webkit-slider-thumb]:appearance-none
                   [&::-webkit-slider-thumb]:w-3
                   [&::-webkit-slider-thumb]:h-3
                   [&::-webkit-slider-thumb]:rounded-full
                   [&::-webkit-slider-thumb]:bg-white/80
                   [&::-webkit-slider-thumb]:hover:bg-white
                   [&::-webkit-slider-thumb]:transition-colors
                   [&::-webkit-slider-thumb]:cursor-grab
                   [&::-webkit-slider-thumb]:active:cursor-grabbing"
      />
    </div>
  )
})

export function VolumeMixer() {
  const { sessions, masterVolume: storeMasterVolume } = useAudioStore()
  const [localSessionVolumes, setLocalSessionVolumes] = useState<Record<string, number>>({})
  const [localMutedSessions, setLocalMutedSessions] = useState<Record<string, boolean>>({})

  const sessionVolumeTimeouts = useRef<Record<string, NodeJS.Timeout>>({})
  const sessionVolumeThrottles = useRef<Record<string, NodeJS.Timeout>>({})
  const lastSessionVolumesSent = useRef<Record<string, number>>({})

  useEffect(() => {
    // Initialize audio service
    audioService.initialize()

    return () => {
      audioService.cleanup()
      Object.values(sessionVolumeTimeouts.current).forEach(clearTimeout)
      Object.values(sessionVolumeThrottles.current).forEach(clearTimeout)
    }
  }, [])

  const handleVolumeChange = useCallback((sessionId: string, e: React.FormEvent<HTMLInputElement>) => {
    const value = parseInt((e.target as HTMLInputElement).value)

    // Update local state immediately for responsive UI
    setLocalSessionVolumes(prev => ({ ...prev, [sessionId]: value }))

    // Throttle: send updates every 100ms during drag
    if (!sessionVolumeThrottles.current[sessionId]) {
      sessionVolumeThrottles.current[sessionId] = setTimeout(() => {
        if (lastSessionVolumesSent.current[sessionId] !== value) {
          audioService.setVolume(sessionId, value)
          lastSessionVolumesSent.current[sessionId] = value
        }
        delete sessionVolumeThrottles.current[sessionId]
      }, 100)
    }

    // Clear existing debounce timeout
    if (sessionVolumeTimeouts.current[sessionId]) {
      clearTimeout(sessionVolumeTimeouts.current[sessionId])
    }

    // Debounce: final update 30ms after last change
    sessionVolumeTimeouts.current[sessionId] = setTimeout(() => {
      if (lastSessionVolumesSent.current[sessionId] !== value) {
        audioService.setVolume(sessionId, value)
        lastSessionVolumesSent.current[sessionId] = value
      }
    }, 30)
  }, [])

  const handleMuteToggle = useCallback((sessionId: string, currentMuted: boolean) => {
    // Update local state immediately for responsive UI
    const newMutedState = !currentMuted
    setLocalMutedSessions(prev => ({ ...prev, [sessionId]: newMutedState }))

    // Send to backend
    audioService.setMute(sessionId, newMutedState)
  }, [])

  const getSessionVolume = useCallback((session: { id: string; volume: number }) => {
    return localSessionVolumes[session.id] ?? session.volume
  }, [localSessionVolumes])

  const getSessionMuted = useCallback((session: { id: string; isMuted: boolean }) => {
    return localMutedSessions[session.id] ?? session.isMuted
  }, [localMutedSessions])

  return (
    <div className="space-y-4">
      {/* Master Volume */}
      <MasterVolumeControl storeMasterVolume={storeMasterVolume} />

      {/* Session List */}
      <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
        <AnimatePresence>
          {sessions.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="glass-dark rounded-md p-4 text-center border border-white/5"
            >
              <div className="text-[10px] text-white/30 font-light tracking-wider">
                NO ACTIVE AUDIO
              </div>
            </motion.div>
          ) : (
            sessions.map((session) => (
              <SessionControl
                key={session.id}
                session={session}
                volume={getSessionVolume(session)}
                isMuted={getSessionMuted(session)}
                onVolumeChange={handleVolumeChange}
                onMuteToggle={handleMuteToggle}
              />
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
