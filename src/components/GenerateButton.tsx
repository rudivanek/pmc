import React from 'react';
import { Pen } from 'lucide-react';

interface GenerateButtonProps {
  onClick: () => void;
  isLoading: boolean;
  isDisabled: boolean;
}

const GenerateButton: React.FC<GenerateButtonProps> = ({ onClick, isLoading, isDisabled }) => {
  return (
    <button
      type="button"
      className="w-full bg-gray-900 dark:bg-gray-100 hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-black font-medium border border-gray-300 dark:border-gray-700 text-base px-5 py-3.5 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
      onClick={onClick}
      disabled={isLoading || isDisabled}
    >
      {isLoading ? (
        <>
          Generating...
        </>
      ) : (
        <>
          <Pen size={20} className="mr-2 text-white dark:text-black" />
          {window.location.pathname === '/copy-maker' ? 'Make Copy' : 'Generate Copy'}
        </>
      )}
    </button>
  );
};

export default GenerateButton;