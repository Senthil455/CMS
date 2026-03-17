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
      className="bg-glass backdrop-blur-zen rounded-[24px] border border-glass-border overflow-hidden shadow-sm hover:shadow-md transition-all group cursor-pointer"
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
  );
};

export default AssetCard;
