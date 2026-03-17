import React, { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Play, Pause, SkipBack, SkipForward, Volume2, ChevronLeft } from 'lucide-react'
import { OfflineFile } from '@/types'

interface OfflinePlayerProps {
  file: OfflineFile | null
  fileUrl: string | null
  onClose: () => void
  onProgressUpdate: (id: string, progress: number) => void
}

const OfflinePlayer: React.FC<OfflinePlayerProps> = ({ file, fileUrl, onClose, onProgressUpdate }) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const lastSavedPctRef = useRef<number>(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  useEffect(() => {
    if (file) {
      lastSavedPctRef.current = file.playProgress
    }
  }, [file?.id])

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const time = videoRef.current.currentTime
      setCurrentTime(time)
      
      const pct = (time / videoRef.current.duration) * 100
      // Only save if progress has moved by at least 0.5%
      if (file && Math.abs(pct - lastSavedPctRef.current) > 0.5) {
        onProgressUpdate(file.id, pct)
        lastSavedPctRef.current = pct
      }
    }
  }

  const handleLoadedMetadata = () => {
    if (videoRef.current && file) {
      setDuration(videoRef.current.duration)
      // Resume from stored percentage
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

  return (
    <AnimatePresence>
      {file && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200]"
            onClick={onClose}
          />
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-x-0 bottom-0 bg-white rounded-t-2xl z-[210] p-6 pb-10 shadow-2xl flex flex-col gap-6"
          >
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

            <div className="flex flex-col gap-4 px-4">
              {/* Progress Slider */}
              <div className="w-full h-2 bg-gray-100 rounded-full cursor-pointer relative">
                <div 
                  className="absolute inset-y-0 left-0 bg-primary-color rounded-full" 
                  style={{ width: `${(currentTime / duration) * 100}%` }}
                />
              </div>
              
              <div className="flex justify-between text-[0.65rem] font-bold text-text-muted">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>

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
            </div>
          </motion.div>
        </>
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
