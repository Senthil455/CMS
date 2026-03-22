import React, { useState } from 'react';
import { useAssets, useGetCmsAssetsUrl, downloadVideo, convertToMp3, convertToM4a, deleteAsset, getAssetProgress } from "@cms/sdk";
import AssetTabBar, { AssetTab } from "../components/assets/AssetTabBar";
import AssetGrid from "../components/assets/AssetGrid";
import AddAssetFab from "../components/assets/AddAssetFab";
import AssetDetailSheet from "../components/assets/AssetDetailSheet";
import AddAssetDialog from "../components/assets/AddAssetDialog";

const AssetsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AssetTab>('all');
  const [selectedAsset, setSelectedAsset] = useState<any | null>(null);
  const [showAddAssetDialog, setShowAddAssetDialog] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [conversionProgress, setConversionProgress] = useState<number | null>(null);
  const [conversionType, setConversionType] = useState<'mp3' | 'm4a' | null>(null);
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

  const handleConvertToMp3 = async (id: number) => {
    setIsConverting(true);
    setConversionType('mp3');
    setConversionProgress(0);
    try {
      const res = await convertToMp3(id) as any;
      if (res.error) {
        alert(res.errorDetail?.title || res.error);
        setIsConverting(false);
        setConversionProgress(null);
        setConversionType(null);
        return;
      }
      const newPath = res?.data?.path || (typeof res?.data === 'string' ? res.data : null);
      
      if (newPath) {
        const pollInfo = async () => {
          try {
            const progRes = await getAssetProgress(newPath) as any;
            const progress = progRes?.data?.progress;
            if (progress !== undefined) {
              setConversionProgress(progress);
              if (progress >= 100) {
                mutate();
                setIsConverting(false);
                setConversionProgress(null);
                setSelectedAsset(null);
                return;
              }
            }
          } catch (e) {
            console.warn("Polling error:", e);
          }
          setTimeout(pollInfo, 1000);
        };
        setTimeout(pollInfo, 1000);
      } else {
        mutate();
        setSelectedAsset(null);
        setIsConverting(false);
        setConversionProgress(null);
        setConversionType(null);
      }
    } catch (err) {
      console.error(err);
      setIsConverting(false);
      setConversionProgress(null);
      setConversionType(null);
    }
  };

  const handleConvertToM4a = async (id: number) => {
    setIsConverting(true);
    setConversionType('m4a');
    setConversionProgress(0);
    try {
      const res = await convertToM4a(id) as any;
      if (res.error) {
        alert(res.errorDetail?.title || res.error);
        setIsConverting(false);
        setConversionProgress(null);
        setConversionType(null);
        return;
      }
      const newPath = res?.data?.path || (typeof res?.data === 'string' ? res.data : null);
      
      if (newPath) {
        const pollInfo = async () => {
          try {
            const progRes = await getAssetProgress(newPath) as any;
            const progress = progRes?.data?.progress;
            if (progress !== undefined) {
              setConversionProgress(progress);
              if (progress >= 100) {
                mutate();
                setIsConverting(false);
                setConversionProgress(null);
                setConversionType(null);
                setSelectedAsset(null);
                return;
              }
            }
          } catch (e) {
            console.warn("Polling error:", e);
          }
          setTimeout(pollInfo, 1000);
        };
        setTimeout(pollInfo, 1000);
      } else {
        mutate();
        setSelectedAsset(null);
        setIsConverting(false);
        setConversionProgress(null);
        setConversionType(null);
      }
    } catch (err) {
      console.error(err);
      setIsConverting(false);
      setConversionProgress(null);
      setConversionType(null);
    }
  };

  const handleDeleteAsset = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this asset?')) {
      return;
    }
    
    try {
      await deleteAsset(id);
      mutate();
      setSelectedAsset(null);
    } catch (err) {
      console.error('Failed to delete asset:', err);
      alert('Failed to delete asset. Please try again.');
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
      <hr className="border-t border-gray-200/80 -mt-2 mb-0 mx-2" />
      <div className="flex flex-col gap-6 mt-1">
        <AssetTabBar activeTab={activeTab} onTabChange={setActiveTab} />
      
      <AssetGrid 
        assets={assets} 
        isLoading={isLoading} 
        getCmsAssetUrl={getCmsAssetUrl} 
        onAssetClick={setSelectedAsset} 
      />

      <AddAssetFab onClick={handleClipboardCheck} />

      <AssetDetailSheet 
        asset={selectedAsset} 
        getCmsAssetUrl={getCmsAssetUrl} 
        isConverting={isConverting} 
        conversionProgress={conversionProgress}
        conversionType={conversionType}
        onClose={() => setSelectedAsset(null)} 
        onConvertToMp3={handleConvertToMp3} 
        onConvertToM4a={handleConvertToM4a}
        onDelete={handleDeleteAsset}
      />

      <AddAssetDialog 
        show={showAddAssetDialog} 
        videoUrl={videoUrl} 
        isDownloading={isDownloading} 
        downloadError={downloadError} 
        onUrlChange={setVideoUrl} 
        onSubmit={handleAddAsset} 
        onClose={() => setShowAddAssetDialog(false)} 
      />
      </div>
    </div>
  );
};

export default AssetsPage;
