import React, { useState, useEffect, useRef } from 'react';
import { FormState } from '../types';
import { LANGUAGES, TONES, WORD_COUNTS, OUTPUT_STRUCTURE_OPTIONS, INDUSTRY_NICHE_CATEGORIES, READER_FUNNEL_STAGES, PREFERRED_WRITING_STYLES, LANGUAGE_STYLE_CONSTRAINTS } from '../constants';
import { PlusCircle, X, Zap, Info as InfoIcon } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useInputField } from '../hooks/useInputField';
import DraggableStructuredInput from './ui/DraggableStructuredInput';
import TagInput from './ui/TagInput';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import SuggestionButton from './ui/SuggestionButton';
import ContentQualityIndicator from './ui/ContentQualityIndicator';
import { Tooltip } from './ui/Tooltip';
import CategoryTagsInput from './ui/CategoryTagsInput';
import { calculateTargetWordCount } from '../services/api/utils';
import { isFieldPopulated, isFieldUserModified, hasPopulatedCompetitorUrls } from '../utils/formUtils';

interface SharedInputsProps {
  formData: FormState;
 handleChange: (name: string, value: any) => void;
  handleToggle: (e: React.ChangeEvent<HTMLInputElement>) => void;
  currentUser?: any;
  onGetSuggestion: (fieldType: string) => Promise<void>;
  isLoadingSuggestions: boolean;
  activeSuggestionField: string | null;
  isSmartMode: boolean; // Add prop for Smart Mode
  setFormState: (formState: FormState) => void;
  displayMode: 'all' | 'populated';
}

const SharedInputs: React.FC<SharedInputsProps> = ({ 
  formData, 
  handleChange,
  handleToggle,
  currentUser,
  onGetSuggestion,
  isLoadingSuggestions,
  activeSuggestionField,
  isSmartMode, // Add isSmartMode prop
  setFormState,
  displayMode
}) => {
  // Use input field hooks for competitor URLs
  const competitorUrl1Field = useInputField({
    value: formData.competitorUrls[0] || '',
    onChange: (value) => {
      const newUrls = [...formData.competitorUrls];
      newUrls[0] = value;
      handleChange({
        target: { name: 'competitorUrls', value: newUrls }
      } as unknown as React.ChangeEvent<HTMLInputElement>);
    }
  });
  
  const competitorUrl2Field = useInputField({
    value: formData.competitorUrls[1] || '',
    onChange: (value) => {
      const newUrls = [...formData.competitorUrls];
      newUrls[1] = value;
      handleChange({
        target: { name: 'competitorUrls', value: newUrls }
      } as unknown as React.ChangeEvent<HTMLInputElement>);
    }
  });
  
  const competitorUrl3Field = useInputField({
    value: formData.competitorUrls[2] || '',
    onChange: (value) => {
      const newUrls = [...formData.competitorUrls];
      newUrls[2] = value;
      handleChange({
        target: { name: 'competitorUrls', value: newUrls }
      } as unknown as React.ChangeEvent<HTMLInputElement>);
    }
  });

  // Use input field hooks for new fields
  const competitorCopyTextField = useInputField({
    value: formData.competitorCopyText || '',
    onChange: (value) => handleChange({ 
      target: { name: 'competitorCopyText', value } 
    } as any)
  });

  const targetAudiencePainPointsField = useInputField({
    value: formData.targetAudiencePainPoints || '',
    onChange: (value) => handleChange({ 
      target: { name: 'targetAudiencePainPoints', value } 
    } as any)
  });

  // Use input field hook for location
  const locationField = useInputField({
    value: formData.location || '',
    onChange: (value) => handleChange({ 
      target: { name: 'location', value } 
    } as any)
  });

  // Use input field hook for geoRegions
  const geoRegionsField = useInputField({
    value: formData.geoRegions || '',
    onChange: (value) => handleChange({ 
      target: { name: 'geoRegions', value } 
    } as any)
  });

  // Moved fields from CreateCopyForm and ImproveCopyForm
  const targetAudienceField = useInputField({
    value: formData.targetAudience || '',
    onChange: (value) => handleChange({ target: { name: 'targetAudience', value } } as any)
  });
  
  const keyMessageField = useInputField({
    value: formData.keyMessage || '',
    onChange: (value) => handleChange({ target: { name: 'keyMessage', value } } as any)
  });
  
  const desiredEmotionField = useInputField({
    value: formData.desiredEmotion || '',
    onChange: (value) => handleChange({ target: { name: 'desiredEmotion', value } } as any)
  });
  
  const callToActionField = useInputField({
    value: formData.callToAction || '',
    onChange: (value) => handleChange({ target: { name: 'callToAction', value } } as any)
  });
  
  const brandValuesField = useInputField({
    value: formData.brandValues || '',
    onChange: (value) => handleChange({ target: { name: 'brandValues', value } } as any)
  });
  
  const keywordsField = useInputField({
    value: formData.keywords || '',
    onChange: (value) => handleChange({ target: { name: 'keywords', value } } as any)
  });
  
  const contextField = useInputField({
    value: formData.context || '',
    onChange: (value) => handleChange({ target: { name: 'context', value } } as any)
  });

  // Use the input field hook for the custom word count field
  const customWordCountField = useInputField({
    value: formData.customWordCount?.toString() || '',
    onChange: (value) => handleChange({ 
      target: { 
        name: 'customWordCount', 
        value: value ? parseInt(value) : 150 
      } 
    } as any)
  });

  // Handler for output structure change
  const handleStructureChange = (values: any) => {
    console.log('🚀 handleStructureChange called with:', values);
   handleChange('outputStructure', values);
    console.log('🚀 handleChange called with outputStructure');
  };

  // Handle industry niche change
  const handleIndustryNicheChange = (value: string) => {
   handleChange('industryNiche', value);
  };

  // Handle reader funnel stage change
  const handleReaderFunnelStageChange = (value: string) => {
   handleChange('readerFunnelStage', value);
  };

  // Handle preferred writing style change
  const handlePreferredWritingStyleChange = (value: string) => {
   handleChange('preferredWritingStyle', value);
  };

  // Handle tone level change
  const handleToneLevelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleChange({
      target: { name: 'toneLevel', value: parseInt(e.target.value) }
    } as React.ChangeEvent<HTMLInputElement>);
  };

  // Handle language style constraints change
  const handleLanguageStyleConstraintChange = (constraint: string) => {
    const constraints = formData.languageStyleConstraints || [];
    const updatedConstraints = constraints.includes(constraint)
      ? constraints.filter(c => c !== constraint)
      : [...constraints, constraint];
    
    handleChange({
      target: { name: 'languageStyleConstraints', value: updatedConstraints }
    } as unknown as React.ChangeEvent<HTMLInputElement>);
  };

  // Calculate the total word count from structure elements
  const totalStructureWordCount = React.useMemo(() => {
    if (!formData.outputStructure || formData.outputStructure.length === 0) {
      return 0;
    }
    
    return formData.outputStructure.reduce((sum, element) => {
      return sum + (element.wordCount || 0);
    }, 0);
  }, [formData.outputStructure]);
  
  // Calculate the effective target word count using the shared utility function
  const effectiveTargetWordCount = calculateTargetWordCount(formData).target;

  // Check if any field in the Copy Targeting section is populated
  const hasPopulatedCopyTargetingFields = () => {
    return isFieldPopulated(formData.industryNiche) ||
           isFieldPopulated(formData.targetAudience) ||
           isFieldPopulated(formData.readerFunnelStage) ||
           hasPopulatedCompetitorUrls(formData.competitorUrls) ||
           isFieldPopulated(formData.targetAudiencePainPoints) ||
           isFieldPopulated(formData.competitorCopyText);
  };

  // Check if any field in the Strategic Messaging section is populated
  const hasPopulatedStrategicMessagingFields = () => {
    return isFieldPopulated(formData.keyMessage) ||
           isFieldPopulated(formData.desiredEmotion) ||
           isFieldPopulated(formData.callToAction) ||
           isFieldPopulated(formData.brandValues) ||
           isFieldPopulated(formData.keywords) ||
           isFieldPopulated(formData.context);
  };

  // Check if any field in the Tone & Style section is populated
  const hasPopulatedToneAndStyleFields = () => {
    return isFieldUserModified('language', formData.language) ||
           isFieldUserModified('tone', formData.tone) ||
           isFieldUserModified('wordCount', formData.wordCount) ||
           isFieldPopulated(formData.customWordCount) ||
           isFieldUserModified('toneLevel', formData.toneLevel) ||
           isFieldPopulated(formData.preferredWritingStyle) ||
           isFieldPopulated(formData.languageStyleConstraints) ||
           isFieldPopulated(formData.outputStructure);
  };

  return (
    <div className="space-y-6">
      {/* COPY TARGETING SECTION */}
      <div className={`${isSmartMode ? 'hidden' : ''} ${displayMode === 'populated' && !hasPopulatedCopyTargetingFields() ? 'hidden' : ''}`}>
        <Tooltip content="Describe your target audience and competitive landscape. The more precise this is, the better your copy will resonate with readers." delayDuration={300}>
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-4 pb-2 border-b border-gray-300 dark:border-gray-700 flex items-center">
            <div className="w-1 h-5 bg-primary-500 mr-2"></div>
            Copy Targeting
          </h3>
        </Tooltip>
        
        {/* Industry/Niche - Enhanced field with categories */}
        <div className={displayMode === 'populated' && !isFieldPopulated(formData.industryNiche) ? 'hidden' : ''}>
          <div className="flex justify-between items-center mb-1">
            <label htmlFor="industryNiche" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Industry/Niche
            </label>
            <div className="flex items-center">
              <Tooltip content="Select your industry or add a custom one to ensure the AI uses appropriate terminology, industry-specific language, and relevant examples. This helps generate copy that resonates with your specific market and demonstrates industry expertise.">
                <button type="button" className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  <InfoIcon size={14} />
                </button>
              </Tooltip>
            <SuggestionButton
              fieldType="industryNiche"
              businessDescription={formData.tab === 'create' ? formData.businessDescription || '' : formData.originalCopy || ''}
              onGetSuggestion={onGetSuggestion}
              isLoading={isLoadingSuggestions && activeSuggestionField === 'industryNiche'}
            />
            </div>
          </div>
          <CategoryTagsInput
            id="industryNiche"
            name="industryNiche"
            placeholder="Select industry/niche..."
            value={formData.industryNiche || ''}
            onChange={handleIndustryNicheChange}
            categories={INDUSTRY_NICHE_CATEGORIES}
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Select your industry or add a custom one to get more targeted copy
          </p>
        </div>

        {/* Target Audience - Moved from CreateCopyForm/ImproveCopyForm */}
        <div className={displayMode === 'populated' && !isFieldPopulated(formData.targetAudience) ? 'hidden' : ''}>
          <div className="flex justify-between items-center mb-1">
            <label htmlFor="targetAudience" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Target Audience
            </label>
            <div className="flex items-center">
              <Tooltip content="Define your ideal readers with specific demographics, psychographics, and pain points. Include age ranges, job titles, company size, challenges they face, and what motivates them. The more specific this is, the more targeted and compelling your copy will be.">
                <button type="button" className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  <InfoIcon size={14} />
                </button>
              </Tooltip>
            <SuggestionButton
              fieldType="targetAudience"
              businessDescription={formData.tab === 'create' ? formData.businessDescription || '' : formData.originalCopy || ''}
              onGetSuggestion={onGetSuggestion}
              isLoading={isLoadingSuggestions && activeSuggestionField === 'targetAudience'}
              currentUser={currentUser}
            />
            </div>
          </div>
          <textarea
            id="targetAudience"
            name="targetAudience"
            rows={3}
            className="bg-white dark:bg-black border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5"
            placeholder="Describe who this copy is targeting (age, interests, pain points, etc.)..."
            value={targetAudienceField.inputValue}
            onChange={targetAudienceField.handleChange}
            onBlur={targetAudienceField.handleBlur}
          ></textarea>
        </div>

        {/* Reader's Stage in Funnel */}
        <div className={displayMode === 'populated' && !isFieldPopulated(formData.readerFunnelStage) ? 'hidden' : ''}>
          <div className="flex justify-between items-center mb-1">
            <label htmlFor="readerFunnelStage" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Reader's Stage in Funnel
            </label>
            <div className="flex items-center">
              <Tooltip content="Where your audience is in their buyer's journey affects messaging approach and urgency. Awareness stage needs educational content, Consideration requires comparison and benefits, Decision needs urgency and clear CTAs, Retention focuses on value reinforcement.">
                <button type="button" className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  <InfoIcon size={14} />
                </button>
              </Tooltip>
            <SuggestionButton
              fieldType="readerFunnelStage"
              businessDescription={formData.tab === 'create' ? formData.businessDescription || '' : formData.originalCopy || ''}
              onGetSuggestion={onGetSuggestion}
              isLoading={isLoadingSuggestions && activeSuggestionField === 'readerFunnelStage'}
            />
            </div>
          </div>
          <TagInput
            id="readerFunnelStage"
            name="readerFunnelStage"
            placeholder="e.g., Awareness, Consideration, Decision..."
            value={formData.readerFunnelStage || ''}
            onChange={handleReaderFunnelStageChange}
          />
        </div>
        
        {/* Competitor URLs */}
        <div className={displayMode === 'populated' && !hasPopulatedCompetitorUrls(formData.competitorUrls) ? 'hidden' : ''}>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Competitor URLs (Optional)
          </label>
          <Tooltip content="Up to 3 competitor website URLs for the AI to analyze for differentiation opportunities. The AI will consider their messaging approach and create copy that stands out while addressing similar audience needs.">
            <button type="button" className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <InfoIcon size={14} />
            </button>
          </Tooltip>
          <div className="space-y-2">
            <input
              id="competitorUrl1"
              type="url"
              className="bg-white dark:bg-black border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5"
              placeholder="https://competitor1.com"
              value={competitorUrl1Field.inputValue}
              onChange={competitorUrl1Field.handleChange}
              onBlur={competitorUrl1Field.handleBlur}
            />
            <input
              id="competitorUrl2"
              type="url"
              className="bg-white dark:bg-black border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5"
              placeholder="https://competitor2.com"
              value={competitorUrl2Field.inputValue}
              onChange={competitorUrl2Field.handleChange}
              onBlur={competitorUrl2Field.handleBlur}
            />
            <input
              id="competitorUrl3"
              type="url"
              className="bg-white dark:bg-black border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5"
              placeholder="https://competitor3.com"
              value={competitorUrl3Field.inputValue}
              onChange={competitorUrl3Field.handleChange}
              onBlur={competitorUrl3Field.handleBlur}
            />
          </div>
        </div>

        {/* Target Audience Pain Points - With suggestion button */}
        <div className={displayMode === 'populated' && !isFieldPopulated(formData.targetAudiencePainPoints) ? 'hidden' : ''}>
          <div className="flex justify-between items-center mb-1">
            <label htmlFor="targetAudiencePainPoints" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Target Audience Pain Points
            </label>
            <div className="flex items-center">
              <Tooltip content="Specific problems or challenges your audience faces that your solution addresses. This helps the AI create empathetic, problem-focused copy that connects emotionally and positions your solution as the answer to their struggles.">
                <button type="button" className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  <InfoIcon size={14} />
                </button>
              </Tooltip>
            <SuggestionButton
              fieldType="targetAudiencePainPoints"
              businessDescription={formData.tab === 'create' ? formData.businessDescription || '' : formData.originalCopy || ''}
              onGetSuggestion={onGetSuggestion}
              isLoading={isLoadingSuggestions && activeSuggestionField === 'targetAudiencePainPoints'}
            />
            </div>
          </div>
          <textarea
            id="targetAudiencePainPoints"
            name="targetAudiencePainPoints"
            rows={4}
            className="bg-white dark:bg-black border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5"
            placeholder="List any specific pain points or challenges that the target audience likely faces..."
            value={targetAudiencePainPointsField.inputValue}
            onChange={targetAudiencePainPointsField.handleChange}
            onBlur={targetAudiencePainPointsField.handleBlur}
          ></textarea>
        </div>

        {/* Competitor Copy (Text) - HIDE in Smart Mode */}
        <div className={`${isSmartMode ? 'hidden' : ''} ${displayMode === 'populated' && !isFieldPopulated(formData.competitorCopyText) ? 'hidden' : ''}`}>
          <div>
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="competitorCopyText" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Competitor Copy (Text)
              </label>
              <div className="flex items-center">
                <Tooltip content="Paste competitor copy text that you want to outperform or differentiate from. The AI will analyze their approach and create superior copy that addresses the same audience needs but with better messaging, stronger benefits, and more compelling calls to action.">
                  <button type="button" className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <InfoIcon size={14} />
                  </button>
                </Tooltip>
              <SuggestionButton
                fieldType="competitorCopyText"
                businessDescription={formData.tab === 'create' ? formData.businessDescription || '' : formData.originalCopy || ''}
                onGetSuggestion={onGetSuggestion}
                isLoading={isLoadingSuggestions && activeSuggestionField === 'competitorCopyText'}
                currentUser={currentUser}
              />
              </div>
            </div>
            <textarea
              id="competitorCopyText"
              name="competitorCopyText"
              rows={4}
              className="bg-white dark:bg-black border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5"
              placeholder="Paste the copy you want to outperform..."
              value={competitorCopyTextField.inputValue}
              onChange={competitorCopyTextField.handleChange}
              onBlur={competitorCopyTextField.handleBlur}
            ></textarea>
          </div>
        </div>
      </div>

      {/* TONE & STYLE SECTION */}
      <div className={displayMode === 'populated' && !hasPopulatedToneAndStyleFields() ? 'hidden' : ''}>
        <Tooltip content="Control the voice, tone, and formatting of your copy to match your brand or campaign goals." delayDuration={300}>
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-4 pb-2 border-b border-gray-300 dark:border-gray-700 flex items-center">
            <div className="w-1 h-5 bg-primary-500 mr-2"></div>
            Tone & Style
          </h3>
        </Tooltip>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {/* Language Dropdown */}
          <div className={displayMode === 'populated' && !isFieldUserModified('language', formData.language) ? 'hidden' : ''}>
            <label htmlFor="language" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Language
            </label>
            <Tooltip content="Choose from 6 supported languages for content generation. The AI will generate copy in the selected language with appropriate cultural nuances, idioms, and communication styles that resonate with native speakers.">
              <button type="button" className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <InfoIcon size={14} />
              </button>
            </Tooltip>
            <select
              id="language"
              name="language"
              className="bg-white dark:bg-black border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5"
              value={formData.language}
              onChange={handleChange}
            >
              {LANGUAGES.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
          </div>

          {/* Tone Dropdown */}
          <div className={displayMode === 'populated' && !isFieldUserModified('tone', formData.tone) ? 'hidden' : ''}>
            <label htmlFor="tone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tone
            </label>
            <Tooltip content="Overall writing style that influences vocabulary choice, sentence structure, and communication approach. Professional uses formal language, Friendly is approachable and warm, Bold is confident and direct, Minimalist is clean and essential.">
              <button type="button" className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <InfoIcon size={14} />
              </button>
            </Tooltip>
            <select
              id="tone"
              name="tone"
              className="bg-white dark:bg-black border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5"
              value={formData.tone}
              onChange={handleChange}
            >
              {TONES.map((tone) => (
                <option key={tone} value={tone}>
                  {tone}
                </option>
              ))}
            </select>
          </div>

          {/* Word Count Dropdown */}
          <div className={displayMode === 'populated' && !isFieldUserModified('wordCount', formData.wordCount) ? 'hidden' : ''}>
            <label htmlFor="wordCount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Target Word Count
            </label>
            <Tooltip content="Specify desired content length. Short (50-100) for headlines and CTAs, Medium (100-200) for product descriptions, Long (200-400) for detailed sections, Custom allows precise targeting. Affects content depth and detail level.">
              <button type="button" className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <InfoIcon size={14} />
              </button>
            </Tooltip>
            <select
              id="wordCount"
              name="wordCount"
              className="bg-white dark:bg-black border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5"
              value={formData.wordCount}
              onChange={handleChange}
            >
              {WORD_COUNTS.map((count) => (
                <option key={count} value={count}>
                  {count}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Custom Word Count */}
        {formData.wordCount === 'Custom' && (displayMode === 'all' || isFieldPopulated(formData.customWordCount)) && (
          <div className="mb-6">
            <div className="flex justify-between items-center">
              <label htmlFor="customWordCount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Custom Word Count
              </label>
              <Tooltip content="Specify exact word count target (50-2000 words). The AI will generate content to match this length. Enable 'Strictly adhere to target word count' in Optional Features for precise adherence through multiple AI revisions if needed.">
                <button type="button" className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  <InfoIcon size={14} />
                </button>
              </Tooltip>
              
              {/* Word count info display */}
              {!isSmartMode && totalStructureWordCount > 0 && (
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Structure total: {totalStructureWordCount} words
                  {formData.prioritizeWordCount && totalStructureWordCount !== parseInt(customWordCountField.inputValue) && (
                    <span className="ml-1 text-yellow-600 dark:text-yellow-400">
                      {formData.prioritizeWordCount && totalStructureWordCount > parseInt(customWordCountField.inputValue)
                        ? ' (will use structure total)'
                        : formData.prioritizeWordCount ? ' (will use custom total)' : ''}
                    </span>
                  )}
                </div>
              )}
            </div>
            <input
              type="number"
              id="customWordCount"
              name="customWordCount"
              className="bg-white dark:bg-black border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5"
              placeholder="Enter word count"
              min="50"
              max="2000"
              value={customWordCountField.inputValue}
              onChange={customWordCountField.handleChange}
              onBlur={customWordCountField.handleBlur}
            />
            
            {!isSmartMode && (
              <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 flex items-center">
                <InfoIcon size={12} className="inline-block mr-1" />
                {formData.prioritizeWordCount 
                  ? "Strict word count mode is enabled. The AI will perform multiple refinements if needed to achieve this exact word count."
                  : "For better word count adherence, enable 'Strictly adhere to target word count' in the Optional Features section."}
              </div>
            )}
            
            {/* Show effective target word count if different from custom */}
            {!isSmartMode && 
             formData.prioritizeWordCount && 
             totalStructureWordCount > 0 && 
             totalStructureWordCount !== parseInt(customWordCountField.inputValue) && (
              <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800 rounded-md text-xs text-gray-800 dark:text-gray-200">
                <strong>Note:</strong> The effective target word count will be {effectiveTargetWordCount} words because you have both section word counts and a custom total with strict adherence enabled.
              </div>
            )}
          </div>
        )}

        {/* Word Count Priority Notice */}
        {!formData.wordCount.includes('Custom') && 
         !isSmartMode && 
         formData.prioritizeWordCount &&
         totalStructureWordCount > 0 && (
          <div className="mb-6 p-2 bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800 rounded-md text-xs">
            <div className="font-medium text-gray-800 dark:text-gray-300">Target Word Count</div>
            <p className="text-gray-800 dark:text-gray-200 mt-1">
              With strict word count adherence enabled, the target will be {effectiveTargetWordCount} words based on your section structure.
            </p>
          </div>
        )}

        {/* Tone Level Slider - HIDE in Smart Mode */}
        <div className={`${isSmartMode ? 'hidden' : ''} ${displayMode === 'populated' && !isFieldUserModified('toneLevel', formData.toneLevel) ? 'hidden' : ''}`}>
          <div className="mb-6">
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="toneLevel" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Tone Level
              </label>
              <Tooltip content="Fine-tune formality from 0 (very formal/academic) to 100 (very casual/conversational). 0 = academic style, 25 = business formal, 50 = balanced professional, 75 = friendly business, 100 = casual conversation.">
                <button type="button" className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  <InfoIcon size={14} />
                </button>
              </Tooltip>
              <span className="text-sm text-gray-600 dark:text-gray-400">{formData.toneLevel || 50}</span>
            </div>
            <input
              type="range"
              id="toneLevel"
              name="toneLevel"
              min="0"
              max="100"
              step="1"
              value={formData.toneLevel || 50}
              onChange={handleToneLevelChange}
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>Formal</span>
              <span>Casual</span>
            </div>
          </div>
        </div>

        {/* Preferred Writing Style - HIDE in Smart Mode */}
        <div className={`${isSmartMode ? 'hidden' : ''} ${displayMode === 'populated' && !isFieldPopulated(formData.preferredWritingStyle) ? 'hidden' : ''}`}>
          <div className="mb-6">
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="preferredWritingStyle" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Preferred Writing Style
              </label>
              <div className="flex items-center">
                <Tooltip content="Specific writing approach that guides information presentation. Persuasive focuses on conversion, Conversational is friendly and approachable, Informative is educational and factual, Storytelling uses narrative elements to engage emotions.">
                  <button type="button" className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <InfoIcon size={14} />
                  </button>
                </Tooltip>
              <SuggestionButton
                fieldType="preferredWritingStyle"
                businessDescription={formData.tab === 'create' ? formData.businessDescription || '' : formData.originalCopy || ''}
                onGetSuggestion={onGetSuggestion}
                isLoading={isLoadingSuggestions && activeSuggestionField === 'preferredWritingStyle'}
              />
              </div>
            </div>
            <TagInput
              id="preferredWritingStyle"
              name="preferredWritingStyle"
              placeholder="e.g., Persuasive, Conversational, Informative, Storytelling..."
              value={formData.preferredWritingStyle || ''}
              onChange={handlePreferredWritingStyleChange}
            />
          </div>
        </div>

        {/* Language Style Constraints - HIDE in Smart Mode */}
        <div className={`${isSmartMode ? 'hidden' : ''} ${displayMode === 'populated' && !isFieldPopulated(formData.languageStyleConstraints) ? 'hidden' : ''}`}>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Language Style Constraints
            </label>
            <Tooltip content="Specific writing rules to follow for brand consistency and compliance. These constraints ensure the AI follows your organization's style guidelines and avoids language patterns that don't align with your brand voice.">
              <button type="button" className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <InfoIcon size={14} />
              </button>
            </Tooltip>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {LANGUAGE_STYLE_CONSTRAINTS.map((constraint) => (
                <div key={constraint} className="flex items-center space-x-2">
                  <Checkbox
                    id={`constraint-${constraint}`}
                    checked={(formData.languageStyleConstraints || []).includes(constraint)}
                    onCheckedChange={() => handleLanguageStyleConstraintChange(constraint)}
                  />
                  <Label 
                    htmlFor={`constraint-${constraint}`}
                    className="cursor-pointer"
                  >
                    {constraint}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Output Structure - HIDE in Smart Mode */}
        <div className={`${isSmartMode ? 'hidden' : ''} ${displayMode === 'populated' && !isFieldPopulated(formData.outputStructure) ? 'hidden' : ''}`}>
          <div>
            <label htmlFor="outputStructure" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Output Structure
            </label>
            <Tooltip content="Define exactly how your content should be organized with draggable elements and individual word count allocation. Select structure elements like Header 1, Problem, Solution, Benefits, then assign specific word counts to each. The AI will create content following this exact structure and word distribution.">
              <button type="button" className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <InfoIcon size={14} />
              </button>
            </Tooltip>
            <DraggableStructuredInput
              value={formData.outputStructure || []}
              onChange={handleStructureChange}
              options={OUTPUT_STRUCTURE_OPTIONS}
              placeholder="Select one or more format options..."
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Select how you want the generated content to be formatted. Drag to reorder.
            </p>
            
            {/* Show word count summary */}
            {totalStructureWordCount > 0 && (
              <div className="mt-2 flex justify-between items-center">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Total allocated: <span className="font-bold">{totalStructureWordCount}</span> words
                </div>
                
                {/* Add warning if it differs significantly from custom count */}
                {formData.wordCount === 'Custom' && 
                 formData.customWordCount && 
                 Math.abs(totalStructureWordCount - formData.customWordCount) > formData.customWordCount * 0.1 && (
                  <div className="text-xs text-yellow-600 dark:text-yellow-400">
                    {formData.prioritizeWordCount 
                      ? "Structure word counts will take priority with strict adherence enabled."
                      : "Differs from custom word count"}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* STRATEGIC MESSAGING SECTION */}
      <div className={displayMode === 'populated' && !hasPopulatedStrategicMessagingFields() ? 'hidden' : ''}>
        <Tooltip content="Define the key message, emotions, and SEO keywords to guide your copy's core message and impact." delayDuration={300}>
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-4 pb-2 border-b border-gray-300 dark:border-gray-700 flex items-center">
            <div className="w-1 h-5 bg-primary-500 mr-2"></div>
            Strategic Messaging
          </h3>
        </Tooltip>
        
        {/* Key Message - Moved from CreateCopyForm/ImproveCopyForm */}
        <div className={displayMode === 'populated' && !isFieldPopulated(formData.keyMessage) ? 'hidden' : ''}>
          <div className="flex justify-between items-center mb-1">
            <label htmlFor="keyMessage" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Key Message
            </label>
            <div className="flex items-center">
              <Tooltip content="The main point or value proposition you want to communicate throughout the content. This becomes the central theme that ties all copy elements together and ensures consistent messaging across all sections and paragraphs.">
                <button type="button" className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  <InfoIcon size={14} />
                </button>
              </Tooltip>
            <SuggestionButton
              fieldType="keyMessage"
              businessDescription={formData.tab === 'create' ? formData.businessDescription || '' : formData.originalCopy || ''}
              onGetSuggestion={onGetSuggestion}
              isLoading={isLoadingSuggestions && activeSuggestionField === 'keyMessage'}
            />
            </div>
          </div>
          <textarea
            id="keyMessage"
            name="keyMessage"
            rows={2}
            className="bg-white dark:bg-black border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5"
            placeholder="What's the main message you want to convey?"
            value={keyMessageField.inputValue}
            onChange={keyMessageField.handleChange}
            onBlur={keyMessageField.handleBlur}
          ></textarea>
        </div>

        {/* Grid for smaller inputs - Moved from CreateCopyForm/ImproveCopyForm */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
          {/* Desired Emotion - HIDE in Smart Mode */}
          <div className={`${isSmartMode ? 'hidden' : ''} ${displayMode === 'populated' && !isFieldPopulated(formData.desiredEmotion) ? 'hidden' : ''}`}>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="desiredEmotion" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Desired Emotion
                </label>
                <div className="flex items-center">
                  <Tooltip content="The emotional response you want to evoke in your readers, influencing tone and approach. Trust builds credibility and safety, Excitement creates enthusiasm and urgency, Relief addresses pain resolution, Confidence instills belief in success.">
                    <button type="button" className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                      <InfoIcon size={14} />
                    </button>
                  </Tooltip>
                <SuggestionButton
                  fieldType="desiredEmotion"
                  businessDescription={formData.tab === 'create' ? formData.businessDescription || '' : formData.originalCopy || ''}
                  onGetSuggestion={onGetSuggestion}
                  isLoading={isLoadingSuggestions && activeSuggestionField === 'desiredEmotion'}
                />
                </div>
              </div>
              <TagInput
                id="desiredEmotion"
                name="desiredEmotion"
                placeholder="e.g., Trust, Excitement, Relief..."
                value={desiredEmotionField.inputValue}
                onChange={desiredEmotionField.setInputValue}
              />
            </div>
          </div>

          {/* Call to Action */}
          <div className={`${isSmartMode ? 'col-span-full' : ''} ${displayMode === 'populated' && !isFieldPopulated(formData.callToAction) ? 'hidden' : ''}`}>
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="callToAction" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Call to Action
              </label>
              <div className="flex items-center">
                <Tooltip content="The specific action you want readers to take after reading your content. Be specific and action-oriented: 'Start your free trial' is better than 'Learn more'. This directly impacts conversion rates and reader engagement.">
                  <button type="button" className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <InfoIcon size={14} />
                  </button>
                </Tooltip>
              <SuggestionButton
                fieldType="callToAction"
                businessDescription={formData.tab === 'create' ? formData.businessDescription || '' : formData.originalCopy || ''}
                onGetSuggestion={onGetSuggestion}
                isLoading={isLoadingSuggestions && activeSuggestionField === 'callToAction'}
              />
              </div>
            </div>
            <input
              type="text"
              id="callToAction"
              name="callToAction"
              className="bg-white dark:bg-black border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5"
              placeholder="e.g., Sign up, Contact us, Learn more..."
              value={callToActionField.inputValue}
              onChange={callToActionField.handleChange}
              onBlur={callToActionField.handleBlur}
            />
          </div>
        </div>

        {/* Brand Values - HIDE in Smart Mode */}
        <div className={`${isSmartMode ? 'hidden' : ''} ${displayMode === 'populated' && !isFieldPopulated(formData.brandValues) ? 'hidden' : ''}`}>
          <div className="mb-6">
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="brandValues" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Brand Values
              </label>
              <div className="flex items-center">
                <Tooltip content="Core values that represent your brand and should be reflected in messaging. These guide tone and messaging consistency across all copy. Examples: Innovation, Reliability, Transparency, Customer-first, Sustainability. Helps create authentic, aligned brand voice.">
                  <button type="button" className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <InfoIcon size={14} />
                  </button>
                </Tooltip>
              <SuggestionButton
                fieldType="brandValues"
                businessDescription={formData.tab === 'create' ? formData.businessDescription || '' : formData.originalCopy || ''}
                onGetSuggestion={onGetSuggestion}
                isLoading={isLoadingSuggestions && activeSuggestionField === 'brandValues'}
              />
              </div>
            </div>
            <TagInput
              id="brandValues"
              name="brandValues"
              placeholder="e.g., Innovation, Reliability, Sustainability..."
              value={brandValuesField.inputValue}
              onChange={brandValuesField.setInputValue}
            />
          </div>
        </div>

        {/* Keywords - HIDE in Smart Mode */}
        <div className={`${isSmartMode ? 'hidden' : ''} ${displayMode === 'populated' && !isFieldPopulated(formData.keywords) ? 'hidden' : ''}`}>
          <div className="mb-6">
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="keywords" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Keywords
              </label>
              <div className="flex items-center">
                <Tooltip content="SEO keywords and key phrases that should be naturally integrated throughout the content. These help improve search engine visibility and ensure the copy includes terms your audience searches for. Enable 'Force SEO keyword integration' for guaranteed inclusion.">
                  <button type="button" className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <InfoIcon size={14} />
                  </button>
                </Tooltip>
              <SuggestionButton
                fieldType="keywords"
                businessDescription={formData.tab === 'create' ? formData.businessDescription || '' : formData.originalCopy || ''}
                onGetSuggestion={onGetSuggestion}
                isLoading={isLoadingSuggestions && activeSuggestionField === 'keywords'}
              />
              </div>
            </div>
            <TagInput
              id="keywords"
              name="keywords"
              placeholder="e.g., professional, effective, custom, affordable..."
              value={keywordsField.inputValue}
              onChange={keywordsField.setInputValue}
            />
          </div>
        </div>

        {/* Context - HIDE in Smart Mode */}
        <div className={`${isSmartMode ? 'hidden' : ''} ${displayMode === 'populated' && !isFieldPopulated(formData.context) ? 'hidden' : ''}`}>
          <div className="mb-6">
            <div className="flex justify-between items-center mb-1">
              <div className="flex items-center">
                <label htmlFor="context" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Context
                </label>
                <Tooltip content="Additional situational information that helps the AI understand the broader context. Include details like campaign timing, market conditions, competitive landscape, or special circumstances that should influence the copy approach and messaging.">
                  <button type="button" className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <InfoIcon size={14} />
                  </button>
                </Tooltip>
              </div>
              <div className="flex items-center">
              <SuggestionButton
                fieldType="context"
                businessDescription={formData.tab === 'create' ? formData.businessDescription || '' : formData.originalCopy || ''}
                onGetSuggestion={onGetSuggestion}
                isLoading={isLoadingSuggestions && activeSuggestionField === 'context'}
              />
              </div>
            </div>
            <textarea
              id="context"
              name="context"
              rows={3}
              className="bg-white dark:bg-black border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5"
              placeholder="Any additional context for this copy (e.g., campaign details, market conditions)..."
              value={contextField.inputValue}
              onChange={contextField.handleChange}
              onBlur={contextField.handleBlur}
            ></textarea>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SharedInputs;