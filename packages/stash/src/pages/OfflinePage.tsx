import React, { useEffect, useState, useRef } from 'react';
import { Plus, FolderOpen, Info } from 'lucide-react';
import { OfflineFile } from '@/types';
import { getAllOfflineFiles, saveOfflineFile, deleteOfflineFile, updateOfflineFileProgress } from '@/utils/offlineStorage';
import OfflineFileCard from '@/components/offline/OfflineFileCard';
import OfflinePlayer from '@/components/offline/OfflinePlayer';


const OfflinePage: React.FC = () => {
  const [files, setFiles] = useState<OfflineFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<OfflineFile | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // iOS re-select flow: when Blob is lost after session, prompt user to re-pick
  const reSelectFileRef = useRef<HTMLInputElement>(null);
  const pendingPlayFileRef = useRef<OfflineFile | null>(null);
  const transientBlobsRef = useRef<Record<string, Blob>>({});

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    setIsLoading(true);
    try {
      const allFiles = await getAllOfflineFiles();
      setFiles(allFiles.sort((a, b) => b.addedAt.localeCompare(a.addedAt)));
    } catch (error) {
      console.error('Failed to load offline files:', error);
    } finally {
      setIsLoading(false);
    }
  };



  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    debugger;
    const file = e.target.files?.[0];
    if (file) {
      const ext = file.name.toLowerCase()
      const isSupported = file.type.startsWith('audio/') || file.type.startsWith('video/')
        || /\.(mp3|wav|ogg|m4a|mp4|webm)$/.test(ext)
      if (!isSupported) {
        alert('Unsupported file type. Please select an audio or video file.')
        e.target.value = ''
        return
      }
      await addFile(file);
    }
    e.target.value = ''; // Reset so same file can be picked again
  };

  const addFile = async (file: File, handle?: any) => {
    debugger;
    const newFile: OfflineFile = {
      id: 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0;
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
      }),
      filename: file.name,
      title: file.name.replace(/\.[^/.]+$/, ''),
      type: file.type,
      size: file.size,
      addedAt: new Date().toISOString(),
      playProgress: 0,
      fileHandle: handle || null,
    };

    if (!handle) {
      transientBlobsRef.current[newFile.id] = file;
    }

    await saveOfflineFile(newFile);
    await loadFiles();
  };

  // Called when user re-picks a file after iOS session cleared the Blob
  const handleReSelectChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    debugger;
    const picked = e.target.files?.[0];
    const pending = pendingPlayFileRef.current;
    e.target.value = '';

    if (!picked || !pending) return;

    // Persist fresh Blob in memory so next play in same session works without re-picking
    transientBlobsRef.current[pending.id] = picked;

    pendingPlayFileRef.current = null;

    // Auto-play immediately
    const url = URL.createObjectURL(picked);
    setFileUrl(url);
    setSelectedFile({ ...pending });
    await loadFiles();
  };

  const handlePlay = async (file: OfflineFile) => {
    debugger;
    console.log('handlePlay', file);
    try {
      let blob: Blob;

      if (file.fileHandle) {
        // Desktop: use FileSystemFileHandle
        try {
          const status = await file.fileHandle.queryPermission({ mode: 'read' });
          if (status !== 'granted') {
            await file.fileHandle.requestPermission({ mode: 'read' });
          }
          blob = await file.fileHandle.getFile();
        } catch (e) {
          console.warn('Could not access file handle, prompting for re-open');
          alert('Please re-select the file to access it again.');
          return;
        }
      } else if (transientBlobsRef.current[file.id]) {
        // iOS/Mobile: Blob still alive in this session
        blob = transientBlobsRef.current[file.id];
      } else {
        // iOS: Blob was lost when the app was closed — ask user to re-pick the same file
        pendingPlayFileRef.current = file;
        reSelectFileRef.current?.click();
        return;
      }

      const url = URL.createObjectURL(blob);
      setFileUrl(url);
      setSelectedFile(file);
    } catch (error) {
      console.error('Playback failed:', error);
    }
  };

  const handleClosePlayer = () => {
    if (fileUrl) URL.revokeObjectURL(fileUrl);
    setFileUrl(null);
    setSelectedFile(null);
    loadFiles();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Remove this file from your offline library?')) {
      await deleteOfflineFile(id);
      await loadFiles();
    }
  };

  const isIOS = !('showOpenFilePicker' in window);

  return (
    <div className="flex flex-col gap-6 pb-24">
      <div className="flex items-center justify-end px-2">
        <input
          type="file"
          className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-2xl file:border-0 file:text-sm file:font-semibold file:bg-sage-dark file:text-white hover:file:bg-sage-dark/90 cursor-pointer"
          onChange={handleFileInputChange}
        />
      </div>

      {/* iOS re-select: triggered automatically when Blob is missing */}
      <input
        type="file"
        ref={reSelectFileRef}
        className="hidden"
        onChange={handleReSelectChange}
      />

      {files.length === 0 && !isLoading ? (
        <div className="p-10 border-2 border-dashed border-sage-light/50 rounded-3xl flex flex-col items-center justify-center bg-white/50 backdrop-blur-sm">
          <div className="w-16 h-16 bg-sage-light/30 rounded-2xl flex items-center justify-center text-sage-medium mb-4">
            <FolderOpen size={32} />
          </div>
          <p className="text-sage-dark font-bold text-[0.95rem] mb-1">No local files yet</p>
          <p className="text-[0.75rem] text-text-muted font-medium text-center max-w-[200px]">
            Add videos or audio files from your device to watch them offline.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2">
          {files.map(file => (
            <OfflineFileCard
              key={file.id}
              file={file}
              onPlay={handlePlay}
              onDelete={handleDelete}
              onProgressUpdate={updateOfflineFileProgress}
              onGetBlob={(id) => transientBlobsRef.current[id]}
            />
          ))}
        </div>
      )}

      {/* iOS note about re-selection */}
      {isIOS && files.length > 0 && (
        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3 text-amber-700">
          <Info size={18} className="shrink-0 mt-0.5" />
          <p className="text-[0.7rem] font-medium leading-relaxed">
            On iPhone/iPad, files need to be re-selected after you close the app. Just tap <strong>Play</strong> and pick the same file — playback will resume where you left off.
          </p>
        </div>
      )}



      <OfflinePlayer
        file={selectedFile}
        fileUrl={fileUrl}
        onClose={handleClosePlayer}
        onProgressUpdate={updateOfflineFileProgress}
      />
    </div>
  );
};

export default OfflinePage;
