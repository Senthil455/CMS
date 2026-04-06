import React, { useState, useRef, useEffect } from 'react'
import ReactDOM from 'react-dom'
import { X, Pencil, Check, Music, Video, File as FileIcon } from 'lucide-react'
import { OfflineFile } from '@/types'
import { formatSize } from '@/utils/assetUtils'

interface OfflineDetailSheetProps {
  file: OfflineFile
  isOpen: boolean
  onClose: () => void
  onUpdateFile: (id: string, updates: Partial<Pick<OfflineFile, 'title' | 'description'>>) => void
}

const OfflineDetailSheet: React.FC<OfflineDetailSheetProps> = ({ file, isOpen, onClose, onUpdateFile }) => {
  // --- Inline-edit: Title ---
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState(file.title || file.filename)
  const titleInputRef = useRef<HTMLInputElement>(null)

  // --- Inline-edit: Description ---
  const [editingDesc, setEditingDesc] = useState(false)
  const [descDraft, setDescDraft] = useState(file.description || '')
  const descTextareaRef = useRef<HTMLTextAreaElement>(null)

  // Sync drafts when file changes
  useEffect(() => {
    setTitleDraft(file.title || file.filename)
    setDescDraft(file.description || '')
    setEditingTitle(false)
    setEditingDesc(false)
  }, [file.id])

  // Auto-focus inputs
  useEffect(() => {
    if (editingTitle && titleInputRef.current) {
      titleInputRef.current.focus()
      titleInputRef.current.select()
    }
  }, [editingTitle])

  useEffect(() => {
    if (editingDesc && descTextareaRef.current) {
      descTextareaRef.current.focus()
    }
  }, [editingDesc])

  // --- Helpers ---
  const isVideo = file.type.startsWith('video/')
  const isAudio = file.type.startsWith('audio/') || file.filename.toLowerCase().endsWith('.m4b')
  const getIcon = () => {
    if (isVideo) return <Video size={22} />
    if (isAudio) return <Music size={22} />
    return <FileIcon size={22} />
  }

  const saveTitle = () => {
    const trimmed = titleDraft.trim()
    if (trimmed && trimmed !== file.title) {
      onUpdateFile(file.id, { title: trimmed })
    }
    setEditingTitle(false)
  }

  const saveDesc = () => {
    if (descDraft !== (file.description || '')) {
      onUpdateFile(file.id, { description: descDraft })
    }
    setEditingDesc(false)
  }

  if (!isOpen) return null

  const progress = Math.min(file.playProgress || 0, 100)

  const sheet = (
    <div className="fixed inset-0 z-[100] flex flex-col zen-gradient-bg animate-[slideUpFullScreen_0.4s_cubic-bezier(0.16,1,0.3,1)]">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-glass-border bg-glass backdrop-blur-zen sticky top-0 z-20 shadow-sm">
        <h2 className="text-lg font-bold text-sage-dark line-clamp-1 flex-1 pr-4">
          File Details
        </h2>
        <button
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/50 hover:bg-white text-gray-500 hover:text-sage-dark transition-all shadow-sm"
          aria-label="Close detail sheet"
        >
          <X size={20} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-8 pb-36 scroll-smooth">
        <div className="max-w-2xl mx-auto px-6 sm:px-10 w-full space-y-8">

          {/* Icon + File meta */}
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${isAudio ? 'bg-sage-light/40 text-sage-dark' : 'bg-sage-light/30 text-sage-dark'}`}>
              {getIcon()}
            </div>
            <div className="min-w-0">
              <p className="text-sm text-gray-400 font-medium truncate">
                {file.filename}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {formatSize(file.size)} • {file.filename.split('.').pop()?.toUpperCase() || 'FILE'}
              </p>
            </div>
          </div>

          {/* --- Title --- */}
          <div className="bg-white/60 backdrop-blur-sm border border-white/80 rounded-2xl p-5 shadow-sm">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Title</label>
            {editingTitle ? (
              <div className="flex items-center gap-2">
                <input
                  ref={titleInputRef}
                  type="text"
                  value={titleDraft}
                  onChange={e => setTitleDraft(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') { setEditingTitle(false); setTitleDraft(file.title || file.filename) } }}
                  className="flex-1 text-lg font-semibold text-sage-dark bg-white/70 border border-sage-medium/30 rounded-xl px-3 py-2 outline-none focus:border-sage-dark transition-colors"
                />
                <button
                  onClick={saveTitle}
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-sage-dark text-white shadow-md active:scale-95 transition-transform"
                >
                  <Check size={16} />
                </button>
              </div>
            ) : (
              <div
                className="flex items-center gap-2 group/title cursor-pointer"
                onClick={() => setEditingTitle(true)}
              >
                <span className="text-lg font-semibold text-sage-dark flex-1">
                  {file.title || file.filename}
                </span>
                <Pencil size={14} className="text-gray-300 group-hover/title:text-sage-dark transition-colors shrink-0" />
              </div>
            )}
          </div>

          {/* --- Progress --- */}
          <div className="bg-white/60 backdrop-blur-sm border border-white/80 rounded-2xl p-5 shadow-sm">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 block">Play Progress</label>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-sage-dark rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
              <span className="text-sm font-bold text-sage-dark tabular-nums shrink-0 min-w-[3rem] text-right">
                {progress.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* --- Description --- */}
          <div className="bg-white/60 backdrop-blur-sm border border-white/80 rounded-2xl p-5 shadow-sm">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Description</label>
            {editingDesc ? (
              <div className="space-y-2">
                <textarea
                  ref={descTextareaRef}
                  value={descDraft}
                  onChange={e => setDescDraft(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Escape') { setEditingDesc(false); setDescDraft(file.description || '') } }}
                  rows={5}
                  className="w-full text-sm text-sage-dark bg-white/70 border border-sage-medium/30 rounded-xl px-3 py-2.5 outline-none focus:border-sage-dark transition-colors resize-y leading-relaxed"
                  placeholder="Add notes or a description…"
                />
                <div className="flex justify-end">
                  <button
                    onClick={saveDesc}
                    className="px-4 py-2 text-xs font-bold bg-sage-dark text-white rounded-xl shadow-md active:scale-95 transition-transform"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <div
                className="flex items-start gap-2 group/desc cursor-pointer min-h-[2.5rem]"
                onClick={() => setEditingDesc(true)}
              >
                <span className={`text-sm leading-relaxed flex-1 whitespace-pre-wrap ${file.description ? 'text-sage-dark' : 'text-gray-300 italic'}`}>
                  {file.description || 'Tap to add a description…'}
                </span>
                <Pencil size={14} className="text-gray-300 group-hover/desc:text-sage-dark transition-colors shrink-0 mt-0.5" />
              </div>
            )}
          </div>

          {/* --- Metadata --- */}
          <div className="bg-white/60 backdrop-blur-sm border border-white/80 rounded-2xl p-5 shadow-sm">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 block">Info</label>
            <div className="grid grid-cols-2 gap-y-3 text-sm">
              <span className="text-gray-400 font-medium">Added</span>
              <span className="text-sage-dark font-semibold text-right">
                {new Date(file.addedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
              <span className="text-gray-400 font-medium">Size</span>
              <span className="text-sage-dark font-semibold text-right">{formatSize(file.size)}</span>
              <span className="text-gray-400 font-medium">Type</span>
              <span className="text-sage-dark font-semibold text-right">{file.type || 'unknown'}</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  )

  return ReactDOM.createPortal(sheet, document.body)
}

export default OfflineDetailSheet
