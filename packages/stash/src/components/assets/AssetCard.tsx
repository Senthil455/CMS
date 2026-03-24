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
      className="flex items-center gap-4 p-3.5 bg-white/80 hover:bg-white rounded-2xl border border-gray-100/60 hover:border-gray-200/80 shadow-sm hover:shadow-md transition-all duration-250 group cursor-pointer"
    >
      {/* Media with play overlay */}
      <div className="w-16 h-16 shrink-0 rounded-xl overflow-hidden bg-sage-light/20 relative flex items-center justify-center">
        {asset.type?.startsWith('image/') ? (
          <img 
            src={getCmsAssetUrl(asset.path)} 
            alt={asset.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : asset.type?.startsWith('video/') ? (
          <div className="w-full h-full relative">
            <video 
              src={`${getCmsAssetUrl(asset.path)}#t=0.5`}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              preload="metadata"
              muted
              playsInline
            />
          </div>
        ) : (
          <div className="w-full h-full scale-[0.8] origin-center flex items-center justify-center group-hover:scale-90 transition-transform duration-300">
            {getFileIcon(asset.type || '')}
          </div>
        )}

        {/* Play Overlay for interactive media */}
        {(asset.type?.startsWith('image/') || asset.type?.startsWith('video/')) && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-all duration-300 flex items-center justify-center">
            <svg
              width="22" height="22" viewBox="0 0 24 24" fill="white" stroke="none"
              className="opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all duration-300 drop-shadow-lg"
            >
              <polygon points="6 3 20 12 6 21 6 3" />
            </svg>
          </div>
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

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="text-[0.9rem] font-bold text-sage-dark leading-snug line-clamp-2 mb-1 group-hover:text-primary transition-colors duration-200">
          {asset.title || asset.name}
        </h3>
        <p className="text-[0.75rem] text-text-muted line-clamp-1 mb-1.5 font-medium">
          {asset.description || 'No description available'}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-[0.62rem] text-gray-400 font-bold uppercase tracking-wider">
            {formatSize(asset.size || 0)}
          </span>
          <span className="text-[0.62rem] text-sage-medium font-bold uppercase tracking-wider">
            • {asset.type?.split('/')[1] || 'FILE'}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default AssetCard;
