import { useEffect } from 'react'
import { useAudioStore } from '../stores/audioStore'
import { audioService } from '../services/audioService'
import { motion, AnimatePresence } from 'framer-motion'

export function VolumeMixer() {
  const { sessions, masterVolume } = useAudioStore()

  useEffect(() => {
    // Initialize audio service
    audioService.initialize()

    return () => {
      audioService.cleanup()
    }
  }, [])

  const handleVolumeChange = (sessionId: string, value: number) => {
    audioService.setVolume(sessionId, value)
  }

  const handleMuteToggle = (sessionId: string, currentMuted: boolean) => {
    audioService.setMute(sessionId, !currentMuted)
  }

  const handleMasterVolumeChange = (value: number) => {
    audioService.setMasterVolume(value)
  }

  return (
    <div className="space-y-4">
      {/* Master Volume */}
      <div className="glass rounded-md p-4 border border-white/5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] text-white/40 font-light tracking-wider">MASTER</span>
          <span className="text-xs text-white/60 font-mono">{masterVolume}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={masterVolume}
          onInput={(e) => handleMasterVolumeChange(parseInt((e.target as HTMLInputElement).value))}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          draggable={false}
          className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer
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

      {/* Session List */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 scrollbar-thin">
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
                    <span className="text-xs text-white/60 font-light truncate">
                      {session.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-white/40 font-mono">
                      {session.volume}%
                    </span>
                    <button
                      onClick={() => handleMuteToggle(session.id, session.isMuted)}
                      className={`w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold
                                transition-all duration-150 border
                                ${
                                  session.isMuted
                                    ? 'bg-red-500/20 border-red-500/40 text-red-400'
                                    : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'
                                }`}
                    >
                      {session.isMuted ? 'M' : 'S'}
                    </button>
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={session.volume}
                  onInput={(e) => handleVolumeChange(session.id, parseInt((e.target as HTMLInputElement).value))}
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  draggable={false}
                  disabled={session.isMuted}
                  className="w-full h-0.5 bg-white/10 rounded-full appearance-none cursor-pointer
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
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
