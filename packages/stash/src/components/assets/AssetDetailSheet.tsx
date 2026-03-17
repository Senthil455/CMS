import React from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { X, File, Music, Download, Trash2, Loader2 } from "lucide-react";
import { formatSize, getFileIcon } from "../../utils/assetUtils";

interface AssetDetailSheetProps {
  asset: any | null;
  getCmsAssetUrl: (path: string) => string;
  isConverting: boolean;
  onClose: () => void;
  onConvertToMp3: (id: number) => void;
  onDelete: (id: number) => void;
}

const AssetDetailSheet: React.FC<AssetDetailSheetProps> = ({ 
  asset, 
  getCmsAssetUrl, 
  isConverting, 
  onClose, 
  onConvertToMp3,
  onDelete
}) => {
  return (
    <AnimatePresence>
      {asset && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[110]"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-x-0 bottom-0 bg-white rounded-t-[32px] border-t border-glass-border z-[120] flex flex-col"
            style={{ maxHeight: '82vh' }}
          >
            {/* Drag handle */}
            <div className="flex-shrink-0 pt-3 pb-1 flex justify-center">
              <div className="w-10 h-1 bg-gray-200 rounded-full" />
            </div>

            {/* Header — always visible, never clipped */}
            <div className="flex-shrink-0 flex items-center gap-3 px-5 py-3 border-b border-gray-100">
              <div className="w-10 h-10 bg-sage-light/30 rounded-xl flex items-center justify-center flex-shrink-0">
                {getFileIcon(asset.type || '')}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-[0.95rem] font-extrabold text-sage-dark truncate leading-tight">
                  {asset.title || asset.name}
                </h2>
                <p className="text-[0.7rem] text-text-muted font-medium">{asset.type}</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 bg-sage-light/30 rounded-full text-sage-dark"
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-5 py-4 min-h-0">
              {/* Preview */}
              <div className="rounded-2xl overflow-hidden bg-gray-50 mb-4" style={{ aspectRatio: '16/9' }}>
                {asset.type?.startsWith('image/') ? (
                  <img
                    src={getCmsAssetUrl(asset.path)}
                    alt={asset.title}
                    className="w-full h-full object-contain"
                  />
                ) : asset.type?.startsWith('video/') ? (
                  <video
                    src={getCmsAssetUrl(asset.path)}
                    className="w-full h-full object-contain"
                    controls
                    playsInline
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <File size={48} className="text-sage-medium" />
                  </div>
                )}
              </div>

              {/* Metadata pills */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-sage-light/20 rounded-2xl">
                  <p className="text-[0.65rem] text-text-muted font-bold uppercase tracking-wider mb-0.5">Size</p>
                  <p className="text-[0.9rem] text-sage-dark font-bold">{formatSize(asset.size || 0)}</p>
                </div>
                <div className="p-3 bg-sage-light/20 rounded-2xl">
                  <p className="text-[0.65rem] text-text-muted font-bold uppercase tracking-wider mb-0.5">Created</p>
                  <p className="text-[0.9rem] text-sage-dark font-bold">
                    {new Date(asset.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Action buttons — uniform grid, always visible */}
            <div className="flex-shrink-0 px-5 pt-3 pb-8 border-t border-gray-100 bg-white">
              <div className={`grid gap-3 ${asset.type?.startsWith('video/') ? 'grid-cols-3' : 'grid-cols-2'}`}>
                {asset.type?.startsWith('video/') && (
                  <button
                    onClick={() => onConvertToMp3(asset.id)}
                    disabled={isConverting}
                    className="flex flex-col items-center justify-center gap-1.5 py-4 bg-violet-50 text-violet-600 rounded-2xl font-bold text-[0.7rem] border border-violet-100 transition-all active:scale-[0.97] hover:bg-violet-100 disabled:opacity-50"
                  >
                    {isConverting
                      ? <Loader2 className="animate-spin" size={20} />
                      : <Music size={20} />}
                    <span>Convert MP3</span>
                  </button>
                )}
                <a
                  href={getCmsAssetUrl(asset.path)}
                  download={asset.name}
                  className="flex flex-col items-center justify-center gap-1.5 py-4 bg-emerald-50 text-emerald-600 rounded-2xl font-bold text-[0.7rem] border border-emerald-100 transition-all active:scale-[0.97] hover:bg-emerald-100 no-underline"
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
