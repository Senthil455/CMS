import React from 'react';
import { Loader2, File } from "lucide-react";
import AssetCard from "./AssetCard";

interface AssetGridProps {
  assets: any[];
  isLoading: boolean;
  getCmsAssetUrl: (path: string) => string;
  onAssetClick: (asset: any) => void;
}

const AssetGrid: React.FC<AssetGridProps> = ({ assets, isLoading, getCmsAssetUrl, onAssetClick }) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="animate-spin text-sage-medium" size={32} />
      </div>
    );
  }

  if (assets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
        <div className="w-16 h-16 bg-sage-light/30 rounded-full flex items-center justify-center">
          <File className="text-sage-medium" size={32} />
        </div>
        <p className="text-text-muted font-medium italic">No assets found in this category.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[1px] bg-gray-200/40 rounded-2xl overflow-hidden border border-gray-200/40 shadow-sm">
      {assets.map((asset) => (
        <AssetCard 
          key={asset.id} 
          asset={asset} 
          getCmsAssetUrl={getCmsAssetUrl} 
          onClick={onAssetClick} 
        />
      ))}
    </div>
  );
};

export default AssetGrid;
