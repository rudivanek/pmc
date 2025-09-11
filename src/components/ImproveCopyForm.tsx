import React, { useState } from 'react';
import { FormData, SectionType, ContentQualityScore } from '../types';
import { SECTION_TYPES } from '../constants';
import ContentQualityIndicator from './ui/ContentQualityIndicator';
import { Zap } from 'lucide-react';
import { evaluateContentQuality } from '../services/apiService';
import { Tooltip } from './ui/Tooltip';

interface ImproveCopyFormProps {
  formData: FormData;
  handleChange: (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement | HTMLSelectElement>) => void;
  currentUser?: any;
  onGetSuggestion: (fieldType: string) => Promise<void>;
  isLoadingSuggestions: boolean;
  activeSuggestionField: string | null;
  handleScoreChange?: (name: string, score: ContentQualityScore) => void;
  displayMode: 'all' | 'populated';
  originalCopyRef?: React.RefObject<HTMLTextAreaElement>;
}

const ImproveCopyForm: React.FC<ImproveCopyFormProps> = ({
  formData,
  handleChange,
  currentUser,
  onGetSuggestion,
  isLoadingSuggestions,
  activeSuggestionField,
  handleScoreChange,
  displayMode,
  originalCopyRef
}) => {
  const [isEvaluatingContent, setIsEvaluatingContent] = useState(false);

  // Function to count words in a string
  const countWords = (text: string): number => {
    return text.trim() ? text.trim().split(/\s+/).length : 0;
  };
  
  // Get original copy word count
  const originalCopyWordCount = countWords(formData.originalCopy || '');

  // Helper function to check if a field is populated
  const isFieldPopulated = (value: any): boolean => {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    return false;
  };

  // Check if any field in this form is populated
  const hasPopulatedFields = () => {
    return isFieldPopulated(formData.section) ||
           isFieldPopulated(formData.originalCopy) ||
           isFieldPopulated(formData.excludedTerms);
  };

  // Don't render anything if display mode is 'populated' and no fields are populated
  if (displayMode === 'populated' && !hasPopulatedFields()) {
    return null;
  }

  // Function to evaluate the original copy
  const evaluateOriginalCopy = async () => {
    if (!formData.originalCopy) {
      return;
    }
    
    setIsEvaluatingContent(true);
    
    try {
      const result = await evaluateContentQuality(
        formData.originalCopy,
        'Original Copy',
        formData.model,
        currentUser
      );
      
      if (handleScoreChange) {
        handleScoreChange('originalCopyScore', result);
      }
    } catch (error) {
      console.error('Error evaluating original copy:', error);
    } finally {
      setIsEvaluatingContent(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Section Input */}
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
            value={formData.section || ''}
            onChange={handleChange}
            placeholder="e.g., Hero Section, Benefits, Features, FAQ..."
          />
        </div>
      )}

      {/* Original Copy */}
      {(displayMode === 'all' || isFieldPopulated(formData.originalCopy)) && (
        <div>
          <div className="flex justify-between items-center mb-1">
            <label htmlFor="originalCopy" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Original Copy or Describe what you want to achieve <span className="text-red-500">*</span>
            </label>
            <Tooltip content="Evaluate the quality of your original copy">
              <button
                type="button"
                onClick={evaluateOriginalCopy}
                disabled={isEvaluatingContent || !formData.originalCopy}
                className="p-1 text-gray-500 dark:text-gray-400 hover:text-primary-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isEvaluatingContent ? (
                  "Evaluating..."
                ) : (
                  <Zap size={20} />
                )}
              </button>
            </Tooltip>
          </div>
          <textarea
            id="originalCopy"
            name="originalCopy"
            rows={8}
            required
            className="bg-white dark:bg-black border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5"
            placeholder="Paste your copy or describe what you want to achieve..."
            value={formData.originalCopy || ''}
            onChange={handleChange}
            ref={originalCopyRef}
          />
          
          <div className="flex items-center justify-between mt-1">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {originalCopyWordCount} {originalCopyWordCount === 1 ? 'word' : 'words'}
            </div>
            
            <ContentQualityIndicator 
              score={formData.originalCopyScore} 
              isLoading={isEvaluatingContent}
            />
          </div>
        </div>
      )}

      {/* Exclude Specific Terms */}
      {(displayMode === 'all' || isFieldPopulated(formData.excludedTerms)) && (
        <div>
          <label htmlFor="excludedTerms" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Exclude specific terms from output
          </label>
          <textarea
            id="excludedTerms"
            name="excludedTerms"
            rows={2}
            className="bg-white dark:bg-black border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5"
            placeholder="e.g., DeepSeek V3, GPT-4o, competitor names..."
            value={formData.excludedTerms || ''}
            onChange={handleChange}
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            List words or brand names you don't want the AI to include in the generated copy, separated by commas
          </p>
        </div>
      )}
    </div>
  );
};

export default CreateCopyForm;