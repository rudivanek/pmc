import React from 'react';
import { Lightbulb, Info as InfoIcon } from 'lucide-react';
import { Tooltip } from '../../../ui/Tooltip';
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

      <div className="flex items-center mb-1">
        <label htmlFor="aiPromptButton" className="block text-sm font-medium text-gray-700 dark:text-gray-300"> 
          AI Prompts
        </label>
        <Tooltip content="Use natural language to generate complete form configurations. Describe what you want (e.g., 'a blog post for Twitter marketing, 400 words, target social media managers') and AI will automatically populate all relevant form fields with appropriate settings, saving time and ensuring optimal configurations for your content type.">
          <button type="button" className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <InfoIcon size={14} />
          </button>
        </Tooltip>
      </div>
      
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