import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect, useState, useCallback } from 'react'
import { useOnlineStatus } from '@/hooks'
import { initializeDB } from '@/db/database'
import { StatusBar } from '@/components/StatusBar'
import { SyncManager } from '@/components/SyncManager'
import { BottomNav } from '@/components/BottomNav'
import { TopBar } from '@/components/TopBar'
import { motion, AnimatePresence } from 'framer-motion'
import { useUserInfo, setAuthApiBaseUrl, setActivityBaseUrl } from "@cms/sdk"
import axios from 'axios'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ExplorePage from './pages/ExplorePage'
import BookmarksPage from './pages/BookmarksPage'
import AssetsPage from './pages/AssetsPage'
import OfflinePage from './pages/OfflinePage'
import './App.css'
import { SleepTimerProvider } from './contexts/SleepTimerContext'

// Configure SDK
const apiBaseUrl = import.meta.env.VITE_REACT_APP_API_URL ?? '';
setAuthApiBaseUrl(apiBaseUrl);
setActivityBaseUrl(apiBaseUrl);
import { setCmsApiBaseUrl } from "@cms/sdk";
setCmsApiBaseUrl(apiBaseUrl);
axios.defaults.withCredentials = true;

function AppContent() {
  const { data: userInfo, isLoading: isUserLoading } = useUserInfo()
  const [syncStatus, setSyncStatus] = useState({
    isSyncing: false,
    error: null as string | null,
  })
  const offlineState = useOnlineStatus()
  const location = useLocation()

  useEffect(() => {
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

  if (isUserLoading) {
    return (
      <div className="zen-gradient-bg" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--sage-dark)' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="animate-spin" style={{ marginBottom: '1rem' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          </div>
          <p style={{ fontWeight: 600 }}>Loading Stash...</p>
        </div>
      </div>
    )
  }

  if (!userInfo && (location.pathname === '/login' || location.pathname === '/auth/register')) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage baseRouter="/stash" />} />
        <Route path="/auth/register" element={<RegisterPage baseRouter="/stash" />} />
      </Routes>
    )
  }

  return (
    <div className="zen-gradient-bg">
      <div className="app-shell">
        <StatusBar offlineState={{ ...offlineState, syncStatus: { ...syncStatus, lastSyncTime: offlineState.syncStatus.lastSyncTime } }} />

        <SyncManager
          isOnline={offlineState.isOnline}
          userId={userInfo?.id}
          onSyncStart={handleSyncStart}
          onSyncEnd={handleSyncEnd}
        />

        <main className="page-container">
          <TopBar />

          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/login" element={<Navigate to="/explore" replace />} />
              <Route path="/" element={<Navigate to="/explore" replace />} />
              <Route path="/explore" element={
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <ExplorePage />
                </motion.div>
              } />
              <Route path="/bookmarks" element={
                userInfo ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <BookmarksPage />
                  </motion.div>
                ) : (
                  <Navigate to="/login" state={{ from: location }} replace />
                )
              } />
              <Route path="/assets" element={
                userInfo ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <AssetsPage />
                  </motion.div>
                ) : (
                  <Navigate to="/login" state={{ from: location }} replace />
                )
              } />
              <Route path="/offline" element={
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <OfflinePage />
                </motion.div>
              } />
            </Routes>
          </AnimatePresence>
        </main>

        <BottomNav />
      </div>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter basename="/stash">
      <SleepTimerProvider>
        <AppContent />
      </SleepTimerProvider>
    </BrowserRouter>
  )
}

export default App
