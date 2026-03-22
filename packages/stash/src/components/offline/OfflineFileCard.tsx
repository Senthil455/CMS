import React, { useRef, useState, useEffect } from 'react'
import { File, Video, Music, Trash2, Play, Pause } from 'lucide-react'
import { OfflineFile } from '@/types'
import { formatSize } from '@/utils/assetUtils'


interface OfflineFileCardProps {
  file: OfflineFile
  onPlay: (file: OfflineFile) => void
  onDelete: (id: string) => void
  onProgressUpdate?: (id: string, progress: number) => void
  onGetBlob?: (id: string) => Blob | undefined
}

const OfflineFileCard: React.FC<OfflineFileCardProps> = ({ file, onPlay, onDelete, onProgressUpdate, onGetBlob }) => {
  const isVideo = file.type.startsWith('video/')
  const isAudio = file.type.startsWith('audio/') || file.filename.toLowerCase().endsWith('.m4b')

  // --- Inline audio state ---
  const audioRef = useRef<HTMLAudioElement>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const lastSavedPctRef = useRef<number>(file.playProgress || 0)
  const reSelectFileRef = useRef<HTMLInputElement>(null)
  const wantPlayRef = useRef(false)

  // Cleanup object URL on unmount
  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl)
    }
  }, [audioUrl])

  const getIcon = () => {
    if (isVideo) return <Video size={18} />
    if (isAudio) return <Music size={18} />
    return <File size={18} />
  }

  /**
   * Start playback from a Blob, all within the user-gesture call stack.
   * iOS Safari requires play() to be called synchronously from a tap handler.
   */
  const startFromBlob = (blob: Blob) => {
    const url = URL.createObjectURL(blob)
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    setAudioUrl(url)

    const audio = audioRef.current
    if (!audio) return

    audio.src = url
    audio.load()
    wantPlayRef.current = true
    // play() will be called from onCanPlayThrough to ensure iOS has buffered enough
    // But also try here — on some browsers this works directly
    audio.play().then(() => {
      setIsPlaying(true)
    }).catch(() => {
      // iOS may reject here — onCanPlayThrough will retry
      console.log('play() rejected, waiting for canplaythrough')
    })
    setIsPlaying(true)
  }

  // --- Audio handlers ---
  const handleAudioPlay = async () => {
    // If audio is already loaded, just toggle play/pause
    if (audioUrl && audioRef.current && audioRef.current.src) {
      togglePlay()
      return
    }

    // 1. Desktop: Use File System Access API
    if (file.fileHandle) {
      try {
        const status = await file.fileHandle.queryPermission({ mode: 'read' })
        if (status !== 'granted') {
          await file.fileHandle.requestPermission({ mode: 'read' })
        }
        const blob = await file.fileHandle.getFile()
        startFromBlob(blob)
      } catch (e) {
        console.error('Could not access file handle', e)
        alert('Need to re-select the file to access it again.')
      }
      return
    }

    // 2. iOS/Mobile: Blob in transient memory from this session
    const transientBlob = onGetBlob?.(file.id)
    if (transientBlob) {
      startFromBlob(transientBlob)
      return
    }

    // 3. No blob — prompt re-pick (next session on iOS)
    reSelectFileRef.current?.click()
  }

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
        setIsPlaying(false)
        wantPlayRef.current = false
      } else {
        audioRef.current.play().catch(console.error)
        setIsPlaying(true)
        wantPlayRef.current = true
      }
    }
  }

  const handleReSelectChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0]
    if (picked) {
      startFromBlob(picked)
    }
    e.target.value = ''
  }

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      const dur = audioRef.current.duration
      setDuration(dur)
      // Seek to stored progress
      const startTime = (file.playProgress / 100) * dur
      if (!isNaN(startTime) && startTime > 0) {
        try {
          audioRef.current.currentTime = startTime
        } catch {
          // will retry in canplaythrough
        }
      }
    }
  }

  // iOS: large blob URLs may not be seekable until enough is buffered.
  // canplay fires once the browser can begin playback (much sooner than canplaythrough).
  const handleCanPlay = () => {
    const audio = audioRef.current
    if (!audio) return

    // Retry seek if needed
    const startTime = (file.playProgress / 100) * audio.duration
    if (!isNaN(startTime) && startTime > 0 && audio.currentTime < 1) {
      try {
        audio.currentTime = startTime
      } catch (e) {
        console.warn('Seek failed on canplay', e)
      }
    }

    // Retry play if we intended to play
    if (wantPlayRef.current && audio.paused) {
      audio.play().then(() => {
        setIsPlaying(true)
      }).catch(console.error)
    }
  }

  const handleTimeUpdate = () => {
    if (!audioRef.current) return
    const time = audioRef.current.currentTime
    setCurrentTime(time)
    const pct = (time / audioRef.current.duration) * 100
    if (onProgressUpdate && file && Math.abs(pct - lastSavedPctRef.current) > 0.5) {
      onProgressUpdate(file.id, pct)
      lastSavedPctRef.current = pct
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value)
    if (audioRef.current) {
      audioRef.current.currentTime = time
      setCurrentTime(time)
    }
  }

  const formatTime = (s: number) => {
    if (isNaN(s)) return '0:00'
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const playbackProgress = duration > 0 ? (currentTime / duration) * 100 : file.playProgress || 0

  return (
    <div className="bg-glass backdrop-blur-zen border border-glass-border rounded-2xl p-4 shadow-sm hover:shadow-md transition-all group">
      {/* Audio element — always rendered so we can set src imperatively from tap handler */}
      {isAudio && (
        <audio
          ref={audioRef}
          preload="auto"
          onLoadedMetadata={handleLoadedMetadata}
          onCanPlay={handleCanPlay}
          onCanPlayThrough={handleCanPlay}
          onTimeUpdate={handleTimeUpdate}
          onEnded={() => { setIsPlaying(false); wantPlayRef.current = false }}
        />
      )}

      {/* Re-pick input for iOS */}
      <input
        type="file"
        ref={reSelectFileRef}
        className="hidden"
        onChange={handleReSelectChange}
      />

      <div className="flex items-center gap-3">
        {/* Icon */}
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${isAudio && isPlaying ? 'bg-sage-dark text-white' : 'bg-sage-light/30 text-sage-dark'}`}>
          {getIcon()}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-[0.9rem] font-bold text-sage-dark truncate leading-tight mb-0.5">
            {file.title || file.filename}
          </h3>
          <p className="text-[0.65rem] text-text-muted font-medium truncate mb-2">
            {file.filename} • {formatSize(file.size)}
          </p>

          {/* Progress bar — shows inline audio progress when playing, stored progress otherwise */}
          <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-sage-dark transition-all duration-300"
              style={{ width: `${Math.min(playbackProgress, 100)}%` }}
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col items-center gap-2 shrink-0">
          {isAudio ? (
            <button
              onClick={handleAudioPlay}
              className="w-9 h-9 bg-sage-dark text-white rounded-full flex items-center justify-center shadow-md shadow-sage-dark/20 active:scale-90 transition-transform"
            >
              {isPlaying
                ? <Pause size={16} fill="white" />
                : <Play size={16} fill="white" className="ml-0.5" />
              }
            </button>
          ) : (
            <button
              onClick={() => onPlay(file)}
              className="w-9 h-9 bg-sage-dark text-white rounded-full flex items-center justify-center shadow-md shadow-sage-dark/20 active:scale-90 transition-transform"
            >
              <Play size={16} fill="white" className="ml-0.5" />
            </button>
          )}
          <button
            onClick={() => onDelete(file.id)}
            className="w-9 h-9 text-red-400 hover:text-red-500 hover:bg-red-50 rounded-full flex items-center justify-center transition-colors"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* Inline audio seek bar — only shown when audio is loaded */}
      {isAudio && audioUrl && (
        <div className="mt-3 mb-1 px-1 flex items-center gap-3">
          <span className="text-[0.6rem] font-bold text-text-muted w-8 text-right shrink-0">{formatTime(currentTime)}</span>
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.5}
            value={currentTime}
            onChange={handleSeek}
            className="flex-1 h-1 accent-sage-dark cursor-pointer"
          />
          <span className="text-[0.6rem] font-bold text-text-muted w-8 shrink-0">{formatTime(duration)}</span>
        </div>
      )}
    </div>
  )
}

export default OfflineFileCard
