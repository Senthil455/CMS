import React from 'react';
import { motion } from "framer-motion";
import { Plus } from "lucide-react";

interface AddAssetFabProps {
  onClick: () => void;
}

const AddAssetFab: React.FC<AddAssetFabProps> = ({ onClick }) => {
  return (
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
      onClick={onClick}
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
  );
};

export default AddAssetFab;
