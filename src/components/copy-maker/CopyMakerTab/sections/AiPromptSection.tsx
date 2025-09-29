import React from 'react';
import { Lightbulb } from 'lucide-react';
import { User } from '../../../../types';

interface AiPromptSectionProps {
  currentUser?: User;
  onOpenTemplateSuggestion: () => void;
}

const AiPromptSection: React.FC<AiPromptSectionProps> = ({
  currentUser,
  onOpenTemplateSuggestion
}) => {
  return (
    <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800 rounded-lg">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
        AI Template Generator
      </label>
      
      <div className="h-full p-3 sm:p-4 bg-gray-100 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-800 rounded-lg flex items-center justify-center">
        <button
          type="button"
          onClick={onOpenTemplateSuggestion}
          className="bg-white dark:bg-black border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 w-full p-2 sm:p-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors inline-flex items-center justify-center whitespace-nowrap"
          disabled={!currentUser}
          title="Generate template JSON from natural language"
        >
          <Lightbulb size={16} className="mr-2" />
          AI Prompt
        </button>
      </div>
    </div>
  );
};

export default AiPromptSection;