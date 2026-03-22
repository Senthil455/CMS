import React from 'react';
import { motion } from "framer-motion";
import { Video } from "lucide-react";
import { formatSize, getFileIcon } from "../../utils/assetUtils";

interface AssetCardProps {
  asset: any;
  getCmsAssetUrl: (path: string) => string;
  onClick: (asset: any) => void;
}

const AssetCard: React.FC<AssetCardProps> = ({ asset, getCmsAssetUrl, onClick }) => {
  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick(asset)}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 group cursor-pointer flex flex-col"
    >
      <div className="aspect-video bg-sage-light/20 flex items-center justify-center relative overflow-hidden rounded-t-2xl">
        {asset.type?.startsWith('image/') ? (
          <>
            <img 
              src={getCmsAssetUrl(asset.path)} 
              alt={asset.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
          </>
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
      <div className="p-4 flex flex-col min-h-0 bg-white rounded-b-2xl z-10">
        <h3 className="text-lg font-semibold text-sage-dark truncate mb-1.5">{asset.title || asset.name}</h3>
        <div className="flex justify-between items-center gap-2 mb-2">
          <p className="text-sm text-gray-500 truncate">{asset.description || 'No description available'}</p>
        </div>
        <div className="flex justify-between items-center text-xs text-gray-400 min-w-0 gap-2 mt-auto">
          <span className="flex items-center gap-1.5 px-2 py-0.5 bg-sage-light/50 text-sage-dark rounded font-medium truncate">
            {formatSize(asset.size || 0)}
          </span>
          <span className="uppercase shrink-0 tracking-wide font-medium">{asset.type?.split('/')[1] || 'FILE'}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default AssetCard;
