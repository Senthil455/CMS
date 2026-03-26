import React from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { X, File, Music, Download, Trash2, Loader2, ChevronLeft } from "lucide-react";
import { formatSize, getFileIcon } from "../../utils/assetUtils";

interface AssetDetailSheetProps {
  asset: any | null;
  getCmsAssetUrl: (path: string) => string;
  isConverting: boolean;
  conversionProgress?: number | null;
  conversionType?: 'mp3' | 'm4a' | null;
  onClose: () => void;
  onConvertToMp3: (id: number) => void;
  onConvertToM4a: (id: number) => void;
  onDelete: (id: number) => void;
}

const AssetDetailSheet: React.FC<AssetDetailSheetProps> = ({
  asset,
  getCmsAssetUrl,
  isConverting,
  conversionProgress,
  conversionType,
  onClose,
  onConvertToMp3,
  onConvertToM4a,
  onDelete,
}) => {
  return (
    <AnimatePresence>
      {asset && (
        <>
          {/* Backdrop */}
          <motion.div
            key="asset-detail-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[110]"
          />

          {/* Sheet */}
          <motion.div
            key="asset-detail-sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-x-0 bottom-0 bg-white rounded-t-2xl z-[120] p-6 pb-10 shadow-2xl flex flex-col gap-6"
            style={{ maxHeight: '88vh', overflowY: 'auto' }}
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
                <div className="w-px h-6 bg-sage-light/40 mx-1" />
                <div>
                  <h2 className="text-xl font-extrabold text-sage-dark truncate max-w-[200px]">
                    {asset.title || asset.name}
                  </h2>
                  <p className="text-xs text-text-muted font-bold uppercase tracking-widest">
                    {asset.type}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-3 bg-sage-light/30 rounded-full text-sage-dark hover:bg-sage-light/50 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Preview area */}
            {asset.type?.startsWith('image/') ? (
              <div className="w-full aspect-video bg-black rounded-3xl overflow-hidden shadow-inner">
                <img
                  src={getCmsAssetUrl(asset.path)}
                  alt={asset.title}
                  className="w-full h-full object-contain"
                />
              </div>
            ) : asset.type?.startsWith('video/') ? (
              <div className="w-full aspect-video bg-black rounded-3xl overflow-hidden shadow-inner">
                <video
                  src={getCmsAssetUrl(asset.path)}
                  className="w-full h-full object-contain"
                  controls
                  playsInline
                />
              </div>
            ) : asset.type?.startsWith('audio/') ? (
              <div className="w-full rounded-3xl bg-sage-light/20 flex flex-col items-center justify-center gap-5 py-10">
                <div className="w-20 h-20 rounded-full bg-sage-dark/10 flex items-center justify-center">
                  <Music size={36} className="text-sage-dark" />
                </div>
                <audio
                  src={getCmsAssetUrl(asset.path)}
                  className="w-[90%] max-w-[320px]"
                  controls
                  autoPlay
                />
              </div>
            ) : (
              <div className="w-full aspect-video bg-sage-light/10 rounded-3xl flex items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-sage-dark/10 flex items-center justify-center">
                  {getFileIcon(asset.type || '')}
                </div>
              </div>
            )}

            {/* Metadata pills */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 bg-sage-light/20 rounded-2xl">
                <p className="text-[0.65rem] text-text-muted font-bold uppercase tracking-widest mb-1">Size</p>
                <p className="text-base text-sage-dark font-extrabold">{formatSize(asset.size || 0)}</p>
              </div>
              <div className="p-4 bg-sage-light/20 rounded-2xl">
                <p className="text-[0.65rem] text-text-muted font-bold uppercase tracking-widest mb-1">Created</p>
                <p className="text-base text-sage-dark font-extrabold">
                  {new Date(asset.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div>
              <div className={`grid gap-3 ${asset.type?.startsWith('video/') ? 'grid-cols-4' : 'grid-cols-2'}`}>
                {asset.type?.startsWith('video/') && (
                  <>
                    <button
                      onClick={() => onConvertToMp3(asset.id)}
                      disabled={isConverting}
                      className="flex flex-col items-center justify-center gap-1.5 py-4 bg-sage-light/30 text-sage-dark rounded-2xl font-bold text-[0.7rem] border border-sage-light/50 transition-all active:scale-[0.97] hover:bg-sage-light/50 disabled:opacity-50"
                    >
                      {isConverting && conversionType === 'mp3'
                        ? <Loader2 className="animate-spin" size={20} />
                        : <Music size={20} />}
                      <span>
                        {isConverting && conversionType === 'mp3' && conversionProgress !== null
                          ? `${conversionProgress}%`
                          : 'MP3'}
                      </span>
                    </button>

                    <button
                      onClick={() => onConvertToM4a(asset.id)}
                      disabled={isConverting}
                      className="flex flex-col items-center justify-center gap-1.5 py-4 bg-sage-light/30 text-sage-dark rounded-2xl font-bold text-[0.7rem] border border-sage-light/50 transition-all active:scale-[0.97] hover:bg-sage-light/50 disabled:opacity-50"
                    >
                      {isConverting && conversionType === 'm4a'
                        ? <Loader2 className="animate-spin" size={20} />
                        : <Music size={20} />}
                      <span>
                        {isConverting && conversionType === 'm4a' && conversionProgress !== null
                          ? `${conversionProgress}%`
                          : 'M4A'}
                      </span>
                    </button>
                  </>
                )}

                <a
                  href={getCmsAssetUrl(asset.path)}
                  download={asset.name}
                  className="flex flex-col items-center justify-center gap-1.5 py-4 bg-sage-dark text-white rounded-2xl font-bold text-[0.7rem] transition-all active:scale-[0.97] hover:opacity-90 no-underline"
                >
                  <Download size={20} />
                  <span>Download</span>
                </a>

                <button
                  onClick={() => asset && onDelete(asset.id)}
                  className="flex flex-col items-center justify-center gap-1.5 py-4 bg-red-50 text-red-400 rounded-2xl font-bold text-[0.7rem] border border-red-100 transition-all active:scale-[0.97] hover:bg-red-500 hover:text-white hover:border-red-500"
                >
                  <Trash2 size={20} />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AssetDetailSheet;
