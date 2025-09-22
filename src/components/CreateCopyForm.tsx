import React from 'react';
import { FormData } from '../types';
import { Tooltip } from './ui/Tooltip';
import { InfoIcon } from 'lucide-react';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { useMemo } from 'react';
import { useInputField } from '../hooks/useInputField';
import { toast } from 'react-hot-toast';
import { isFieldUserModified } from '../utils/formUtils';

// Helper function to check if a field is populated
function isFieldPopulated(value: any): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0 && value.some(item => 
    typeof item === 'string' ? item.trim().length > 0 : Boolean(item)
  );
  if (typeof value === 'boolean') return value === true;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'object' && value !== null) return Object.keys(value).length > 0;
  return false;
}

interface CreateCopyFormProps {
  formData: FormData;
  handleChange: (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement | HTMLTextAreaElement>) => void;
  currentUser?: any;
  onGetSuggestion: (fieldType: string) => Promise<void>;
  isLoadingSuggestions: boolean;
  activeSuggestionField: string | null;
  handleScoreChange?: (name: string, score: any) => void;
  displayMode: 'all' | 'populated';
  businessDescriptionRef?: React.RefObject<HTMLTextAreaElement>;
}

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
  // Initialize locationField using useInputField hook
  const locationField = useInputField({
    value: formData.location || '',
    onChange: (value: string) => {
      // Create proper event structure for handleChange
      const syntheticEvent = {
        target: {
          name: 'location',
          value: value
        }
      } as React.ChangeEvent<HTMLInputElement>;
      handleChange(syntheticEvent);
    }
  });

  // Check if any field in this component is populated
  const hasPopulatedFeatureTogglesFields = () => {
    return formData.generateSeoMetadata ||
           formData.generateScores ||
           formData.generateGeoScore ||
           formData.prioritizeWordCount ||
           formData.adhereToLittleWordCount ||
           formData.forceKeywordIntegration ||
           formData.forceElaborationsExamples ||
           formData.enhanceForGEO ||
           formData.addTldrSummary ||
           isFieldPopulated(formData.geoRegions) ||
           (formData.numUrlSlugs && formData.numUrlSlugs !== 3) ||
           (formData.numMetaDescriptions && formData.numMetaDescriptions !== 3) ||
           (formData.numH1Variants && formData.numH1Variants !== 3) ||
           (formData.numH2Variants && formData.numH2Variants !== 3) ||
           (formData.numH3Variants && formData.numH3Variants !== 3) ||
    const pageTypePopulated = isFieldPopulated(formData.pageType);
    const businessDescriptionPopulated = isFieldPopulated(formData.businessDescription);
    
    console.log('🔍 CreateCopyForm hasPopulatedFields check:', {
      pageType: formData.pageType,
      pageTypePopulated,
      businessDescription: formData.businessDescription?.substring(0, 50) + '...',
      businessDescriptionPopulated,
      displayMode
    });
    
    return pageTypePopulated ||
           businessDescriptionPopulated;
  };

  // Don't render anything if display mode is 'populated' and no fields are populated
  if (displayMode === 'populated' && !hasPopulatedFeatureTogglesFields()) {
    console.log('🔍 CreateCopyForm: Hiding entire form section because displayMode is populated and no fields are populated');
    return null;
  }
  
  // Calculate if the current word count target is "little" (below 100 words)
  const isLittleWordCount = useMemo(() => {
    if (formData.wordCount === 'Custom') {
      return (formData.customWordCount || 0) < 100;
    }
    
    // Check preset ranges
    if (formData.wordCount.includes('Short')) {
      return true; // Short: 50-100 is considered little
    }
    
    return false; // Medium and Long are not considered little
  }, [formData.wordCount, formData.customWordCount]);
  
  // Diagnostic logging to help debug visibility issues
  React.useEffect(() => {
    console.log('FeatureToggles Diagnostic:', {
      wordCount: formData.wordCount,
      customWordCount: formData.customWordCount,
      isLittleWordCount: isLittleWordCount,
      shouldShowLittleWordCountControl: isLittleWordCount
    });
  }, [formData.wordCount, formData.customWordCount, isLittleWordCount]);
  
  return (
    <div className="space-y-6">
      {/* Page Type */}
      <div className={displayMode === 'populated' && !isFieldPopulated(formData.pageType) ? 'hidden' : ''}>
        <div>
          <label htmlFor="pageType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Page Type
          </label>
          <input
            type="text"
            id="pageType"
            name="pageType"
            className="bg-white dark:bg-black border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5"
            value={formData.pageType}
            onChange={handleChange}
            placeholder="e.g., Landing page, About page, Product page..."
          />
        </div>
      </div>




      {/* Business Description */}
      <div className={displayMode === 'populated' && !isFieldPopulated(formData.businessDescription) ? 'hidden' : ''}>
        <div>
          <div className="mb-1">
            <label htmlFor="businessDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Business Description <span className="text-red-500">*</span>
            </label>
          </div>
          <textarea
            id="businessDescription"
            name="businessDescription"
            rows={8}
            required
            className="bg-white dark:bg-black border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5"
            placeholder="Describe your business, product, or service..."
            value={formData.businessDescription || ''}
            onChange={handleChange}
            ref={businessDescriptionRef}
          ></textarea>
        </div>
      </div>
    </div>
  );
};

export default CreateCopyForm;