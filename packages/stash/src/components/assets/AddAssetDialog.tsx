import React from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Link, Loader2 } from "lucide-react";

interface AddAssetDialogProps {
  show: boolean;
  videoUrl: string;
  isDownloading: boolean;
  downloadError: string;
  onUrlChange: (url: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}

const AddAssetDialog: React.FC<AddAssetDialogProps> = ({
  show,
  videoUrl,
  isDownloading,
  downloadError,
  onUrlChange,
  onSubmit,
  onClose
}) => {
  return (
    <AnimatePresence>
      {show && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !isDownloading && onClose()}
            className="fixed inset-0 bg-black/40 backdrop-blur-md z-[70]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 30 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[92%] max-w-[420px] bg-white rounded-[40px] shadow-2xl z-[80] overflow-hidden border border-white/20"
          >
            {/* Hero Header Area */}
            <div className="relative h-16 bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_50%,#fff_0%,transparent_70%)]" />
              <div className="z-10 bg-white/20 backdrop-blur-md p-2 rounded-2xl border border-white/30 shadow-lg">
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                    boxShadow: [
                      "0 0 0 0px rgba(255, 255, 255, 0)",
                      "0 0 0 8px rgba(255, 255, 255, 0.2)",
                      "0 0 0 0px rgba(255, 255, 255, 0)"
                    ]
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="bg-white text-emerald-600 rounded-xl p-1.5"
                >
                  <Plus size={20} />
                </motion.div>
              </div>
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-1.5 bg-black/10 hover:bg-black/20 text-white rounded-full transition-all"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-8">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-black text-sage-dark mb-2">Add New Asset</h3>
                <div className="flex items-center justify-center gap-2 mb-4">
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[0.7rem] font-bold rounded-full border border-emerald-100 uppercase tracking-wider">Video</span>
                  <span className="px-3 py-1 bg-teal-50 text-teal-600 text-[0.7rem] font-bold rounded-full border border-teal-100 uppercase tracking-wider">MP3</span>
                  <span className="text-text-muted text-[0.7rem] font-medium ml-1">etc.</span>
                </div>
                <p className="text-[0.9rem] text-text-muted leading-relaxed">
                  Paste a link to any media file to automatically add it to your stash.
                </p>
              </div>

              <div className="flex flex-col gap-5">
                <div className="relative group">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-500/50 group-focus-within:text-emerald-500 transition-colors pointer-events-none">
                    <Link size={16} />
                  </div>
                  <input
                    type="text"
                    value={videoUrl}
                    onChange={(e) => onUrlChange(e.target.value)}
                    placeholder="https://example.com/asset-url"
                    className="w-full py-3.5 pl-10 pr-4 bg-sage-light/20 border border-sage-light/50 rounded-2xl outline-none focus:border-emerald-500 focus:bg-white focus:shadow-lg focus:shadow-emerald-500/5 transition-all text-[0.9rem] text-sage-dark font-medium placeholder:text-text-muted/50"
                    disabled={isDownloading}
                  />
                </div>

                {downloadError && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-500 text-[0.8rem] font-bold px-2 flex items-center gap-2"
                  >
                    <div className="w-1 h-1 bg-red-500 rounded-full" />
                    {downloadError}
                  </motion.p>
                )}

                <button
                  onClick={onSubmit}
                  disabled={!videoUrl || isDownloading}
                  className="relative w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-[20px] font-black text-[1rem] flex items-center justify-center gap-3 disabled:opacity-50 shadow-xl shadow-emerald-500/30 active:scale-[0.98] transition-all overflow-hidden group"
                >
                  {/* Shimmer effect */}
                  <motion.div
                    animate={{
                      left: ['-100%', '200%']
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="absolute top-0 bottom-0 w-1/2 bg-white/20 skew-x-12 -z-0"
                  />

                  <span className="relative z-10 flex items-center gap-3">
                    {isDownloading ? (
                      <>
                        <Loader2 className="animate-spin" size={20} />
                        <span>Processing Content...</span>
                      </>
                    ) : (
                      <>
                        <Plus size={22} strokeWidth={3} />
                        <span>Add Asset Now</span>
                      </>
                    )}
                  </span>
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AddAssetDialog;
