import React, { useState } from 'react';
import { FormState, Template } from '../types';
import { DEFAULT_FORM_STATE } from '../constants';
import { RefreshCw, Lightbulb, AlertCircle } from 'lucide-react';
import { Search } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Tooltip } from './ui/Tooltip';
import { useAuth } from '../hooks/useAuth';
import { getTemplates } from '../services/supabaseClient';

// Interface for grouped templates structure
interface TemplateGroup {
  category: string;
  options: {
    id: string;
    label: string;
    data: Partial<FormState>;
  }[];
}

interface TemplateSelectorProps {
  formState: FormState;
  setFormState: (state: FormState) => void;
  setDisplayMode: (mode: 'all' | 'populated') => void;
  loadFormStateFromTemplate: (template: Template) => void;
}

// Default template categories and options (fallback if no database templates)
const DEFAULT_TEMPLATE_GROUPS: TemplateGroup[] = [
  {
    category: 'Quick Start',
    options: [
      {
        id: 'homepage-hero',
        label: 'Homepage Hero Section',
        data: {
          pageType: 'Homepage',
          section: 'Hero Section',
          wordCount: 'Custom',
          customWordCount: 150,
          tone: 'Bold',
          keyMessage: 'What makes your business unique?',
          callToAction: 'Get started today',
          desiredEmotion: 'Confidence'
        }
      },
      {
        id: 'product-description',
        label: 'Product Description',
        data: {
          pageType: 'Other',
          wordCount: 'Custom',
          customWordCount: 200,
          tone: 'Persuasive',
          keyMessage: 'Why this product solves your problem',
          callToAction: 'Buy now'
        }
      }
    ]
  }
];

const TemplateSelector: React.FC<TemplateSelectorProps> = ({ 
  formState, 
  setFormState, 
  setDisplayMode,
  loadFormStateFromTemplate 
}) => {
  const { currentUser } = useAuth();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [templateGroups, setTemplateGroups] = useState<TemplateGroup[]>(DEFAULT_TEMPLATE_GROUPS);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [templateError, setTemplateError] = useState<string | null>(null);
  const [useHardcodedFallback, setUseHardcodedFallback] = useState(false);
  
  // Filtered template groups based on search query
  const filteredTemplateGroups = React.useMemo(() => {
    if (!searchQuery.trim()) {
      return templateGroups;
    }
    
    const query = searchQuery.toLowerCase();
    return templateGroups.map(group => ({
      ...group,
      options: group.options.filter(option => 
        option.label.toLowerCase().includes(query) ||
        group.category.toLowerCase().includes(query) ||
        JSON.stringify(option.data).toLowerCase().includes(query)
      )
    })).filter(group => group.options.length > 0);
  }, [templateGroups, searchQuery]);

  // Fetch templates from database on component mount
  React.useEffect(() => {
    const fetchTemplates = async () => {
      if (!currentUser?.id) {
        // If no user, use hardcoded templates
        setTemplateGroups(DEFAULT_TEMPLATE_GROUPS);
        return;
      }

      setIsLoadingTemplates(true);
      setTemplateError(null);

      try {
        const { data, error } = await getTemplates(currentUser.id);

        if (error) {
          throw error;
        }

        if (data && data.length > 0) {
          // Convert database format to grouped format
          const groupedFromDatabase = convertDatabaseToGroupedFormat(data);
          setTemplateGroups(groupedFromDatabase);
          setUseHardcodedFallback(false);
        } else {
          // If no data, use hardcoded fallback
          setTemplateGroups(DEFAULT_TEMPLATE_GROUPS);
          setUseHardcodedFallback(true);
        }
      } catch (error) {
        console.error('Error fetching templates from database:', error);
        setTemplateError('Failed to load templates from database');
        // Use hardcoded fallback on error
        setTemplateGroups(DEFAULT_TEMPLATE_GROUPS);
        setUseHardcodedFallback(true);
      } finally {
        setIsLoadingTemplates(false);
      }
    };

    fetchTemplates();
  }, [currentUser?.id]);

  // Convert database templates to grouped format
  const convertDatabaseToGroupedFormat = (templates: Template[]): TemplateGroup[] => {
    const groups: Record<string, TemplateGroup> = {};

    templates.forEach(template => {
      const category = template.category || 'User Templates';
      
      if (!groups[category]) {
        groups[category] = {
          category,
          options: []
        };
      }

      groups[category].options.push({
        id: template.id!,
        label: template.template_name,
        data: template.form_state_snapshot || template // Use form_state_snapshot or fall back to template fields
      });
    });

    return Object.values(groups);
  };

  // Handle template refresh
  const handleRefreshTemplates = async () => {
    if (!currentUser?.id) return;

    setIsLoadingTemplates(true);
    setTemplateError(null);

    try {
      const { data, error } = await getTemplates(currentUser.id);

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        const groupedFromDatabase = convertDatabaseToGroupedFormat(data);
        setTemplateGroups(groupedFromDatabase);
        setUseHardcodedFallback(false);
        toast.success('Templates refreshed from database');
      } else {
        setTemplateGroups(DEFAULT_TEMPLATE_GROUPS);
        setUseHardcodedFallback(true);
        toast.info('No database templates found, using defaults');
      }
    } catch (error) {
      console.error('Error refreshing templates:', error);
      setTemplateError('Failed to refresh templates');
      setTemplateGroups(DEFAULT_TEMPLATE_GROUPS);
      setUseHardcodedFallback(true);
      toast.error('Failed to refresh templates, using defaults');
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  const handleTemplateSelection = (templateId: string) => {
    if (!templateId) {
      setSelectedTemplateId('');
      return;
    }

    // Find the template across all groups
    let selectedTemplate = null;
    for (const group of templateGroups) {
      const found = group.options.find(template => template.id === templateId);
      if (found) {
        selectedTemplate = found;
        break;
      }
    }
    
    if (!selectedTemplate) {
      console.error('Template not found:', templateId);
      return;
    }

    // Create a template object for loadFormStateFromTemplate
    const templateObject: Template = {
      id: templateId,
      user_id: currentUser?.id || '',
      template_name: selectedTemplate.label,
      template_type: 'create',
      language: 'English',
      tone: 'Professional',
      word_count: 'Medium: 100-200',
      form_state_snapshot: selectedTemplate.data
    };

    // Use the existing template loading function
    loadFormStateFromTemplate(templateObject);
    setSelectedTemplateId(templateId);
    
    // Switch to populated view when template is loaded
    setDisplayMode('populated');
    
    toast.success(`Applied "${selectedTemplate.label}" template`);
  };

  const handleClearTemplate = () => {
    // Reset to default form state but preserve runtime states
    const clearedFormState: FormState = {
      ...DEFAULT_FORM_STATE,
      // Preserve runtime states
      isLoading: formState.isLoading,
      isEvaluating: formState.isEvaluating,
      generationProgress: formState.generationProgress,
      copyResult: formState.copyResult,
      promptEvaluation: formState.promptEvaluation
    };

    setFormState(clearedFormState);
    setSelectedTemplateId('');
    
    // Switch back to all fields view when cleared
    setDisplayMode('all');
    
    toast.success('All fields cleared');
  };

  return (
    <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800 rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex-1 mr-4 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center">
              <label htmlFor="templateSelection" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Load Template (optional){useHardcodedFallback && (
                  <span className="ml-2 text-xs text-gray-600 dark:text-gray-400">(using defaults)</span>
                )}
              </label>
            </div>
            
            {currentUser && (
              <div className="flex items-center space-x-2">
                {templateError && (
                  <Tooltip content={templateError}>
                    <AlertCircle size={14} className="text-gray-500" />
                  </Tooltip>
                )}
                <button
                  type="button"
                  onClick={handleRefreshTemplates}
                  className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center"
                  disabled={isLoadingTemplates}
                >
                  <RefreshCw size={12} className={`mr-1 ${isLoadingTemplates ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
            )}
          </div>
          
          {/* Template Selection Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {/* Search Input */}
            <div className="lg:col-span-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={16} className="text-gray-500" />
                </div>
                <input
                  type="text"
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-white dark:bg-black border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-gray-500 focus:border-gray-500 block w-full pl-10 pr-4 py-2.5"
                />
              </div>
            </div>
            
            {/* Template Dropdown */}
            <div className="lg:col-span-2">
              <select
                id="templateSelection"
                name="templateSelection"
                className="bg-white dark:bg-black border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5"
                value={selectedTemplateId}
                onChange={(e) => handleTemplateSelection(e.target.value)}
                disabled={isLoadingTemplates}
              >
                <option value="">{isLoadingTemplates ? '— Loading Templates —' : '— Select a Template —'}</option>
                {filteredTemplateGroups.map((group) => (
                  <optgroup key={group.category} label={group.category}>
                    {group.options.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          </div>
          
          {/* Search Results Info */}
          {searchQuery && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {filteredTemplateGroups.reduce((total, group) => total + group.options.length, 0)} template(s) found
              {filteredTemplateGroups.length === 0 && (
                <span className="text-gray-600 dark:text-gray-400"> - Try different keywords</span>
              )}
            </div>
          )}
          
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Choose a template to automatically fill form fields with saved configurations
            {!currentUser && ' (Login to access custom templates)'}
          </p>
        </div>
        
        <div className="flex-shrink-0">
          <Tooltip content="Reset all form fields to empty state">
            <button
              type="button"
              onClick={handleClearTemplate}
              className="flex items-center justify-center bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 w-10 h-10 rounded-md transition-colors"
              disabled={formState.isLoading}
              title="Clear Template"
            >
              <RefreshCw size={16} />
            </button>
          </Tooltip>
        </div>
      </div>
    </div>
  );
};

export default TemplateSelector;