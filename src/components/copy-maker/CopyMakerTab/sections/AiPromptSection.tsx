import React from 'react';
import { Lightbulb } from 'lucide-react';
import { User } from '../../../../types';

interface AiPromptSectionProps {
  onOpenTemplateSuggestion: () => void;
  currentUser?: User;
}

const AiPromptSection: React.FC<AiPromptSectionProps> = ({
  onOpenTemplateSuggestion,
  currentUser
}) => {
  return (
    <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-50 dark:bg-gray-900/20 
  border border-gray-200 dark:border-gray-800 rounded-lg 
  max-w-xl">

      <label htmlFor="aiPromptButton" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"> 
        AI Prompts
      </label>
      
      <button
        type="button"
        onClick={onOpenTemplateSuggestion}
        className="w-full bg-white dark:bg-black border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 py-2.5 px-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors inline-flex items-center justify-center"
        disabled={!currentUser}
        title="Generate AI Prompts from natural language"
      >
        <Lightbulb size={16} className="mr-2" />
        <span></span>
      </button>
    </div>
  );
};

export default AiPromptSection;