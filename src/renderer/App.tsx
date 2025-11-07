import { motion } from 'framer-motion'
import { VolumeMixer } from './components/VolumeMixer'
import { AudioVisualizer } from './components/AudioVisualizer'
import { windowService } from './services/windowService'

function App() {
  return (
    <div className="w-screen h-screen flex items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="relative"
      >
        {/* Main glass window with animated glow */}
        <div className="glass-window glow-border rounded-lg p-6 min-w-[420px] max-w-[500px]">
          {/* Audio Visualizer with header */}
          <div className="mb-4">
            <AudioVisualizer />
          </div>

          {/* Volume Mixer */}
          <div className="no-drag-region">
            <VolumeMixer />
          </div>

          {/* Window Control Dock */}
          <div className="glass rounded-md px-3 py-2 mt-4 no-drag-region flex items-center justify-between">
            <kbd className="px-2 py-0.5 bg-white/5 rounded text-[10px] text-white/40 border border-white/10 font-mono">
              Alt+Shift+D
            </kbd>
            <div className="flex items-center gap-2">
              <button
                onClick={() => windowService.minimize()}
                className="w-7 h-7 rounded bg-white/5 hover:bg-white/10
                          transition-all duration-200 flex items-center justify-center
                          text-white/60 hover:text-white/90 text-sm border border-white/5"
                title="Minimize"
              >
                −
              </button>
              <button
                onClick={() => windowService.maximize()}
                className="w-7 h-7 rounded bg-white/5 hover:bg-white/10
                          transition-all duration-200 flex items-center justify-center
                          text-white/60 hover:text-white/90 text-xs border border-white/5"
                title="Maximize"
              >
                ☐
              </button>
              <button
                onClick={() => windowService.close()}
                className="w-7 h-7 rounded bg-red-500/20 hover:bg-red-500/30
                          transition-all duration-200 flex items-center justify-center
                          text-red-400 hover:text-red-300 text-sm border border-red-500/30"
                title="Close"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default App
