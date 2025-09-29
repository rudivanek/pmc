import React from 'react';
import { Download, Upload, RefreshCw } from 'lucide-react';

interface HeaderBarProps {
  isExporting: boolean;
  onExport: () => void;
  isImporting: boolean;
  onImport: () => void;
  onClearAll: () => void;
  isClearDisabled: boolean;
}

const HeaderBar: React.FC<HeaderBarProps> = ({
  isExporting,
  onExport,
  isImporting,
  onImport,
  onClearAll,
  isClearDisabled
}) => {
  return (
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white">Copy Maker</h2>
      
      <div className="flex items-center space-x-2">
        <button
          type="button"
          onClick={onExport}
          disabled={isClearDisabled}
          className="flex items-center bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 px-2 py-1.5 rounded-md text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Export form to JSON file"
        >
          {isExporting ? (
            <>
              <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin mr-2"></div>
              <span>Export...</span>
            </>
          ) : (
            <>
              <Download size={14} className="mr-1.5" />
              <span>Export JSON</span>
            </>
          )}
        </button>

        {/* Import JSON Button */}
        <button
          type="button"
          onClick={onImport}
          disabled={isImporting}
          className="flex items-center bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 px-2 py-1.5 rounded-md text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Import form from JSON file"
        >
          {isImporting ? (
            <>
              <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin mr-2"></div>
              <span>Import...</span>
            </>
          ) : (
            <>
              <Upload size={14} className="mr-1.5" />
              <span>Import JSON</span>
            </>
          )}
        </button>

        {/* Clear Button (matched to Export JSON height & styles) */}
        <button
          onClick={onClearAll}
          disabled={isClearDisabled}
          className="flex items-center bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 px-2 py-1.5 rounded-md text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Clear all fields"
        >
          <RefreshCw size={14} className="mr-1.5" />
          <span>Clear All</span>
        </button>
      </div>
    </div>
  );
};

export default HeaderBar;