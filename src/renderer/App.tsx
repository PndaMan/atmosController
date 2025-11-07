import { useState } from 'react'
import { motion } from 'framer-motion'

function App() {
  const [isMinimized, setIsMinimized] = useState(false)

  return (
    <div className="w-screen h-screen flex items-center justify-center p-8">
      {/* Main container with semi-transparent background */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative"
      >
        {/* Glass morphism window */}
        <div className="glass-window rounded-2xl p-8 min-w-[600px] min-h-[400px]">
          {/* Header bar (draggable) */}
          <div className="drag-region mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">
              Ethereal Mixer
            </h1>
            <div className="no-drag-region flex gap-2">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20
                          transition-colors flex items-center justify-center
                          text-white text-sm"
              >
                _
              </button>
              <button
                onClick={() => window.close()}
                className="w-8 h-8 rounded-full bg-red-500/30 hover:bg-red-500/50
                          transition-colors flex items-center justify-center
                          text-white text-sm"
              >
                ×
              </button>
            </div>
          </div>

          {/* Content area */}
          <div className="space-y-6">
            {/* Welcome message */}
            <div className="glass rounded-xl p-6 no-drag-region">
              <h2 className="text-xl font-semibold text-white mb-2">
                Welcome to Ethereal Mixer!
              </h2>
              <p className="text-gray-300 text-sm">
                Your lightweight, transparent audio control overlay is now running.
              </p>
            </div>

            {/* Feature preview boxes */}
            <div className="grid grid-cols-3 gap-4 no-drag-region">
              <div className="glass-dark rounded-lg p-4 hover:bg-white/10 transition-colors cursor-pointer">
                <div className="text-3xl mb-2">🎚️</div>
                <div className="text-white font-medium text-sm">Volume Mixer</div>
                <div className="text-gray-400 text-xs mt-1">Coming soon</div>
              </div>

              <div className="glass-dark rounded-lg p-4 hover:bg-white/10 transition-colors cursor-pointer">
                <div className="text-3xl mb-2">📊</div>
                <div className="text-white font-medium text-sm">Visualizer</div>
                <div className="text-gray-400 text-xs mt-1">Coming soon</div>
              </div>

              <div className="glass-dark rounded-lg p-4 hover:bg-white/10 transition-colors cursor-pointer">
                <div className="text-3xl mb-2">⚙️</div>
                <div className="text-white font-medium text-sm">Settings</div>
                <div className="text-gray-400 text-xs mt-1">Coming soon</div>
              </div>
            </div>

            {/* Info section */}
            <div className="glass rounded-xl p-4 no-drag-region">
              <div className="text-xs text-gray-300 space-y-1">
                <div className="flex justify-between">
                  <span>Press <kbd className="px-2 py-1 bg-white/10 rounded">Ctrl+Shift+M</kbd> to toggle visibility</span>
                </div>
                <div className="text-gray-400 mt-2">
                  Phase 1: Foundation - Setup Complete ✓
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default App
