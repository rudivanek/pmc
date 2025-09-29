import React from 'react';
import { Search, Lightbulb } from 'lucide-react';
import LoadingSpinner from '../../../ui/LoadingSpinner';
import { Template, User } from '../../../../types';

type AIPromptPlacement = 'right' | 'inline-label' | 'input-suffix' | 'below-full';

interface TemplateLoaderProps {
  templateLoadError: string | null;
  isLoadingTemplates: boolean;
  templateSearchQuery: string;
  setTemplateSearchQuery: (query: string) => void;
  filteredAndGroupedTemplates: Array<{ category: string; templates: Template[] }>;
  selectedTemplateId: string;
  onSelectTemplate: (id: string) => void;
  onOpenTemplateSuggestion: () => void;
  currentUser?: User;

  /** Choose where the AI Prompt button appears (default: 'right') */
  aiPromptPlacement?: AIPromptPlacement;
}

const TemplateLoader: React.FC<TemplateLoaderProps> = ({
  templateLoadError,
  isLoadingTemplates,
  templateSearchQuery,
  setTemplateSearchQuery,
  filteredAndGroupedTemplates,
  selectedTemplateId,
  onSelectTemplate,
  onOpenTemplateSuggestion,
  currentUser,
  aiPromptPlacement = 'right',
}) => {
  const AIPromptButton = (btnClassName = 'w-full'): JSX.Element => (
    <button
      type="button"
      onClick={onOpenTemplateSuggestion}
      className={[
        'bg-white dark:bg-black border border-gray-300 dark:border-gray-700',
        'text-gray-900 dark:text-gray-100 text-xs rounded-lg',
        'focus:ring-primary-500 focus:border-primary-500',
        'px-3 py-2 sm:px-3 sm:py-2.5',
        'hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors',
        'inline-flex items-center justify-center whitespace-nowrap',
        btnClassName,
      ].join(' ')}
      disabled={!currentUser}
      title="Generate template JSON from natural language"
      aria-label="Generate template from AI prompt"
    >
      <Lightbulb size={14} className="mr-1" />
      <span className="hidden sm:inline">AI Prompt</span>
      <span className="sm:hidden">AI</span>
    </button>
  );

  return (
    <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800 rounded-lg">
      {/* Header row (optional inline button at top-right) */}
      <div className="flex items-center justify-between mb-1">
        <label
          htmlFor="templateSelection"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Load Saved Template
          {templateLoadError && (
            <span className="block sm:inline sm:ml-2 text-xs text-red-600 dark:text-red-400">
              {templateLoadError}
            </span>
          )}
        </label>

        {aiPromptPlacement === 'inline-label' && (
          <div className="ml-2 shrink-0 hidden sm:block">{AIPromptButton()}</div>
        )}
      </div>

      {/* Main row */}
      <div
        className={
          aiPromptPlacement === 'right'
            ? // 3 columns: Search | Dropdown | Right card (AI button)
              'grid grid-cols-1 sm:grid-cols-3 gap-3 items-stretch'
            : // 2 columns: Search | Dropdown
              'grid grid-cols-1 sm:grid-cols-2 gap-3 items-stretch'
        }
      >
        {/* Search Input (optionally with input-suffix button) */}
        <div className="min-w-0">
          <div className="relative">
            {/* Leading icon */}
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-gray-500" />
            </div>

            <input
              type="text"
              placeholder="Search templates..."
              value={templateSearchQuery}
              onChange={(e) => setTemplateSearchQuery(e.target.value)}
              className={
                aiPromptPlacement === 'input-suffix'
                  ? // extra right padding to make room for inline button
                    'bg-white dark:bg-black border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-gray-500 focus:border-gray-500 block w-full pl-8 sm:pl-10 pr-28 sm:pr-32 py-2 sm:py-2.5'
                  : 'bg-white dark:bg-black border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-gray-500 focus:border-gray-500 block w-full pl-8 sm:pl-10 pr-2 sm:pr-4 py-2 sm:py-2.5'
              }
              aria-label="Search templates"
            />

            {/* Input-suffix AI button */}
            {aiPromptPlacement === 'input-suffix' && (
              <div className="absolute inset-y-0 right-2 flex items-center">
                {AIPromptButton('px-3 py-1')}
              </div>
            )}
          </div>
        </div>

        {/* Template Dropdown */}
        <div className="min-w-0">
          <select
            id="templateSelection"
            name="templateSelection"
            className="bg-white dark:bg-black border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2 sm:p-2.5 truncate"
            value={selectedTemplateId}
            onChange={(e) => onSelectTemplate(e.target.value)}
            disabled={isLoadingTemplates}
            aria-label="Select a saved template"
          >
            <option value="">
              {isLoadingTemplates ? '— Loading Templates —' : '— Select a Template —'}
            </option>
            {filteredAndGroupedTemplates.map((group) => (
              <optgroup
                key={group.category}
                label={
                  group.category.length > 25
                    ? group.category.substring(0, 25) + '...'
                    : group.category
                }
              >
                {group.templates.map((template) => (
                  <option key={template.id} value={template.id} title={template.template_name}>
                    {template.template_name.length > 35
                      ? template.template_name.substring(0, 35) + '...'
                      : template.template_name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {/* Right-side AI card */}
        {aiPromptPlacement === 'right' && (
          <div className="sm:justify-self-end w-full sm:w-44">
            <div className="h-full p-3 sm:p-4 bg-gray-100 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-800 rounded-lg flex items-end">
              {AIPromptButton('w-full')}
            </div>
          </div>
        )}
      </div>

      {/* Below full-width button */}
      {aiPromptPlacement === 'below-full' && <div className="mt-3">{AIPromptButton('w-full')}</div>}

      {/* Loading + empty states */}
      {isLoadingTemplates && (
        <div className="flex items-center justify-center mt-2 sm:mt-3">
          <LoadingSpinner size="sm" />
          <span className="ml-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            Loading templates...
          </span>
        </div>
      )}

      {templateSearchQuery && filteredAndGroupedTemplates.length === 0 && !isLoadingTemplates && (
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 sm:mt-3">
          No matching templates found.
        </div>
      )}
    </div>
  );
};

export default TemplateLoader;
