import React from 'react';

const OfflinePage: React.FC = () => {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-extrabold text-sage-dark tracking-tight">Offline</h1>
      <div className="p-8 border-2 border-dashed border-sage-medium rounded-[32px] flex items-center justify-center bg-glass backdrop-blur-zen shadow-zen">
        <p className="text-gray-500 font-medium italic">Downloaded content for offline reading.</p>
      </div>
    </div>
  );
};

export default OfflinePage;
