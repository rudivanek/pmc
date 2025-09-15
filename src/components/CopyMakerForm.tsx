import React, { useState } from 'react';
import { FormState, User } from '../types';
import { MODELS, LANGUAGES, TONES, WORD_COUNTS, PAGE_TYPES, OUTPUT_STRUCTURE_OPTIONS, INDUSTRY_NICHE_CATEGORIES, READER_FUNNEL_STAGES, PREFERRED_WRITING_STYLES, LANGUAGE_STYLE_CONSTRAINTS } from '../constants';
import { DEFAULT_FORM_STATE } from '../constants';
import { toast } from 'react-hot-toast';
import { checkUserAccess, getCustomers } from '../services/supabaseClient';
import { getSuggestions, evaluateContentQuality } from '../services/apiService';
import { useInputField } from '../hooks/useInputField';
import PrefillSelector from './PrefillSelector';
import GenerateButton from './GenerateButton';
import ClearButton from './ClearButton';
import SuggestionModal from './SuggestionModal';
import LoadingSpinner from './ui/LoadingSpinner';
import ContentQualityIndicator from './ui/ContentQualityIndicator';
import DraggableStructuredInput from './ui/DraggableStructuredInput';
import TagInput from './ui/TagInput';
import CategoryTagsInput from './ui/CategoryTagsInput';
import SuggestionButton from './ui/SuggestionButton';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { Tooltip } from './ui/Tooltip';
import { Download, Upload, User as UserIcon, Plus, Zap, Save, Lightbulb, List, Filter, InfoIcon } from 'lucide-react';
import { calculateTargetWordCount } from '../services/api/utils';

interface CopyMakerFormProps {
  currentUser?: User;
  formState: FormState;
  setFormState: (state: FormState) => void;
  onGenerate?: () => void;
  onClearAll: () => void;
  loadedTemplateId: string | null;
  setLoadedTemplateId: (id: string | null) => void;
  loadedTemplateName: string;
  setLoadedTemplateName: (name: string) => void;
  isSmartMode: boolean;
  onEvaluateInputs?: () => void;
  onSaveTemplate?: () => void;
  isPrefillEditingMode?: boolean;
  projectDescriptionRef?: React.RefObject<HTMLInputElement>;
  businessDescriptionRef?: React.RefObject<HTMLTextAreaElement>;
  originalCopyRef?: React.RefObject<HTMLTextAreaElement>;
  onOpenTemplateSuggestion?: () => void;
}

const CopyMakerForm: React.FC<CopyMakerFormProps> = ({
  currentUser,
  formState,
  setFormState,
  onGenerate,
  onClearAll,
  loadedTemplateId,
  setLoadedTemplateId,
  loadedTemplateName,
  setLoadedTemplateName,
  isSmartMode,
  onEvaluateInputs,
  onSaveTemplate,
  isPrefillEditingMode = false,
  projectDescriptionRef,
  businessDescriptionRef,
  originalCopyRef,
  onOpenTemplateSuggestion
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [activeSuggestionField, setActiveSuggestionField] = useState<string | null>(null);
  const [showSuggestionModal, setShowSuggestionModal] = useState(false);
  const [currentSuggestions, setCurrentSuggestions] = useState<string[]>([]);
  const [currentSuggestionField, setCurrentSuggestionField] = useState<string>('');
  const [displayMode, setDisplayMode] = useState<'all' | 'populated'>('all');
  const [isEvaluatingOriginalCopy, setIsEvaluatingOriginalCopy] = useState(false);
  // Check if current user is admin
  const isAdmin = currentUser?.email === 'rfv@datago.net';


  // Input field hooks
  const projectDescriptionField = useInputField({
    value: formState.projectDescription || '',
    onChange: (value) => handleChange({ target: { name: 'projectDescription', value } } as any)
  });

  const briefDescriptionField = useInputField({
    value: formState.briefDescription || '',
    onChange: (value) => handleChange({ target: { name: 'briefDescription', value } } as any)
  });

  const productServiceNameField = useInputField({
    value: formState.productServiceName || '',
    onChange: (value) => handleChange({ target: { name: 'productServiceName', value } } as any)
  });

  const originalCopyField = useInputField({
    value: formState.originalCopy || '',
    onChange: (value) => handleChange({ target: { name: 'originalCopy', value } } as any)
  });

  const customWordCountField = useInputField({
    value: formState.customWordCount?.toString() || '',
    onChange: (value) => handleChange({ 
      target: { 
        name: 'customWordCount', 
        value: value ? parseInt(value) : 150 
      } 
    } as any)
  });

  // Input field hooks for targeting section
  const targetAudienceField = useInputField({
    value: formState.targetAudience || '',
    onChange: (value) => handleChange({ target: { name: 'targetAudience', value } } as any)
  });

  const targetAudiencePainPointsField = useInputField({
    value: formState.targetAudiencePainPoints || '',
    onChange: (value) => handleChange({ target: { name: 'targetAudiencePainPoints', value } } as any)
  });

  // Input field hooks for competitor URLs
  const competitorUrl1Field = useInputField({
    value: formState.competitorUrls[0] || '',
    onChange: (value) => {
      const newUrls = [...formState.competitorUrls];
      newUrls[0] = value;
      handleChange({
        target: { name: 'competitorUrls', value: newUrls }
      } as unknown as React.ChangeEvent<HTMLInputElement>);
    }
  });
  
  const competitorUrl2Field = useInputField({
    value: formState.competitorUrls[1] || '',
    onChange: (value) => {
      const newUrls = [...formState.competitorUrls];
      newUrls[1] = value;
      handleChange({
        target: { name: 'competitorUrls', value: newUrls }
      } as unknown as React.ChangeEvent<HTMLInputElement>);
    }
  });
  
  const competitorUrl3Field = useInputField({
    value: formState.competitorUrls[2] || '',
    onChange: (value) => {
      const newUrls = [...formState.competitorUrls];
      newUrls[2] = value;
      handleChange({
        target: { name: 'competitorUrls', value: newUrls }
      } as unknown as React.ChangeEvent<HTMLInputElement>);
    }
  });

  // Strategic messaging input hooks
  const keyMessageField = useInputField({
    value: formState.keyMessage || '',
    onChange: (value) => handleChange({ target: { name: 'keyMessage', value } } as any)
  });
  
  const desiredEmotionField = useInputField({
    value: formState.desiredEmotion || '',
    onChange: (value) => handleChange({ target: { name: 'desiredEmotion', value } } as any)
  });
  
  const callToActionField = useInputField({
    value: formState.callToAction || '',
    onChange: (value) => handleChange({ target: { name: 'callToAction', value } } as any)
  });
  
  const brandValuesField = useInputField({
    value: formState.brandValues || '',
    onChange: (value) => handleChange({ target: { name: 'brandValues', value } } as any)
  });
  
  const keywordsField = useInputField({
    value: formState.keywords || '',
    onChange: (value) => handleChange({ target: { name: 'keywords', value } } as any)
  });
  
  const contextField = useInputField({
    value: formState.context || '',
    onChange: (value) => handleChange({ target: { name: 'context', value } } as any)
  });

  const competitorCopyTextField = useInputField({
    value: formState.competitorCopyText || '',
    onChange: (value) => handleChange({ 
      target: { name: 'competitorCopyText', value } 
    } as any)
  });

  // Load customers on component mount
  React.useEffect(() => {
    const loadCustomers = async () => {
      if (!currentUser) return;
      
      setLoadingCustomers(true);
      try {
        const { data, error } = await getCustomers();
        if (error) throw error;
        setCustomers(data || []);
      } catch (error) {
        console.error('Error loading customers:', error);
      } finally {
        setLoadingCustomers(false);
      }
    };

    loadCustomers();
  }, [currentUser]);

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'customerId') {
      const selectedCustomer = customers.find(c => c.id === value);
      setFormState(prev => ({
        ...prev,
        customerId: value,
        customerName: selectedCustomer?.name || ''
      }));
    } else {
      setFormState(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Handle checkbox toggles
  const handleToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormState(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  // Handle getting suggestions
  const onGetSuggestion = async (fieldType: string) => {
    if (!currentUser) {
      toast.error('Please log in to get suggestions.');
      return;
    }

    try {
      const accessResult = await checkUserAccess(currentUser.id, currentUser.email || '');
      if (!accessResult.hasAccess) {
        toast.error(accessResult.message);
        return;
      }
    } catch (error) {
      console.error('Error checking user access for suggestions:', error);
      toast.error("Unable to verify access. Please try again.");
      return;
    }

    const textToAnalyze = formState.originalCopy || '';

    if (!textToAnalyze.trim()) {
      toast.error('Please enter content in the main field first.');
      return;
    }

    setIsLoadingSuggestions(true);
    setActiveSuggestionField(fieldType);

    try {
      const suggestions = await getSuggestions(
        textToAnalyze,
        fieldType,
        formState.model,
        formState.language,
        currentUser,
        undefined,
        formState.sessionId,
        formState.projectDescription
      );

      if (suggestions && suggestions.length > 0) {
        setCurrentSuggestions(suggestions);
        setCurrentSuggestionField(fieldType);
        setShowSuggestionModal(true);
      } else {
        toast.info('No suggestions available for this field.');
      }
    } catch (error: any) {
      console.error('Error getting suggestions:', error);
      toast.error(`Failed to get suggestions: ${error.message}`);
    } finally {
      setIsLoadingSuggestions(false);
      setActiveSuggestionField(null);
    }
  };

  // Handle suggestion insertion
  const handleInsertSuggestions = (suggestions: string[]) => {
    if (suggestions.length === 0) return;

    const fieldValue = suggestions.join(', ');
    handleChange({
      target: { name: currentSuggestionField, value: fieldValue }
    } as React.ChangeEvent<HTMLInputElement>);

    setShowSuggestionModal(false);
    toast.success(`${suggestions.length} suggestion(s) added to ${currentSuggestionField}`);
  };

  // Function to evaluate the original copy
  const evaluateOriginalCopy = async () => {
    if (!originalCopyField.inputValue) {
      return;
    }
    
    setIsEvaluatingOriginalCopy(true);
    
    try {
      const result = await evaluateContentQuality(
        originalCopyField.inputValue,
        'Original Copy',
        formState.model,
        currentUser
      );
      
      setFormState(prev => ({ ...prev, originalCopyScore: result }));
    } catch (error) {
      console.error('Error evaluating original copy:', error);
    } finally {
      setIsEvaluatingOriginalCopy(false);
    }
  };

  // Handle exporting form as JSON
  const handleExportForm = () => {
    setIsExporting(true);
    
    try {
      const exportData = {
        projectDescription: formState.projectDescription,
        originalCopy: formState.originalCopy,
        language: formState.language,
        tone: formState.tone,
        wordCount: formState.wordCount,
        customWordCount: formState.customWordCount,
        pageType: formState.pageType,
        section: formState.section,
        productServiceName: formState.productServiceName,
        briefDescription: formState.briefDescription,
        excludedTerms: formState.excludedTerms,
        industryNiche: formState.industryNiche,
        targetAudience: formState.targetAudience,
        readerFunnelStage: formState.readerFunnelStage,
        competitorUrls: formState.competitorUrls,
        targetAudiencePainPoints: formState.targetAudiencePainPoints,
        toneLevel: formState.toneLevel,
        preferredWritingStyle: formState.preferredWritingStyle,
        languageStyleConstraints: formState.languageStyleConstraints,
        outputStructure: formState.outputStructure,
        keyMessage: formState.keyMessage,
        desiredEmotion: formState.desiredEmotion,
        callToAction: formState.callToAction,
        brandValues: formState.brandValues,
        keywords: formState.keywords,
        context: formState.context,
        competitorCopyText: formState.competitorCopyText,
        generateSeoMetadata: formState.generateSeoMetadata,
        generateScores: formState.generateScores,
        generateGeoScore: formState.generateGeoScore,
        prioritizeWordCount: formState.prioritizeWordCount,
        wordCountTolerancePercentage: formState.wordCountTolerancePercentage,
        adhereToLittleWordCount: formState.adhereToLittleWordCount,
        littleWordCountTolerancePercentage: formState.littleWordCountTolerancePercentage,
        forceKeywordIntegration: formState.forceKeywordIntegration,
        forceElaborationsExamples: formState.forceElaborationsExamples,
        enhanceForGEO: formState.enhanceForGEO,
        addTldrSummary: formState.addTldrSummary,
        geoRegions: formState.geoRegions,
        numUrlSlugs: formState.numUrlSlugs,
        numMetaDescriptions: formState.numMetaDescriptions,
        numH1Variants: formState.numH1Variants,
        numH2Variants: formState.numH2Variants,
        numH3Variants: formState.numH3Variants,
        numOgTitles: formState.numOgTitles,
        numOgDescriptions: formState.numOgDescriptions,
        exportedAt: new Date().toISOString(),
        exportedBy: currentUser?.email || 'unknown'
      };
      
      const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
      const projectDesc = formState.projectDescription?.trim() || formState.briefDescription?.trim() || 'Untitled Project';
      const filename = `${projectDesc} - ${timestamp}.json`;
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('Form exported as JSON!');
    } catch (error) {
      console.error('Error exporting form:', error);
      toast.error('Failed to export form');
    } finally {
      setIsExporting(false);
    }
  };

  // Handle importing form from JSON
  const handleImportForm = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      setIsImporting(true);
      
      try {
        const text = await file.text();
        const importedData = JSON.parse(text);
        
        if (!importedData || typeof importedData !== 'object') {
          throw new Error('Invalid JSON structure');
        }
        
        const newFormState: FormState = {
          ...DEFAULT_FORM_STATE,
          ...importedData,
          isLoading: false,
          isEvaluating: false,
          generationProgress: [],
          copyResult: DEFAULT_FORM_STATE.copyResult,
          promptEvaluation: undefined,
          sessionId: undefined
        };
        
        setFormState(newFormState);
        setLoadedTemplateId(null);
        setLoadedTemplateName('');
        
        toast.success(`Form imported from ${file.name}! Ready to generate new copy.`);
      } catch (error) {
        console.error('Error importing form:', error);
        toast.error('Failed to import form. Please check the JSON file format.');
      } finally {
        setIsImporting(false);
      }
    };
    
    input.click();
  };

  // Handle industry niche change
  const handleIndustryNicheChange = (value: string) => {
    handleChange({
      target: { name: 'industryNiche', value }
    } as React.ChangeEvent<HTMLSelectElement>);
  };

  // Handle reader funnel stage change
  const handleReaderFunnelStageChange = (value: string) => {
    handleChange({
      target: { name: 'readerFunnelStage', value }
    } as React.ChangeEvent<HTMLSelectElement>);
  };

  // Handle preferred writing style change
  const handlePreferredWritingStyleChange = (value: string) => {
    handleChange({
      target: { name: 'preferredWritingStyle', value }
    } as React.ChangeEvent<HTMLSelectElement>);
  };

  // Handle tone level change
  const handleToneLevelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleChange({
      target: { name: 'toneLevel', value: parseInt(e.target.value) }
    } as React.ChangeEvent<HTMLInputElement>);
  };

  // Handle language style constraints change
  const handleLanguageStyleConstraintChange = (constraint: string) => {
    const constraints = formState.languageStyleConstraints || [];
    const updatedConstraints = constraints.includes(constraint)
      ? constraints.filter(c => c !== constraint)
      : [...constraints, constraint];
    
    handleChange({
      target: { name: 'languageStyleConstraints', value: updatedConstraints }
    } as unknown as React.ChangeEvent<HTMLInputElement>);
  };

  // Handler for output structure change
  const handleStructureChange = (values: string[]) => {
    handleChange({
      target: { name: 'outputStructure', value: values }
    } as React.ChangeEvent<HTMLSelectElement>);
  };

  // Calculate the total word count from structure elements
  const totalStructureWordCount = React.useMemo(() => {
    if (!formState.outputStructure || formState.outputStructure.length === 0) {
      return 0;
    }
    
    return formState.outputStructure.reduce((sum, element) => {
      return sum + (element.wordCount || 0);
    }, 0);
  }, [formState.outputStructure]);
  
  // Calculate the effective target word count using the shared utility function
  const effectiveTargetWordCount = calculateTargetWordCount(formState);

  // Helper function to check if a field is populated
  const isFieldPopulated = (value: any): boolean => {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    return false;
  };

  // Function to count words in a string
  const countWords = (text: string): number => {
    return text.trim() ? text.trim().split(/\s+/).length : 0;
  };

  // Get original copy word count
  const originalCopyWordCount = countWords(originalCopyField.inputValue);

  // Helper function to check if we should show floating buttons
  const shouldShowFloatingButtons = () => {
    return !!(
      !isPrefillEditingMode &&
      (formState.originalCopy?.trim() ||
       formState.projectDescription?.trim() ||
       formState.briefDescription?.trim() ||
       formState.targetAudience?.trim() ||
       formState.keyMessage?.trim())
    );
  };

  // Calculate if the current word count target is "little" (below 100 words)
  const isLittleWordCount = React.useMemo(() => {
    if (formState.wordCount === 'Custom') {
      return (formState.customWordCount || 0) < 100;
    }
    
    // Check preset ranges
    if (formState.wordCount.includes('Short')) {
      return true; // Short: 50-100 is considered little
    }
    
    return false; // Medium and Long are not considered little
  }, [formState.wordCount, formState.customWordCount]);

  // Check if any field in the Copy Targeting section is populated
  const hasPopulatedCopyTargetingFields = () => {
    return isFieldPopulated(formState.industryNiche) ||
           isFieldPopulated(formState.targetAudience) ||
           isFieldPopulated(formState.readerFunnelStage) ||
           isFieldPopulated(formState.competitorUrls?.some(url => url.trim())) ||
           isFieldPopulated(formState.targetAudiencePainPoints);
  };

  // Check if any field in the Strategic Messaging section is populated
  const hasPopulatedStrategicMessagingFields = () => {
    return isFieldPopulated(formState.keyMessage) ||
           isFieldPopulated(formState.desiredEmotion) ||
           isFieldPopulated(formState.callToAction) ||
           isFieldPopulated(formState.brandValues) ||
           isFieldPopulated(formState.keywords) ||
           isFieldPopulated(formState.context) ||
           isFieldPopulated(formState.competitorCopyText);
  };

  return (
    <div className="bg-white dark:bg-black border border-gray-300 dark:border-gray-800 rounded-lg p-6 mx-24">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Copy Maker</h2>
        
        <div className="flex items-center space-x-3">
          {/* Template JSON Generator - Admin Only */}
          {isAdmin && onOpenTemplateSuggestion && (
            <button
              type="button"
              onClick={onOpenTemplateSuggestion}
              className="flex items-center bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 px-3 py-2 rounded-md text-sm transition-colors"
              title="Template JSON Generator"
            >
              <Lightbulb size={16} className="mr-1.5" />
              Template Generator
            </button>
          )}
          
          <button
            type="button"
            onClick={handleExportForm}
            disabled={isExporting || !formState.originalCopy?.trim()}
            className="flex items-center bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 px-3 py-2 rounded-md text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Export current form as JSON file"
          >
            {isExporting ? (
              <>
                <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin mr-2"></div>
                Exporting...
              </>
            ) : (
              <>
                <Download size={16} className="mr-1.5" />
                Export JSON
              </>
            )}
          </button>
          
          <button
            type="button"
            onClick={handleImportForm}
            disabled={isImporting}
            className="flex items-center bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 px-3 py-2 rounded-md text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Import form from JSON file"
          >
            {isImporting ? (
              <>
                <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin mr-2"></div>
                Importing...
              </>
            ) : (
              <>
                <Upload size={16} className="mr-1.5" />
                Import JSON
              </>
            )}
          </button>
        </div>
      </div>
      
      {/* Prefill Selector */}
      <PrefillSelector
        formState={formState}
        setFormState={setFormState}
        setDisplayMode={setDisplayMode}
        displayMode={displayMode}
      />

      {/* Project Setup Section */}
      <div className="space-y-6 mb-8">
        <div>
          <Tooltip content="Configure your project foundation and organization. These settings help you manage and identify your work.">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-4 pb-2 border-b border-gray-300 dark:border-gray-700 flex items-center">
              <div className="w-1 h-5 bg-primary-500 mr-2"></div>
              Project Setup
            </h3>
          </Tooltip>

          {/* Model Selection */}
          <div className="mb-6">
            <label htmlFor="model" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              AI Model
            </label>
            <select
              id="model"
              name="model"
              className="bg-white dark:bg-black border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5"
              value={formState.model}
              onChange={handleChange}
            >
              {MODELS.map((model) => (
                <option key={model.value} value={model.value}>
                  {model.label}
                </option>
              ))}
            </select>
          </div>

          {/* Project Description */}
          <div className="mb-6">
            <label htmlFor="projectDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Project Description <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="projectDescription"
              name="projectDescription"
              required
              className="bg-white dark:bg-black border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5"
              placeholder="e.g., Homepage redesign, Product launch copy, Email campaign"
              value={projectDescriptionField.inputValue}
              onChange={projectDescriptionField.handleChange}
              onBlur={projectDescriptionField.handleBlur}
              ref={projectDescriptionRef}
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Internal field for your organization - not sent to AI. Helps you identify and manage projects.
            </p>
          </div>

          {/* Customer Selection */}
          <div className={`grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6 ${displayMode === 'populated' && !isFieldPopulated(formState.customerId) && !isFieldPopulated(formState.productServiceName) ? 'hidden' : ''}`}>
            <div>
              <label htmlFor="customerId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Customer
              </label>
              <select
                id="customerId"
                name="customerId"
                className="bg-white dark:bg-black border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5"
                value={formState.customerId || ''}
                onChange={handleChange}
                disabled={loadingCustomers}
              >
                <option value="">{loadingCustomers ? 'Loading customers...' : 'Select a customer (optional)'}</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="productServiceName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Product/Service Name
              </label>
              <input
                type="text"
                id="productServiceName"
                name="productServiceName"
                className="bg-white dark:bg-black border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5"
                placeholder="Enter product or service name"
                value={productServiceNameField.inputValue}
                onChange={productServiceNameField.handleChange}
                onBlur={productServiceNameField.handleBlur}
              />
            </div>
          </div>

          <div className={`${displayMode === 'populated' && !isFieldPopulated(formState.briefDescription) ? 'hidden' : ''}`}>
            <label htmlFor="briefDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Brief Description
            </label>
            <input
              type="text"
              id="briefDescription"
              name="briefDescription"
              className="bg-white dark:bg-black border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5"
              placeholder="Brief project description for your reference"
              value={briefDescriptionField.inputValue}
              onChange={briefDescriptionField.handleChange}
              onBlur={briefDescriptionField.handleBlur}
            />
          </div>
        </div>
      </div>

      {/* Core Content Section */}
      <div className="space-y-6 mb-8">
        <div>
          <Tooltip content="Provide the primary content information - either business description for new copy or existing copy to improve.">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-4 pb-2 border-b border-gray-300 dark:border-gray-700 flex items-center">
              <div className="w-1 h-5 bg-primary-500 mr-2"></div>
              Core Content
            </h3>
          </Tooltip>

          {/* Page Type & Section Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
            <div>
              <label htmlFor="pageType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Page Type
              </label>
              <select
                id="pageType"
                name="pageType"
                className="bg-white dark:bg-black border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5"
                value={formState.pageType}
                onChange={handleChange}
              >
                {PAGE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="section" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Section
              </label>
              <input
                type="text"
                id="section"
                name="section"
                className="bg-white dark:bg-black border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5"
                value={formState.section || ''}
                onChange={handleChange}
                placeholder="e.g., Hero Section, Benefits, Features, FAQ..."
              />
            </div>
          </div>

          {/* Original Copy or Describe what you want to achieve */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="originalCopy" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Original Copy or Describe what you want to achieve <span className="text-red-500">*</span>
              </label>
              <Tooltip content="Evaluate the quality of your content">
                <button
                  type="button"
                  onClick={evaluateOriginalCopy}
                  disabled={isEvaluatingOriginalCopy || !originalCopyField.inputValue}
                  className="p-1 text-gray-500 dark:text-gray-400 hover:text-primary-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                >
                  {isEvaluatingOriginalCopy ? (
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
              placeholder="Describe your business/product OR paste existing copy to improve..."
              value={originalCopyField.inputValue}
              onChange={originalCopyField.handleChange}
              onBlur={originalCopyField.handleBlur}
              ref={originalCopyRef}
            />
            
            <div className="flex items-center justify-between mt-1">
              {/* Word count display */}
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {originalCopyWordCount} {originalCopyWordCount === 1 ? 'word' : 'words'}
              </div>
              
              {/* Content Quality Indicator for Original Copy */}
              <ContentQualityIndicator 
                score={formState.originalCopyScore} 
                isLoading={isEvaluatingOriginalCopy}
              />
            </div>
          </div>

          {/* Exclude Specific Terms */}
          <div className="mb-6">
            <label htmlFor="excludedTerms" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Exclude specific terms from output
            </label>
            <textarea
              id="excludedTerms"
              name="excludedTerms"
              rows={2}
              className="bg-white dark:bg-black border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5"
              placeholder="e.g., DeepSeek V3, GPT-4o, competitor names..."
              value={formState.excludedTerms || ''}
              onChange={handleChange}
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              List words or brand names you don't want the AI to include in the generated copy, separated by commas
            </p>
          </div>
        </div>
      </div>

      {/* COPY TARGETING SECTION */}
      <div className={`space-y-6 mb-8 ${isSmartMode ? 'hidden' : ''} ${displayMode === 'populated' && !hasPopulatedCopyTargetingFields() ? 'hidden' : ''}`}>
        <div>
          <Tooltip content="Describe your target audience and competitive landscape. The more precise this is, the better your copy will resonate with readers." delayDuration={300}>
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-4 pb-2 border-b border-gray-300 dark:border-gray-700 flex items-center">
              <div className="w-1 h-5 bg-primary-500 mr-2"></div>
              Copy Targeting
            </h3>
          </Tooltip>
          
          {/* Industry/Niche */}
          <div className={`mb-6 ${displayMode === 'populated' && !isFieldPopulated(formState.industryNiche) ? 'hidden' : ''}`}>
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="industryNiche" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Industry/Niche
              </label>
              <SuggestionButton
                fieldType="industryNiche"
                businessDescription={formState.originalCopy || ''}
                onGetSuggestion={onGetSuggestion}
                isLoading={isLoadingSuggestions && activeSuggestionField === 'industryNiche'}
              />
            </div>
            <CategoryTagsInput
              id="industryNiche"
              name="industryNiche"
              placeholder="Select industry/niche..."
              value={formState.industryNiche || ''}
              onChange={handleIndustryNicheChange}
              categories={INDUSTRY_NICHE_CATEGORIES}
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Select your industry or add a custom one to get more targeted copy
            </p>
          </div>

          {/* Target Audience */}
          <div className={`mb-6 ${displayMode === 'populated' && !isFieldPopulated(formState.targetAudience) ? 'hidden' : ''}`}>
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="targetAudience" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Target Audience
              </label>
              <SuggestionButton
                fieldType="targetAudience"
                businessDescription={formState.originalCopy || ''}
                onGetSuggestion={onGetSuggestion}
                isLoading={isLoadingSuggestions && activeSuggestionField === 'targetAudience'}
                currentUser={currentUser}
              />
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
            />
          </div>

          {/* Reader's Stage in Funnel */}
          <div className={`mb-6 ${displayMode === 'populated' && !isFieldPopulated(formState.readerFunnelStage) ? 'hidden' : ''}`}>
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="readerFunnelStage" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Reader's Stage in Funnel
              </label>
              <SuggestionButton
                fieldType="readerFunnelStage"
                businessDescription={formState.originalCopy || ''}
                onGetSuggestion={onGetSuggestion}
                isLoading={isLoadingSuggestions && activeSuggestionField === 'readerFunnelStage'}
              />
            </div>
            <TagInput
              id="readerFunnelStage"
              name="readerFunnelStage"
              placeholder="e.g., Awareness, Consideration, Decision..."
              value={formState.readerFunnelStage || ''}
              onChange={handleReaderFunnelStageChange}
            />
          </div>
          
          {/* Competitor URLs */}
          <div className={`space-y-3 mb-6 ${displayMode === 'populated' && !isFieldPopulated(formState.competitorUrls?.some(url => url.trim())) ? 'hidden' : ''}`}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Competitor URLs (Optional)
            </label>
            <input
              type="url"
              className="bg-white dark:bg-black border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5"
              placeholder="https://competitor1.com"
              value={competitorUrl1Field.inputValue}
              onChange={competitorUrl1Field.handleChange}
              onBlur={competitorUrl1Field.handleBlur}
            />
            <input
              type="url"
              className="bg-white dark:bg-black border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5"
              placeholder="https://competitor2.com"
              value={competitorUrl2Field.inputValue}
              onChange={competitorUrl2Field.handleChange}
              onBlur={competitorUrl2Field.handleBlur}
            />
            <input
              type="url"
              className="bg-white dark:bg-black border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5"
              placeholder="https://competitor3.com"
              value={competitorUrl3Field.inputValue}
              onChange={competitorUrl3Field.handleChange}
              onBlur={competitorUrl3Field.handleBlur}
            />
          </div>

          {/* Target Audience Pain Points */}
          <div className={`mb-6 ${displayMode === 'populated' && !isFieldPopulated(formState.targetAudiencePainPoints) ? 'hidden' : ''}`}>
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="targetAudiencePainPoints" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Target Audience Pain Points
              </label>
              <SuggestionButton
                fieldType="targetAudiencePainPoints"
                businessDescription={formState.originalCopy || ''}
                onGetSuggestion={onGetSuggestion}
                isLoading={isLoadingSuggestions && activeSuggestionField === 'targetAudiencePainPoints'}
              />
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
            />
          </div>
        </div>
      </div>

      {/* TONE & STYLE SECTION */}
      <div className="space-y-6 mb-8">
        <div>
          <Tooltip content="Control the voice, tone, and formatting of your copy to match your brand or campaign goals." delayDuration={300}>
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-4 pb-2 border-b border-gray-300 dark:border-gray-700 flex items-center">
              <div className="w-1 h-5 bg-primary-500 mr-2"></div>
              Tone & Style
            </h3>
          </Tooltip>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {/* Language Dropdown */}
            <div>
              <label htmlFor="language" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Language
              </label>
              <select
                id="language"
                name="language"
                className="bg-white dark:bg-black border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5"
                value={formState.language}
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
            <div>
              <label htmlFor="tone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tone
              </label>
              <select
                id="tone"
                name="tone"
                className="bg-white dark:bg-black border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5"
                value={formState.tone}
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
            <div>
              <label htmlFor="wordCount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Target Word Count
              </label>
              <select
                id="wordCount"
                name="wordCount"
                className="bg-white dark:bg-black border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5"
                value={formState.wordCount}
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
          {formState.wordCount === 'Custom' && (
            <div className="mb-6">
              <div className="flex justify-between items-center">
                <label htmlFor="customWordCount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Custom Word Count
                </label>
                
                {/* Word count info display */}
                {!isSmartMode && totalStructureWordCount > 0 && (
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Structure total: {totalStructureWordCount} words
                    {formState.prioritizeWordCount && totalStructureWordCount !== parseInt(customWordCountField.inputValue) && (
                      <span className="ml-1 text-yellow-600 dark:text-yellow-400">
                        {formState.prioritizeWordCount && totalStructureWordCount > parseInt(customWordCountField.inputValue)
                          ? ' (will use structure total)'
                          : formState.prioritizeWordCount ? ' (will use custom total)' : ''}
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
                  {formState.prioritizeWordCount 
                    ? "Strict word count mode is enabled. The AI will perform multiple refinements if needed to achieve this exact word count."
                    : "For better word count adherence, enable 'Strictly adhere to target word count' in the Optional Features section."}
                </div>
              )}
              
              {/* Show effective target word count if different from custom */}
              {!isSmartMode && 
               formState.prioritizeWordCount && 
               totalStructureWordCount > 0 && 
               totalStructureWordCount !== parseInt(customWordCountField.inputValue) && (
                <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800 rounded-md text-xs text-gray-800 dark:text-gray-200">
                  <strong>Note:</strong> The effective target word count will be {effectiveTargetWordCount.target} words because you have both section word counts and a custom total with strict adherence enabled.
                </div>
              )}
            </div>
          )}

          {/* Tone Level Slider - HIDE in Smart Mode */}
          {!isSmartMode && (
            <div className="mb-6">
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="toneLevel" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Tone Level
                </label>
                <span className="text-sm text-gray-600 dark:text-gray-400">{formState.toneLevel || 50}</span>
              </div>
              <input
                type="range"
                id="toneLevel"
                name="toneLevel"
                min="0"
                max="100"
                step="1"
                value={formState.toneLevel || 50}
                onChange={handleToneLevelChange}
                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span>Formal</span>
                <span>Casual</span>
              </div>
            </div>
          )}

          {/* Preferred Writing Style - HIDE in Smart Mode */}
          {!isSmartMode && (
            <div className="mb-6">
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="preferredWritingStyle" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Preferred Writing Style
                </label>
                <SuggestionButton
                  fieldType="preferredWritingStyle"
                  businessDescription={formState.originalCopy || ''}
                  onGetSuggestion={onGetSuggestion}
                  isLoading={isLoadingSuggestions && activeSuggestionField === 'preferredWritingStyle'}
                />
              </div>
              <TagInput
                id="preferredWritingStyle"
                name="preferredWritingStyle"
                placeholder="e.g., Persuasive, Conversational, Informative, Storytelling..."
                value={formState.preferredWritingStyle || ''}
                onChange={handlePreferredWritingStyleChange}
              />
            </div>
          )}

          {/* Language Style Constraints - HIDE in Smart Mode */}
          {!isSmartMode && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Language Style Constraints
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {LANGUAGE_STYLE_CONSTRAINTS.map((constraint) => (
                  <div key={constraint} className="flex items-center space-x-2">
                    <Checkbox
                      id={`constraint-${constraint}`}
                      checked={(formState.languageStyleConstraints || []).includes(constraint)}
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
          )}

          {/* Output Structure - HIDE in Smart Mode */}
          {!isSmartMode && (
            <div className="mb-6">
              <label htmlFor="outputStructure" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Output Structure
              </label>
              <DraggableStructuredInput
                value={formState.outputStructure || []}
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
                  {formState.wordCount === 'Custom' && 
                   formState.customWordCount && 
                   Math.abs(totalStructureWordCount - formState.customWordCount) > formState.customWordCount * 0.1 && (
                    <div className="text-xs text-yellow-600 dark:text-yellow-400">
                      {formState.prioritizeWordCount 
                        ? "Structure word counts will take priority with strict adherence enabled."
                        : "Differs from custom word count"}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* STRATEGIC MESSAGING SECTION */}
      <div className={`space-y-6 mb-8 ${displayMode === 'populated' && !hasPopulatedStrategicMessagingFields() ? 'hidden' : ''}`}>
        <div>
          <Tooltip content="Define the key message, emotions, and SEO keywords to guide your copy's core message and impact." delayDuration={300}>
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-4 pb-2 border-b border-gray-300 dark:border-gray-700 flex items-center">
              <div className="w-1 h-5 bg-primary-500 mr-2"></div>
              Strategic Messaging
            </h3>
          </Tooltip>
          
          {/* Key Message */}
          <div className={`mb-6 ${displayMode === 'populated' && !isFieldPopulated(formState.keyMessage) ? 'hidden' : ''}`}>
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="keyMessage" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Key Message
              </label>
              <SuggestionButton
                fieldType="keyMessage"
                businessDescription={formState.originalCopy || ''}
                onGetSuggestion={onGetSuggestion}
                isLoading={isLoadingSuggestions && activeSuggestionField === 'keyMessage'}
              />
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
            />
          </div>

          {/* Grid for smaller inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
            {/* Desired Emotion - HIDE in Smart Mode */}
            {!isSmartMode && (displayMode === 'all' || isFieldPopulated(formState.desiredEmotion)) && (
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label htmlFor="desiredEmotion" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Desired Emotion
                  </label>
                  <SuggestionButton
                    fieldType="desiredEmotion"
                    businessDescription={formState.originalCopy || ''}
                    onGetSuggestion={onGetSuggestion}
                    isLoading={isLoadingSuggestions && activeSuggestionField === 'desiredEmotion'}
                  />
                </div>
                <TagInput
                  id="desiredEmotion"
                  name="desiredEmotion"
                  placeholder="e.g., Trust, Excitement, Relief..."
                  value={desiredEmotionField.inputValue}
                  onChange={desiredEmotionField.setInputValue}
                />
              </div>
            )}

            {/* Call to Action */}
            <div className={`${isSmartMode ? 'col-span-full' : ''} ${displayMode === 'populated' && !isFieldPopulated(formState.callToAction) ? 'hidden' : ''}`}>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="callToAction" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Call to Action
                </label>
                <SuggestionButton
                  fieldType="callToAction"
                  businessDescription={formState.originalCopy || ''}
                  onGetSuggestion={onGetSuggestion}
                  isLoading={isLoadingSuggestions && activeSuggestionField === 'callToAction'}
                />
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
          {!isSmartMode && (displayMode === 'all' || isFieldPopulated(formState.brandValues)) && (
            <div className="mb-6">
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="brandValues" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Brand Values
                </label>
                <SuggestionButton
                  fieldType="brandValues"
                  businessDescription={formState.originalCopy || ''}
                  onGetSuggestion={onGetSuggestion}
                  isLoading={isLoadingSuggestions && activeSuggestionField === 'brandValues'}
                />
              </div>
              <TagInput
                id="brandValues"
                name="brandValues"
                placeholder="e.g., Innovation, Reliability, Sustainability"
                value={brandValuesField.inputValue}