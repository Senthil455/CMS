import React, { useState, useRef, useEffect, useCallback } from 'react'
import ReactDOM from 'react-dom'
import { X, Pencil, Check, Music, Video, File as FileIcon, Trash2 } from 'lucide-react'
import { OfflineFile, FileNote } from '@/types'
import { formatSize } from '@/utils/assetUtils'
import { addFileNote, getFileNotes, updateFileNote, deleteFileNote } from '@/utils/fileNotes'

interface OfflineDetailSheetProps {
  file: OfflineFile
  isOpen: boolean
  onClose: () => void
  onUpdateFile: (id: string, updates: Partial<Pick<OfflineFile, 'title'>>) => void
  isAudio: boolean
  isPlaying: boolean
  currentTime: number
  duration: number
  playbackProgress: number
  onPlayToggle: () => void
  onSeek: (e: React.ChangeEvent<HTMLInputElement>) => void
  formatTime: (s: number) => string
}

const OfflineDetailSheet: React.FC<OfflineDetailSheetProps> = ({
  file, isOpen, onClose, onUpdateFile,
  isAudio, isPlaying, currentTime, duration, playbackProgress, onPlayToggle, onSeek, formatTime
}) => {
  // --- Inline-edit: Title ---
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState(file.title || file.filename)
  const titleInputRef = useRef<HTMLInputElement>(null)

  // --- Notes ---
  const [notes, setNotes] = useState<FileNote[]>([])
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [noteDraft, setNoteDraft] = useState('')
  const noteTextareaRef = useRef<HTMLTextAreaElement>(null)
  // New note input
  const [addingNote, setAddingNote] = useState(false)
  const [newNoteDraft, setNewNoteDraft] = useState('')
  const newNoteRef = useRef<HTMLTextAreaElement>(null)

  // Load notes when file changes or sheet opens
  const loadNotes = useCallback(async () => {
    const fetched = await getFileNotes(file.id)
    setNotes(fetched)
  }, [file.id])

  useEffect(() => {
    if (isOpen) loadNotes()
  }, [isOpen, loadNotes])

  // Sync title when file changes
  useEffect(() => {
    setTitleDraft(file.title || file.filename)
    setEditingTitle(false)
    setEditingNoteId(null)
    setAddingNote(false)
  }, [file.id])

  // Auto-focus
  useEffect(() => {
    if (editingTitle && titleInputRef.current) {
      titleInputRef.current.focus()
      titleInputRef.current.select()
    }
  }, [editingTitle])

  useEffect(() => {
    if (addingNote && newNoteRef.current) newNoteRef.current.focus()
  }, [addingNote])

  useEffect(() => {
    if (editingNoteId && noteTextareaRef.current) noteTextareaRef.current.focus()
  }, [editingNoteId])

  // --- Helpers ---
  const isVideo = file.type.startsWith('video/')
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

  // --- Note handlers ---
  const handleAddNote = async () => {
    const text = newNoteDraft.trim()
    if (!text) { setAddingNote(false); return }
    await addFileNote(file.id, currentTime, text)
    setNewNoteDraft('')
    setAddingNote(false)
    loadNotes()
  }

  const startEditNote = (note: FileNote) => {
    setEditingNoteId(note.id)
    setNoteDraft(note.desc)
  }

  const saveEditNote = async (id: string) => {
    const text = noteDraft.trim()
    if (text) await updateFileNote(id, text)
    setEditingNoteId(null)
    loadNotes()
  }

  const handleDeleteNote = async (id: string) => {
    await deleteFileNote(id)
    loadNotes()
  }

  if (!isOpen) return null

  const progress = Math.min(playbackProgress || 0, 100)

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
              <p className="text-sm text-gray-400 font-medium truncate">{file.filename}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {formatSize(file.size)} • {file.filename.split('.').pop()?.toUpperCase() || 'FILE'} • {new Date(file.addedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
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
                <button onClick={saveTitle} className="w-9 h-9 flex items-center justify-center rounded-full bg-sage-dark text-white shadow-md active:scale-95 transition-transform">
                  <Check size={16} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group/title cursor-pointer" onClick={() => setEditingTitle(true)}>
                <span className="text-lg font-semibold text-sage-dark flex-1">{file.title || file.filename}</span>
                <Pencil size={14} className="text-gray-300 group-hover/title:text-sage-dark transition-colors shrink-0" />
              </div>
            )}
          </div>

          {/* --- Play Progress --- */}
          <div className="bg-white/60 backdrop-blur-sm border border-white/80 rounded-2xl p-5 shadow-sm">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 block">Play Progress</label>
            <div className="flex items-center gap-4">
              <button
                onClick={onPlayToggle}
                className="w-10 h-10 bg-sage-dark text-white rounded-full flex items-center justify-center shadow-md shadow-sage-dark/20 active:scale-95 transition-transform shrink-0"
              >
                {isPlaying ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"></rect><rect x="14" y="4" width="4" height="16" rx="1"></rect></svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="ml-1"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                )}
              </button>

              {isAudio ? (
                <div className="flex-1 flex items-center gap-3">
                  <span className="text-xs font-bold text-sage-dark tabular-nums shrink-0 w-9 text-right">{formatTime(currentTime)}</span>
                  <input
                    type="range"
                    min={0}
                    max={duration || 0}
                    step={0.5}
                    value={currentTime}
                    onChange={onSeek}
                    className="flex-1 h-1.5 accent-sage-dark cursor-pointer rounded-full"
                  />
                  <span className="text-xs font-bold text-sage-dark tabular-nums shrink-0 w-9">{formatTime(duration)}</span>
                </div>
              ) : (
                <div className="flex-1 flex items-center gap-4">
                  <div className="flex-1">
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-sage-dark rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                  <span className="text-sm font-bold text-sage-dark tabular-nums shrink-0 min-w-[3rem] text-right">{progress.toFixed(1)}%</span>
                </div>
              )}
            </div>
          </div>

          {/* --- Notes --- */}
          <div className="bg-white/60 backdrop-blur-sm border border-white/80 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Notes {notes.length > 0 && <span className="text-sage-dark">({notes.length})</span>}
              </label>
              <button
                onClick={() => {
                  setNewNoteDraft('')
                  setAddingNote(true)
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[0.7rem] font-bold bg-sage-dark text-white rounded-xl shadow-sm active:scale-95 transition-all"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Add Note at {formatTime(currentTime)}
              </button>
            </div>

            {/* New note input */}
            {addingNote && (
              <div className="mb-4 space-y-2 bg-sage-light/20 border border-sage-medium/20 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[0.65rem] font-bold text-sage-dark bg-sage-light/60 px-2 py-0.5 rounded-full border border-sage-medium/20">
                    @ {formatTime(currentTime)}
                  </span>
                </div>
                <textarea
                  ref={newNoteRef}
                  value={newNoteDraft}
                  onChange={e => setNewNoteDraft(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Escape') { setAddingNote(false) } }}
                  rows={3}
                  className="w-full text-sm text-sage-dark bg-white/80 border border-sage-medium/20 rounded-xl px-3 py-2 outline-none focus:border-sage-dark transition-colors resize-none leading-relaxed"
                  placeholder="Write your note…"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setAddingNote(false)}
                    className="px-3 py-1.5 text-xs font-bold text-gray-400 hover:text-gray-600 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddNote}
                    className="px-4 py-1.5 text-xs font-bold bg-sage-dark text-white rounded-xl shadow-sm active:scale-95 transition-transform"
                  >
                    Save
                  </button>
                </div>
              </div>
            )}

            {/* Notes list */}
            {notes.length === 0 && !addingNote ? (
              <p className="text-sm text-gray-300 italic text-center py-4">No notes yet. Click "Add Note" to capture a thought at the current position.</p>
            ) : (
              <div className="space-y-3">
                {notes.map(note => (
                  <div key={note.id} className="bg-white/70 border border-white/90 rounded-xl p-3 shadow-sm">
                    {/* Position badge */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[0.65rem] font-bold text-sage-dark bg-sage-light/60 px-2 py-0.5 rounded-full border border-sage-medium/20">
                        @ {formatTime(note.position)}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => startEditNote(note)}
                          className="w-7 h-7 flex items-center justify-center rounded-full text-gray-300 hover:text-sage-dark hover:bg-sage-light/40 transition-all"
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          className="w-7 h-7 flex items-center justify-center rounded-full text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>

                    {editingNoteId === note.id ? (
                      <div className="space-y-2">
                        <textarea
                          ref={noteTextareaRef}
                          value={noteDraft}
                          onChange={e => setNoteDraft(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Escape') setEditingNoteId(null) }}
                          rows={3}
                          className="w-full text-sm text-sage-dark bg-white/80 border border-sage-medium/30 rounded-xl px-3 py-2 outline-none focus:border-sage-dark transition-colors resize-none leading-relaxed"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setEditingNoteId(null)}
                            className="px-3 py-1 text-xs font-bold text-gray-400 hover:text-gray-600 rounded-xl transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => saveEditNote(note.id)}
                            className="px-4 py-1 text-xs font-bold bg-sage-dark text-white rounded-xl shadow-sm active:scale-95 transition-transform"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-sage-dark leading-relaxed whitespace-pre-wrap">{note.desc}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )

  return ReactDOM.createPortal(sheet, document.body)
}

export default OfflineDetailSheet
