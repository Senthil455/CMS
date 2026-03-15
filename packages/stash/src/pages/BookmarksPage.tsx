import React from 'react';

const BookmarksPage: React.FC = () => {
  return (
    <div className="flex flex-col gap-4">
      <div className="p-8 border-2 border-dashed border-sage-medium rounded-[32px] flex items-center justify-center bg-glass backdrop-blur-zen shadow-zen">
        <p className="text-gray-500 font-medium italic">Your saved content will appear here.</p>
      </div>
    </div>

  );
};

export default BookmarksPage;
