import React from 'react';
import { Search, Lightbulb } from 'lucide-react';
import LoadingSpinner from '../../../ui/LoadingSpinner';
import { Template, User } from '../../../../types';

interface TemplateLoaderProps {
  templateLoadError: string | null;
  isLoadingTemplates: boolean;
  templateSearchQuery: string;
  setTemplateSearchQuery: (query: string) => void;
  filteredAndGroupedTemplates: Array<{ category: string; templates: Template[] }>;
}

const TemplateLoader: React.FC<TemplateLoaderProps> = ({
  templateLoadError,
  isLoadingTemplates,
  templateSearchQuery,
  setTemplateSearchQuery,
  filteredAndGroupedTemplates,
}) => {
  return (
    <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800 rounded-lg">
      <div className="flex items-center justify-between mb-1">
        <label htmlFor="templateSelection" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Load Saved Template
          {templateLoadError && (
            <span className="block sm:inline sm:ml-2 text-xs text-red-600 dark:text-red-400">{templateLoadError}</span>
          )}
        </label>
      </div>
      
      <div className="flex flex-col gap-3">
        {/* Search Input */}
        <div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-gray-500" />
            </div>
            <input
              type="text"
              placeholder="Search templates..."
              value={templateSearchQuery}
              onChange={(e) => setTemplateSearchQuery(e.target.value)}
              className="bg-white dark:bg-black border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-gray-500 focus:border-gray-500 block w-full pl-10 pr-4 py-2.5"
            />
          </div>
        </div>
        
        {/* Template Dropdown */}
        <div>
          <select
            id="templateSelection"
            name="templateSelection"
            className="bg-white dark:bg-black border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5"
            value={selectedTemplateId}
            onChange={(e) => onSelectTemplate(e.target.value)}
            disabled={isLoadingTemplates}
          >
            <option value="">{isLoadingTemplates ? '— Loading Templates —' : '— Select a Template —'}</option>
            {filteredAndGroupedTemplates.map((group) => (
              <optgroup key={group.category} label={group.category}>
                {group.templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.template_name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
      </div>
      
      {isLoadingTemplates && (
        <div className="flex items-center justify-center mt-3">
          <LoadingSpinner size="sm" />
          <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Loading templates...</span>
        </div>
      )}
      
      {templateSearchQuery && filteredAndGroupedTemplates.length === 0 && !isLoadingTemplates && (
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-3">
          No matching templates found.
        </div>
      )}
    </div>
  );
};

export default TemplateLoader;