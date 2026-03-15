import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState, useCallback } from 'react'
import { Content } from '@/types'
import { useOnlineStatus } from '@/hooks'
import { initializeDB } from '@/utils/storage'
import { StatusBar } from '@/components/StatusBar'
import { SearchBar } from '@/components/SearchBar'
import { ContentList } from '@/components/ContentList'
import { ContentViewer } from '@/components/ContentViewer'
import { CacheStats } from '@/components/CacheStats'
import { SyncManager } from '@/components/SyncManager'
import { BottomNav } from '@/components/BottomNav'
import { AudioPlayer } from '@/components/AudioPlayer'
import './App.css'

function AppContent() {
  const [selectedContent, setSelectedContent] = useState<Content | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [syncStatus, setSyncStatus] = useState({
    isSyncing: false,
    error: null as string | null,
  })
  const [localAudio, setLocalAudio] = useState<{ src: string, title: string } | null>(null)
  const offlineState = useOnlineStatus()

  useEffect(() => {
    // Initialize database on mount
    initializeDB().catch(console.error)
  }, [])

  const handleSyncStart = useCallback(() => {
    setSyncStatus({ isSyncing: true, error: null })
  }, [])

  const handleSyncEnd = useCallback((success: boolean, error?: string) => {
    setSyncStatus({
      isSyncing: false,
      error: success ? null : error || 'Sync failed',
    })
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('audio/')) {
      const url = URL.createObjectURL(file)
      setLocalAudio({
        src: url,
        title: file.name.replace(/\.[^/.]+$/, "") // Remove extension
      })
    }
  }

  const handleClosePlayer = () => {
    if (localAudio?.src) {
      URL.revokeObjectURL(localAudio.src)
    }
    setLocalAudio(null)
  }

  return (
    <div className="zen-gradient-bg">
      <div className="app-shell">
        <StatusBar offlineState={{ ...offlineState, syncStatus: { ...syncStatus, lastSyncTime: offlineState.syncStatus.lastSyncTime } }} />

        <SyncManager
          isOnline={offlineState.isOnline}
          onSyncStart={handleSyncStart}
          onSyncEnd={handleSyncEnd}
        />

        <main className="page-container">
          <header style={{ marginBottom: '24px' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--sage-dark)' }}>
              Stash
            </h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Your offline content repository
            </p>
          </header>

          <Routes>
            <Route path="/" element={<Navigate to="/explore" replace />} />
            <Route 
              path="/explore" 
              element={
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <SearchBar onSearch={setSearchQuery} />
                  <ContentList
                    searchQuery={searchQuery}
                    onSelectContent={setSelectedContent}
                    selectedId={selectedContent?.id}
                  />
                  <CacheStats content={selectedContent || undefined} />
                  {selectedContent && (
                    <div style={{ marginTop: '1rem' }}>
                      <ContentViewer content={selectedContent} isOnline={offlineState.isOnline} />
                    </div>
                  )}
                </div>
              } 
            />
            <Route 
              path="/video" 
              element={
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--sage-dark)' }}>Video Stash</h2>
                  <ContentList
                    typeFilter="video"
                    onSelectContent={setSelectedContent}
                    selectedId={selectedContent?.id}
                  />
                </div>
              } 
            />
            <Route 
              path="/mp3" 
              element={
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--sage-dark)' }}>Audio Stash</h2>
                  </div>
                  
                  <label className="add-local-btn">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '20px' }}>
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                    Add Local File
                    <input 
                      type="file" 
                      accept="audio/*,audio/mpeg,audio/mp3,audio/wav,audio/m4a,.mp3,.m4a,.wav"
                      style={{ display: 'none' }} 
                      onChange={handleFileSelect}
                    />
                  </label>

                  <ContentList
                    typeFilter="mp3"
                    onSelectContent={setSelectedContent}
                    selectedId={selectedContent?.id}
                  />
                </div>
              } 
            />
            <Route 
              path="/article" 
              element={
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--sage-dark)' }}>Article Stash</h2>
                  <ContentList
                    typeFilter="article"
                    onSelectContent={setSelectedContent}
                    selectedId={selectedContent?.id}
                  />
                </div>
              } 
            />
          </Routes>
        </main>

        <BottomNav />
        
        {localAudio && (
          <AudioPlayer 
            src={localAudio.src} 
            title={localAudio.title} 
            onClose={handleClosePlayer} 
          />
        )}
      </div>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter basename="/stash">
      <AppContent />
    </BrowserRouter>
  )
}

export default App
