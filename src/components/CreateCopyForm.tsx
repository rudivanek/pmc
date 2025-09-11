import React, { useState } from 'react';
import { FormData, PageType, SectionType, ContentQualityScore } from '../types';
import ContentQualityIndicator from './ui/ContentQualityIndicator';
import { Zap, InfoIcon } from 'lucide-react';
import { evaluateContentQuality } from '../services/apiService';
import { Tooltip } from './ui/Tooltip';

interface CreateCopyFormProps {
  formData: FormData;
  handleChange: (e: React.ChangeEvent<HTMLSelectElement | HTMLTextAreaElement>) => void;
  currentUser?: User;
  onGetSuggestion: (fieldType: string) => Promise<void>;
  isLoadingSuggestions: boolean;
  activeSuggestionField: string | null;
  handleScoreChange?: (name: string, score: ContentQualityScore) => void; // New prop
  displayMode: 'all' | 'populated';
  businessDescriptionRef?: React.RefObject<HTMLTextAreaElement>;
}

const PAGE_TYPES = ['Home', 'About', 'Services', 'Contact', 'Product', 'Blog'];

const CreateCopyForm: React.FC<CreateCopyFormProps> = ({ 
  formData, 
  handleChange,
  currentUser,
  onGetSuggestion,
  isLoadingSuggestions,
  activeSuggestionField,
  handleScoreChange,
  displayMode,
  businessDescriptionRef
}) => {
  const [isEvaluatingBusinessDescription, setIsEvaluatingBusinessDescription] = useState(false);

  // Function to count words in a string
  const countWords = (text: string): number => {
    return text.trim() ? text.trim().split(/\s+/).length : 0;
  };
  
  // Get business description word count
  const businessDescriptionWordCount = countWords(formData.businessDescription || '');
  
  // Helper function to check if a field is populated
  const isFieldPopulated = (value: any, fieldType: 'string' | 'select' | 'textarea' = 'string'): boolean => {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    if (typeof value === 'boolean') return value === true;
    if (Array.isArray(value)) return value.length > 0;
    return false;
  };

  // Function to evaluate the business description
  const evaluateBusinessDescription = async () => {
    // Remove the length check to allow evaluation even with shorter content
    if (!formData.businessDescription) {
      return;
    }
    
    setIsEvaluatingBusinessDescription(true);
    
    try {
      const result = await evaluateContentQuality(
        formData.businessDescription,
        'Business Description',
        formData.model,
        currentUser
      );
      
      // Use the dedicated score change handler if available
      if (handleScoreChange) {
        handleScoreChange('businessDescriptionScore', result);
      } else {
        // Fall back to the generic change handler if handleScoreChange isn't provided
        handleChange({ 
          target: { 
            name: 'businessDescriptionScore', 
            value: result 
          } 
        } as any);
      }
    } catch (error) {
      console.error('Error evaluating business description:', error);
    } finally {
      // Always reset the loading state, even if there was an error
      setIsEvaluatingBusinessDescription(false);
    }
  };

  // Check if any field in this form is populated
  const hasPopulatedFields = () => {
    return isFieldPopulated(formData.pageType) ||
           isFieldPopulated(formData.section) ||
           isFieldPopulated(formData.businessDescription);
  };

  // Don't render anything if display mode is 'populated' and no fields are populated
  if (displayMode === 'populated' && !hasPopulatedFields()) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Page Type & Section Type Grid */}
      {(displayMode === 'all' || (isFieldPopulated(formData.pageType) || isFieldPopulated(formData.section))) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Page Type Dropdown */}
          {(displayMode === 'all' || isFieldPopulated(formData.pageType)) && (
            <div>
              <label htmlFor="pageType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Page Type
              </label>
              <select
                id="pageType"
                name="pageType"
                className="bg-white dark:bg-black border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5"
                value={formData.pageType}
                onChange={handleChange}
              >
                {PAGE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Section Type Dropdown */}
          {(displayMode === 'all' || isFieldPopulated(formData.section)) && (
            <div>
              <label htmlFor="section" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Section
              </label>
              <input
                type="text"
                id="section"
                name="section"
                className="bg-white dark:bg-black border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5"
                value={formData.section}
                onChange={handleChange}
                placeholder="e.g., Hero Section, Benefits, Features, FAQ..."
              />
            </div>
          )}
        </div>
      )}

      {/* Business Description */}
      {(displayMode === 'all' || isFieldPopulated(formData.businessDescription)) && (
        <div>
          <div className="flex justify-between items-center mb-1">
            <label htmlFor="businessDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Business Description <span className="text-red-500">*</span>
            </label>
            <Tooltip content="Evaluate the quality of your business description">
              <button
                type="button"
                onClick={evaluateBusinessDescription}
                disabled={isEvaluatingBusinessDescription || !formData.businessDescription}
                className="p-1 text-gray-500 dark:text-gray-400 hover:text-primary-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
              >
                {isEvaluatingBusinessDescription ? (
                  "Evaluating..."
                ) : (
                  <Zap size={20} />
                )}
              </button>
            </Tooltip>
          </div>
          <textarea
            id="businessDescription"
            name="businessDescription"
            rows={6}
            className="bg-white dark:bg-black border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5"
            placeholder="Describe your business, product, or what you want to create..."
            value={formData.businessDescription || ''}
            onChange={handleChange}
            ref={businessDescriptionRef}
          ></textarea>
          
          <div className="flex items-center justify-between mt-1">
            {/* Word count display */}
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {businessDescriptionWordCount} {businessDescriptionWordCount === 1 ? 'word' : 'words'}
            </div>
            
            {/* Content Quality Indicator for Business Description */}
            <ContentQualityIndicator 
              score={formData.businessDescriptionScore} 
              isLoading={isEvaluatingBusinessDescription} 
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateCopyForm;