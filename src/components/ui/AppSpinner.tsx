import React from 'react';

interface AppSpinnerProps {
  isLoading: boolean;
  message?: string;
  progressMessages?: string[]; // Array of progress messages
  onCancel?: () => void; // New prop for cancellation handler
}

const AppSpinner: React.FC<AppSpinnerProps> = ({ 
  isLoading, 
  message = 'Loading...',
  progressMessages = [],
  onCancel // New prop
}) => {
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-black/40 dark:bg-black/60 z-50 flex items-center justify-center no-animation">
      <div className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-xl border border-gray-300 dark:border-gray-700 flex flex-col items-center max-w-md w-full no-animation">
        {/* Loading spinner */}
        <div className="w-8 h-8 border-4 border-gray-500 border-t-transparent animate-spin mb-4"></div>
        
        {/* Current operation message */}
        <p className="text-gray-700 dark:text-gray-300 text-lg mb-4">{message}</p>
        
        {/* Progress messages list */}
        {progressMessages.length > 0 && (
          <div className="w-full max-h-60 overflow-y-auto bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 mb-4">
            {progressMessages.map((msg, index) => (
              <div 
                key={index} 
                className={`py-1 px-2 text-sm ${
                  msg.includes('✓') || msg.includes('done') || msg.includes('complete') || msg.includes('applied') || msg.includes('🎯')
                    ? 'text-green-600 dark:text-green-400 font-medium'
                    : msg.includes('❌') || msg.includes('Failed') || msg.includes('Error')
                      ? 'text-red-600 dark:text-red-400'
                    : msg.includes('⚠') || msg.includes('🚨') || msg.includes('revision') || msg.includes('attempt')
                      ? 'text-yellow-600 dark:text-yellow-400'
                    : msg.includes('🔄')
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                {msg}
              </div>
            ))}
          </div>
        )}
        
        {/* Cancel button - only show if onCancel is provided */}
        {onCancel && (
          <button
            onClick={onCancel}
            className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-md text-sm font-medium mt-2 transition-none no-animation"
          >
            Cancel Loading
          </button>
        )}
      </div>
    </div>
  );
};

export default AppSpinner;