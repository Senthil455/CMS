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
      className="flex items-center gap-3 p-3 bg-white/70 hover:bg-white/95 transition-all duration-200 group cursor-pointer"
    >
      {/* Image */}
      <div className="w-14 h-14 shrink-0 rounded-lg overflow-hidden bg-sage-light/20 relative flex items-center justify-center">
        {asset.type?.startsWith('image/') ? (
          <img 
            src={getCmsAssetUrl(asset.path)} 
            alt={asset.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
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
              <Video className="text-white/70 drop-shadow-md" size={16} />
            </div>
          </div>
        ) : (
          <div className="w-full h-full scale-[0.6] origin-center flex items-center justify-center">
            {getFileIcon(asset.type || '')}
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
        <h3 className="text-sm font-bold text-sage-dark leading-tight line-clamp-2 mb-1">
          {asset.title || asset.name}
        </h3>
        <p className="text-[0.7rem] text-text-muted line-clamp-1 mb-2">
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
