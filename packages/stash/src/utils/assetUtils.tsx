import React from 'react';
import { 
  File, 
  Video, 
  Music, 
  Image as ImageIcon 
} from "lucide-react";

export const formatSize = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const getFileIcon = (type: string) => {
  if (type.startsWith('video/')) return <Video className="text-blue-500" size={24} />;
  if (type.startsWith('audio/')) return <Music className="text-purple-500" size={24} />;
  if (type.startsWith('image/')) return <ImageIcon className="text-green-500" size={24} />;
  return <File className="text-gray-500" size={24} />;
};
