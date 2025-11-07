import { useEffect, useRef, useState } from 'react'
import { useAudioStore } from '../stores/audioStore'

export function AudioVisualizer() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isActive, setIsActive] = useState(true)
  const animationFrameRef = useRef<number>()
  const { sessions } = useAudioStore()
  const barsRef = useRef<number[]>(Array(32).fill(0))
  const targetBarsRef = useRef<number[]>(Array(32).fill(0))
  const timeRef = useRef(0)

  useEffect(() => {
    if (isActive) {
      visualize()
    } else {
      // Clear canvas when visualizer is turned off
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d')
        if (ctx) {
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
        }
      }
      // Reset bar values to zero
      barsRef.current = Array(32).fill(0)
      targetBarsRef.current = Array(32).fill(0)
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isActive, sessions])

  const visualize = () => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const draw = () => {
      if (!isActive) return
      animationFrameRef.current = requestAnimationFrame(draw)

      timeRef.current += 0.1 // Faster animation

      // Clear with transparency
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const barCount = 32
      const barWidth = canvas.width / barCount
      const barGap = 2

      // Calculate overall audio activity
      const activeSessionCount = sessions.filter(s => !s.isMuted).length
      const totalVolume = sessions.reduce((sum, s) => sum + (s.isMuted ? 0 : s.volume), 0)
      const avgVolume = activeSessionCount > 0 ? totalVolume / (activeSessionCount * 100) : 0.3 // Default to 0.3 for visible animation

      // Generate smooth animated bars
      for (let i = 0; i < barCount; i++) {
        const freq = i / barCount

        // Create frequency-like distribution
        const bassWeight = Math.max(0, 1 - freq * 2.5) // Strong in low frequencies
        const midWeight = Math.exp(-Math.pow((freq - 0.4) * 3, 2)) * 1.2 // Peak in mids
        const trebleWeight = Math.max(0, (freq - 0.5) * 1.5) * 0.8 // Present in highs

        // Animated wave patterns (faster and more varied)
        const wave1 = Math.sin(timeRef.current * 4 + i * 0.5) * 0.3 + 0.7
        const wave2 = Math.sin(timeRef.current * 3 - i * 0.4) * 0.25 + 0.75
        const wave3 = Math.sin(timeRef.current * 5 + i * 0.6) * 0.2 + 0.8

        // Combine weights and waves
        const baseValue = (bassWeight + midWeight + trebleWeight) * avgVolume
        const animatedValue = baseValue * wave1 * wave2 * wave3

        // Update target with some randomness for liveliness
        targetBarsRef.current[i] = animatedValue + (Math.random() * 0.08 - 0.04) * avgVolume

        // Smooth interpolation (faster response)
        const smoothing = 0.25
        barsRef.current[i] += (targetBarsRef.current[i] - barsRef.current[i]) * smoothing

        const normalizedValue = Math.min(Math.max(barsRef.current[i], 0), 1)

        // Calculate bar height
        const minHeight = 6
        const maxHeight = canvas.height - 8
        const barHeight = minHeight + (normalizedValue * maxHeight)

        // Calculate x position
        const x = i * barWidth

        // Create gradient for bar
        const gradient = ctx.createLinearGradient(0, canvas.height - barHeight, 0, canvas.height)
        const opacity = 0.5 + normalizedValue * 0.5
        gradient.addColorStop(0, `rgba(139, 92, 246, ${opacity})`)
        gradient.addColorStop(0.5, `rgba(167, 139, 250, ${opacity * 0.9})`)
        gradient.addColorStop(1, `rgba(196, 181, 253, ${opacity * 0.7})`)

        // Draw bar
        ctx.fillStyle = gradient
        ctx.fillRect(
          x + barGap / 2,
          canvas.height - barHeight,
          barWidth - barGap,
          barHeight
        )

        // Add glow effect
        if (normalizedValue > 0.3) {
          ctx.shadowBlur = 8 + normalizedValue * 12
          ctx.shadowColor = 'rgba(167, 139, 250, 0.6)'
        } else {
          ctx.shadowBlur = 0
        }
      }
    }

    draw()
  }

  const toggleVisualizer = () => {
    setIsActive(!isActive)
  }

  return (
    <div className="glass rounded-md p-4 border border-white/5">
      <div className="flex items-center justify-between mb-3">
        <h1 className="drag-region text-lg font-medium text-white/90 tracking-wider flex-1 cursor-move">
          atmosController
        </h1>
        <button
          onClick={toggleVisualizer}
          className={`no-drag-region px-2 py-1 rounded text-[10px] font-medium transition-all duration-200 border
                    ${isActive
                      ? 'bg-violet-500/20 border-violet-500/40 text-violet-400 hover:bg-violet-500/30'
                      : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'}`}
        >
          {isActive ? 'ON' : 'OFF'}
        </button>
      </div>

      <div className="relative w-full h-24 bg-black/20 rounded overflow-hidden">
        <canvas
          ref={canvasRef}
          width={800}
          height={192}
          className="w-full h-full"
          style={{ imageRendering: 'crisp-edges' }}
        />

        {!isActive && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[10px] text-white/20 font-light tracking-wider">
              PAUSED
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
