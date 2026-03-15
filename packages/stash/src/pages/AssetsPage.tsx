import React, { useState, useEffect } from 'react';
import { useAssets, useGetCmsAssetsUrl, downloadVideo } from "@cms/sdk";
import { motion, AnimatePresence } from "framer-motion";
import { 
  File, 
  Video, 
  Music, 
  Image as ImageIcon, 
  Download, 
  MoreVertical, 
  X, 
  Youtube, 
  Loader2,
  Trash2,
  ChevronRight,
  Plus,
  Link
} from "lucide-react";

const formatSize = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getFileIcon = (type: string) => {
  if (type.startsWith('video/')) return <Video className="text-blue-500" size={24} />;
  if (type.startsWith('audio/')) return <Music className="text-purple-500" size={24} />;
  if (type.startsWith('image/')) return <ImageIcon className="text-green-500" size={24} />;
  return <File className="text-gray-500" size={24} />;
};

const AssetsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'video' | 'audio' | 'image'>('all');
  const [selectedAsset, setSelectedAsset] = useState<any | null>(null);
  const [showAddAssetDialog, setShowAddAssetDialog] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');

  // SWR hook for assets
  const getQs = () => {
    const params = new URLSearchParams();
    if (activeTab === 'video') params.append('type[startsWith]', 'video/');
    if (activeTab === 'audio') params.append('type[startsWith]', 'audio/');
    if (activeTab === 'image') params.append('type[startsWith]', 'image/');
    
    params.append('offset', '0');
    params.append('limit', '48');
    params.append('sort[id]', '-1');
    return params.toString();
  };

  const { data, isLoading, mutate } = useAssets(getQs(), true);
  const getCmsAssetUrl = useGetCmsAssetsUrl();

  const assets = (data as any)?.items || [];
  const filteredAssets = assets;

  const handleAddAsset = async () => {
    if (!videoUrl) return;
    setIsDownloading(true);
    setDownloadError('');
    try {
      await downloadVideo(videoUrl);
      mutate();
      setShowAddAssetDialog(false);
      setVideoUrl('');
    } catch (err) {
      setDownloadError('Failed to start download. Please check the URL.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleClipboardCheck = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && (text.includes('youtube.com') || text.includes('youtu.be') || text.includes('http'))) {
        setVideoUrl(text);
      }
    } catch (err) {
      // Ignore clipboard errors
    }
    setShowAddAssetDialog(true);
  };

  return (
    <div className="flex flex-col gap-6 pb-24">
      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-sage-light/50 rounded-2xl w-fit sticky top-0 z-10 backdrop-blur-md">
        {(['all', 'video', 'audio', 'image'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-xl text-[0.75rem] font-bold transition-all duration-300 ${
              activeTab === tab 
                ? 'bg-white text-sage-dark shadow-sm' 
                : 'text-text-muted hover:text-sage-dark'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="animate-spin text-sage-medium" size={32} />
        </div>
      ) : filteredAssets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
          <div className="w-16 h-16 bg-sage-light/30 rounded-full flex items-center justify-center">
            <File className="text-sage-medium" size={32} />
          </div>
          <p className="text-text-muted font-medium italic">No assets found in this category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {filteredAssets.map((asset: any) => (
            <motion.div
              key={asset.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedAsset(asset)}
              className="bg-glass backdrop-blur-zen rounded-[24px] border border-glass-border overflow-hidden shadow-sm hover:shadow-md transition-all group"
            >
              <div className="aspect-square bg-sage-light/20 flex items-center justify-center relative overflow-hidden">
                {asset.type?.startsWith('image/') ? (
                  <img 
                    src={getCmsAssetUrl(asset.path)} 
                    alt={asset.title}
                    className="w-full h-full object-cover"
                  />
                ) : asset.type?.startsWith('video/') ? (
                   <div className="w-full h-full relative">
                      <video 
                        src={`${getCmsAssetUrl(asset.path)}#t=0.5`}
                        className="w-full h-full object-cover"
                        preload="metadata"
                        muted
                        playsInline
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                        <Video className="text-white/70 drop-shadow-md" size={32} />
                      </div>
                   </div>
                ) : (
                  getFileIcon(asset.type || '')
                )}
                {asset.progress < 100 && (
                  <div className="absolute inset-x-0 bottom-0 h-1 bg-sage-light/30">
                    <div 
                      className="h-full bg-primary-color transition-all duration-500" 
                      style={{ width: `${asset.progress}%` }} 
                    />
                  </div>
                )}
              </div>
              <div className="p-3">

                <h3 className="text-[0.8rem] font-bold text-sage-dark truncate mb-1">{asset.title || asset.name}</h3>
                <div className="flex justify-between items-center text-[0.65rem] text-text-muted">
                  <span>{formatSize(asset.size || 0)}</span>
                  <span className="uppercase">{asset.type?.split('/')[1] || 'FILE'}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Floating Action Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        animate={{ 
          boxShadow: [
            "0px 4px 20px rgba(16, 185, 129, 0.3)",
            "0px 4px 30px rgba(16, 185, 129, 0.6)",
            "0px 4px 20px rgba(16, 185, 129, 0.3)"
          ]
        }}
        transition={{ 
          boxShadow: {
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }
        }}
        onClick={handleClipboardCheck}
        className="fixed bottom-24 right-6 w-14 h-14 bg-emerald-500 text-white rounded-full shadow-lg flex items-center justify-center z-40 group"
      >
        <div className="relative">
          <Plus size={28} />
          <motion.div 
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 bg-white rounded-full -z-10"
          />
        </div>
      </motion.button>


      {/* Asset Detail Bottom Sheet */}
      <AnimatePresence>
        {selectedAsset && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedAsset(null)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[50]"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-x-0 bottom-0 bg-white/95 backdrop-blur-2xl rounded-t-[32px] border-t border-glass-border z-[60] p-6 pb-12 max-h-[85vh] overflow-y-auto"
            >
              <div className="w-12 h-1 bg-sage-light/50 rounded-full mx-auto mb-6" />
              
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-sage-light/20 rounded-2xl flex items-center justify-center">
                    {getFileIcon(selectedAsset.type || '')}
                  </div>
                  <div>
                    <h2 className="text-xl font-extrabold text-sage-dark">{selectedAsset.title || selectedAsset.name}</h2>
                    <p className="text-[0.8rem] text-text-muted">{selectedAsset.type}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedAsset(null)}
                  className="p-2 bg-sage-light/30 rounded-full text-sage-dark"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="aspect-video bg-sage-light/20 rounded-2xl mb-6 overflow-hidden flex items-center justify-center group relative">
                {selectedAsset.type?.startsWith('image/') ? (
                   <img 
                    src={getCmsAssetUrl(selectedAsset.path)} 
                    alt={selectedAsset.title}
                    className="w-full h-full object-contain"
                  />
                ) : selectedAsset.type?.startsWith('video/') ? (
                  <video 
                    src={getCmsAssetUrl(selectedAsset.path)}
                    className="w-full h-full object-contain"
                    controls
                    playsInline
                  />
                ) : (
                  <File size={48} className="text-sage-medium" />
                )}
              </div>


              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="p-4 bg-sage-light/10 rounded-2xl">
                  <p className="text-[0.7rem] text-text-muted font-bold uppercase mb-1">Size</p>
                  <p className="text-[0.9rem] text-sage-dark font-bold">{formatSize(selectedAsset.size || 0)}</p>
                </div>
                <div className="p-4 bg-sage-light/10 rounded-2xl">
                  <p className="text-[0.7rem] text-text-muted font-bold uppercase mb-1">Created</p>
                  <p className="text-[0.9rem] text-sage-dark font-bold">
                    {new Date(selectedAsset.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <a
                  href={getCmsAssetUrl(selectedAsset.path)}
                  download={selectedAsset.name}
                  className="flex-1 py-4 bg-primary-color text-white rounded-[18px] font-bold flex items-center justify-center gap-3 shadow-lg shadow-primary/20"
                >
                  <Download size={20} />
                  <span>Download File</span>
                </a>
                <button
                  className="w-14 h-14 bg-red-50 text-red-500 rounded-[18px] flex items-center justify-center transition-all hover:bg-red-500 hover:text-white"
                >
                  <Trash2 size={24} />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Download Dialog */}
      <AnimatePresence>
        {showAddAssetDialog && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isDownloading && setShowAddAssetDialog(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-md z-[70]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[92%] max-w-[420px] bg-white rounded-[40px] shadow-2xl z-[80] overflow-hidden border border-white/20"
            >
              {/* Hero Header Area */}
              <div className="relative h-16 bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_50%,#fff_0%,transparent_70%)]" />
                <div className="z-10 bg-white/20 backdrop-blur-md p-2 rounded-2xl border border-white/30 shadow-lg">
                  <motion.div
                    animate={{
                      scale: [1, 1.1, 1],
                      boxShadow: [
                        "0 0 0 0px rgba(255, 255, 255, 0)",
                        "0 0 0 8px rgba(255, 255, 255, 0.2)",
                        "0 0 0 0px rgba(255, 255, 255, 0)"
                      ]
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="bg-white text-emerald-600 rounded-xl p-1.5"
                  >
                    <Plus size={20} />
                  </motion.div>
                </div>
                <button
                  onClick={() => setShowAddAssetDialog(false)}
                  className="absolute top-4 right-4 p-1.5 bg-black/10 hover:bg-black/20 text-white rounded-full transition-all"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="p-8">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-black text-sage-dark mb-2">Add New Asset</h3>
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[0.7rem] font-bold rounded-full border border-emerald-100 uppercase tracking-wider">Video</span>
                    <span className="px-3 py-1 bg-teal-50 text-teal-600 text-[0.7rem] font-bold rounded-full border border-teal-100 uppercase tracking-wider">MP3</span>
                    <span className="text-text-muted text-[0.7rem] font-medium ml-1">etc.</span>
                  </div>
                  <p className="text-[0.9rem] text-text-muted leading-relaxed">
                    Paste a link to any media file to automatically add it to your stash.
                  </p>
                </div>

                <div className="flex flex-col gap-5">
                  <div className="relative group">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-500/50 group-focus-within:text-emerald-500 transition-colors pointer-events-none">
                      <Link size={16} />
                    </div>
                    <input
                      type="text"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      placeholder="https://example.com/asset-url"
                      className="w-full py-3.5 pl-10 pr-4 bg-sage-light/20 border border-sage-light/50 rounded-2xl outline-none focus:border-emerald-500 focus:bg-white focus:shadow-lg focus:shadow-emerald-500/5 transition-all text-[0.9rem] text-sage-dark font-medium placeholder:text-text-muted/50"
                      disabled={isDownloading}
                    />
                  </div>

                  {downloadError && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-500 text-[0.8rem] font-bold px-2 flex items-center gap-2"
                    >
                      <div className="w-1 h-1 bg-red-500 rounded-full" />
                      {downloadError}
                    </motion.p>
                  )}

                  <button
                    onClick={handleAddAsset}
                    disabled={!videoUrl || isDownloading}
                    className="relative w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-[20px] font-black text-[1rem] flex items-center justify-center gap-3 disabled:opacity-50 shadow-xl shadow-emerald-500/30 active:scale-[0.98] transition-all overflow-hidden group"
                  >
                    {/* Shimmer effect */}
                    <motion.div
                      animate={{
                        left: ['-100%', '200%']
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="absolute top-0 bottom-0 w-1/2 bg-white/20 skew-x-12 -z-0"
                    />

                    <span className="relative z-10 flex items-center gap-3">
                      {isDownloading ? (
                        <>
                          <Loader2 className="animate-spin" size={20} />
                          <span>Processing Content...</span>
                        </>
                      ) : (
                        <>
                          <Plus size={22} strokeWidth={3} />
                          <span>Add Asset Now</span>
                        </>
                      )}
                    </span>
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AssetsPage;
