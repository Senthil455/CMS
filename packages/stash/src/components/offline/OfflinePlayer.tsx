import React, { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Play, Pause, SkipBack, SkipForward, ChevronLeft, Timer, Moon } from 'lucide-react'
import { OfflineFile } from '@/types'

interface OfflinePlayerProps {
  file: OfflineFile | null
  fileUrl: string | null
  onClose: () => void
  onProgressUpdate: (id: string, progress: number) => void
}

const SLEEP_OPTIONS = [
  { label: '15 min', seconds: 15 * 60 },
  { label: '30 min', seconds: 30 * 60 },
  { label: '45 min', seconds: 45 * 60 },
  { label: '60 min', seconds: 60 * 60 },
]

const OfflinePlayer: React.FC<OfflinePlayerProps> = ({ file, fileUrl, onClose, onProgressUpdate }) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const lastSavedPctRef = useRef<number>(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  // Sleep timer state
  const [showSleepMenu, setShowSleepMenu] = useState(false)
  const [sleepRemaining, setSleepRemaining] = useState<number | null>(null) // seconds remaining
  const sleepIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (file) {
      lastSavedPctRef.current = file.playProgress
    }
  }, [file?.id])

  // Clear sleep timer when player closes
  useEffect(() => {
    if (!file) {
      clearSleepTimer()
    }
  }, [file])

  const clearSleepTimer = () => {
    if (sleepIntervalRef.current) {
      clearInterval(sleepIntervalRef.current)
      sleepIntervalRef.current = null
    }
    setSleepRemaining(null)
  }

  const startSleepTimer = (seconds: number) => {
    clearSleepTimer()
    setSleepRemaining(seconds)
    setShowSleepMenu(false)

    sleepIntervalRef.current = setInterval(() => {
      setSleepRemaining(prev => {
        if (prev === null || prev <= 1) {
          // Time's up — pause playback
          if (videoRef.current) {
            videoRef.current.pause()
            setIsPlaying(false)
          }
          clearInterval(sleepIntervalRef.current!)
          sleepIntervalRef.current = null
          return null
        }
        return prev - 1
      })
    }, 1000)
  }

  const cancelSleepTimer = () => {
    clearSleepTimer()
    setShowSleepMenu(false)
  }

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const time = videoRef.current.currentTime
      setCurrentTime(time)

      const pct = (time / videoRef.current.duration) * 100
      if (file && Math.abs(pct - lastSavedPctRef.current) > 0.5) {
        onProgressUpdate(file.id, pct)
        lastSavedPctRef.current = pct
      }
    }
  }

  const handleLoadedMetadata = () => {
    if (videoRef.current && file) {
      setDuration(videoRef.current.duration)
      const startTime = (file.playProgress / 100) * videoRef.current.duration
      if (!isNaN(startTime)) {
        videoRef.current.currentTime = startTime
      }
    }
  }

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause()
      else videoRef.current.play()
      setIsPlaying(!isPlaying)
    }
  }

  const formatSleepTime = (secs: number): string => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return m > 0 ? `${m}:${s.toString().padStart(2, '0')}` : `${s}s`
  }

  return (
    <AnimatePresence>
      {file && (
        <motion.div
          key="player-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200]"
          onClick={onClose}
        />
      )}
      {file && (
        <motion.div
          key="player-sheet"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed inset-x-0 bottom-0 bg-white rounded-t-2xl z-[210] p-6 pb-10 shadow-2xl flex flex-col gap-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="p-2 hover:bg-sage-light/30 rounded-xl text-sage-dark flex items-center gap-1 transition-colors group"
              >
                <ChevronLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
                <span className="text-sm font-bold">Return</span>
              </button>
              <div className="w-px h-6 bg-sage-light/30 mx-1" />
              <div>
                <h2 className="text-xl font-extrabold text-sage-dark truncate max-w-[200px]">
                  {file.title || file.filename}
                </h2>
                <p className="text-xs text-text-muted font-bold uppercase tracking-widest">{file.type}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-3 bg-sage-light/30 rounded-full text-sage-dark hover:bg-sage-light/50 transition-colors">
              <X size={24} />
            </button>
          </div>

          {/* Video area */}
          <div className="w-full aspect-video bg-black rounded-3xl overflow-hidden shadow-inner">
            {fileUrl && (
              <video
                ref={videoRef}
                src={fileUrl}
                className="w-full h-full object-contain"
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onClick={togglePlay}
                playsInline
              />
            )}
          </div>

          {/* Controls */}
          <div className="flex flex-col gap-4 px-4">
            {/* Progress Slider */}
            <div className="w-full h-2 bg-gray-100 rounded-full cursor-pointer relative">
              <div
                className="absolute inset-y-0 left-0 bg-sage-dark rounded-full"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              />
            </div>

            <div className="flex justify-between text-[0.65rem] font-bold text-text-muted">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>

            {/* Playback buttons */}
            <div className="flex justify-center items-center gap-8">
              <button className="text-sage-dark/80 hover:text-sage-dark hover:scale-110 transition-all">
                <SkipBack size={28} fill="currentColor" />
              </button>
              <button
                onClick={togglePlay}
                className="w-16 h-16 bg-sage-dark text-white rounded-full flex items-center justify-center shadow-lg shadow-sage-dark/30 active:scale-90 transition-transform"
              >
                {isPlaying ? <Pause size={32} fill="white" /> : <Play size={32} fill="white" className="ml-1" />}
              </button>
              <button className="text-sage-dark/80 hover:text-sage-dark hover:scale-110 transition-all">
                <SkipForward size={28} fill="currentColor" />
              </button>
            </div>

            {/* Sleep Timer Row */}
            <div className="flex items-center justify-center relative">
              <button
                onClick={() => setShowSleepMenu(v => !v)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                  sleepRemaining !== null
                    ? 'bg-sage-dark text-white'
                    : 'bg-sage-light/30 text-sage-dark hover:bg-sage-light/60'
                }`}
              >
                <Moon size={14} />
                {sleepRemaining !== null ? formatSleepTime(sleepRemaining) : 'Sleep Timer'}
              </button>

              {/* Sleep menu popover */}
              <AnimatePresence>
                {showSleepMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-white border border-sage-light/50 shadow-xl rounded-2xl p-3 z-10 flex flex-col gap-2 min-w-[160px]"
                  >
                    <p className="text-[0.65rem] font-extrabold uppercase tracking-widest text-text-muted px-1 flex items-center gap-1">
                      <Timer size={11} /> Sleep after
                    </p>
                    {SLEEP_OPTIONS.map(opt => (
                      <button
                        key={opt.seconds}
                        onClick={() => startSleepTimer(opt.seconds)}
                        className="text-sm font-bold text-sage-dark text-left px-3 py-2 rounded-xl hover:bg-sage-light/40 active:bg-sage-light/60 transition-colors"
                      >
                        {opt.label}
                      </button>
                    ))}
                    {sleepRemaining !== null && (
                      <>
                        <div className="w-full h-px bg-sage-light/40" />
                        <button
                          onClick={cancelSleepTimer}
                          className="text-sm font-bold text-red-500 text-left px-3 py-2 rounded-xl hover:bg-red-50 transition-colors"
                        >
                          Cancel timer
                        </button>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function formatTime(seconds: number): string {
  if (isNaN(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export default OfflinePlayer
