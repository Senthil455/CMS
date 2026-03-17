import React, { useEffect, useState, useRef } from 'react';
import { Plus, FolderOpen, AlertCircle, Info } from 'lucide-react';
import { OfflineFile } from '@/types';
import { getAllOfflineFiles, saveOfflineFile, deleteOfflineFile, updateOfflineFileProgress } from '@/utils/offlineStorage';
import OfflineFileCard from '@/components/offline/OfflineFileCard';
import OfflinePlayer from '@/components/offline/OfflinePlayer';

const OfflinePage: React.FC = () => {
  const [files, setFiles] = useState<OfflineFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<OfflineFile | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleUploadClick = async () => {
    // Check for File System Access API
    if ('showOpenFilePicker' in window) {
      try {
        const [handle] = await (window as any).showOpenFilePicker({
          types: [
            {
              description: 'Media Files',
              accept: {
                'video/*': ['.mp4', '.webm', '.ogg'],
                'audio/*': ['.mp3', '.wav', '.ogg', '.m4a'],
              },
            },
          ],
        });
        const fileData = await handle.getFile();
        await addFile(fileData, handle);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error(err);
        }
      }
    } else {
      // Fallback to traditional input
      fileInputRef.current?.click();
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await addFile(file);
    }
  };

  const addFile = async (file: File, handle?: any) => {
    const newFile: OfflineFile = {
      id: crypto.randomUUID(),
      filename: file.name,
      title: file.name.replace(/\.[^/.]+$/, ""), // Friendly title
      type: file.type,
      size: file.size,
      addedAt: new Date().toISOString(),
      playProgress: 0,
      fileHandle: handle || null,
    };
    
    await saveOfflineFile(newFile);
    await loadFiles();
  };

  const handlePlay = async (file: OfflineFile) => {
    try {
      let blob: Blob;
      
      if (file.fileHandle) {
        // Try to get file from handle (Desktop)
        try {
          // Verify permission
          const status = await file.fileHandle.queryPermission({ mode: 'read' });
          if (status !== 'granted') {
            await file.fileHandle.requestPermission({ mode: 'read' });
          }
          blob = await file.fileHandle.getFile();
        } catch (e) {
          console.warn('Could not access folder handle, prompting for re-open');
          alert('Need to re-select the file to access it again.');
          return;
        }
      } else {
        // Fallback for when we don't have a handle (iOS/Mobile or direct upload)
        // In a real app, we might store the Blob in IDB if it's small, 
        // but here we asked for "resume" so we'd need to re-pick on mobile.
        alert('Please re-open this file from your device to continue.');
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
    if (fileUrl) {
      URL.revokeObjectURL(fileUrl);
    }
    setFileUrl(null);
    setSelectedFile(null);
    loadFiles(); // Refresh to show updated progress
  };

  const handleDelete = async (id: string) => {
    if (confirm('Remove this file from your offline library?')) {
      await deleteOfflineFile(id);
      await loadFiles();
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-24">
      <div className="flex items-center justify-between px-2">
        <h1 className="text-2xl font-extrabold text-sage-dark">Offline Library</h1>
        <button 
          onClick={handleUploadClick}
          className="flex items-center gap-2 px-4 py-2.5 bg-sage-dark text-white rounded-2xl font-bold text-sm shadow-lg shadow-sage-dark/20 active:scale-95 transition-all"
        >
          <Plus size={18} />
          <span>Add Local File</span>
        </button>
      </div>

      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="video/*,audio/*"
        onChange={handleFileInputChange} 
      />

      {files.length === 0 && !isLoading ? (
        <div className="p-10 border-2 border-dashed border-sage-light/50 rounded-[40px] flex flex-col items-center justify-center bg-white/50 backdrop-blur-sm">
          <div className="w-16 h-16 bg-sage-light/30 rounded-2xl flex items-center justify-center text-sage-medium mb-4">
            <FolderOpen size={32} />
          </div>
          <p className="text-sage-dark font-bold text-[0.95rem] mb-1">No local files yet</p>
          <p className="text-[0.75rem] text-text-muted font-medium text-center max-w-[200px]">
            Add videos or audio files from your device to watch them offline.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {files.map(file => (
            <OfflineFileCard 
              key={file.id} 
              file={file} 
              onPlay={handlePlay} 
              onDelete={handleDelete}
              onProgressUpdate={updateOfflineFileProgress}
            />
          ))}
        </div>
      )}

      {/* Persistence Note for Desktop */}
      {'showOpenFilePicker' in window && files.length > 0 && (
        <div className="p-4 bg-violet-50 rounded-2xl border border-violet-100 flex gap-3 text-violet-700">
          <Info size={18} className="shrink-0" />
          <p className="text-[0.7rem] font-medium leading-relaxed">
            On Desktop, we store a reference to your files. If you move or rename them, you'll need to re-add them.
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
