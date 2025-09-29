import React from 'react';

const EmptyState: React.FC = () => {
  return (
    <div className="bg-white dark:bg-black border border-gray-300 dark:border-gray-800 rounded-lg p-3 sm:p-6 mx-2 sm:mx-4 lg:mx-24 text-center text-gray-500 dark:text-gray-400">
      <div className="text-lg font-medium mb-2">No content generated yet</div>
      <p className="text-sm">Fill out the form and click "Make Copy" to get started</p>
    </div>
  );
};

export default EmptyState;