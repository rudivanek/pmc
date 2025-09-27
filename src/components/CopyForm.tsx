import React, { useState } from 'react';
import { FormState, User } from '../types';
import { MODELS } from '../constants';
import { DEFAULT_FORM_STATE } from '../constants';
import { GROUPED_PREFILLS } from '../constants/prefills';
import { toast } from 'react-hot-toast';
import { getAutoDisplayMode } from '../utils/formUtils';
import { checkUserAccess, getCustomers } from '../services/supabaseClient';
import { getSuggestions } from '../services/apiService';
import { useInputField } from '../hooks/useInputField';
import PrefillSelector from './PrefillSelector';
import CreateCopyForm from './CreateCopyForm';
import ImproveCopyForm from './ImproveCopyForm';
import SharedInputs from './SharedInputs';
import FeatureToggles from './FeatureToggles';
import GenerateButton from './GenerateButton';
import ClearButton from './ClearButton';
import SuggestionModal from './SuggestionModal';
import LoadingSpinner from './ui/LoadingSpinner';
import { Tooltip } from './ui/Tooltip';
import { Download, Upload, User as UserIcon, Plus, Zap, Save, Lightbulb, List, Filter } from 'lucide-react';

interface CopyFormProps {
  currentUser?: User;
  formState: FormState;
  setFormState: (state: FormState) => void;
  onGenerate: () => void;
  onClearAll: () => void;
  loadedTemplateId: string | null;
  setLoadedTemplateId: (id: string | null) => void;
  loadedTemplateName: string;
  setLoadedTemplateName: (name: string) => void;
  isSmartMode: boolean;
  onEvaluateInputs?: () => void;
  onSaveTemplate?: () => void;
  isPrefillEditingMode?: boolean;
  loadFormStateFromPrefill?: (prefill: any) => void;
  projectDescriptionRef?: React.RefObject<HTMLInputElement>;
  businessDescriptionRef?: React.RefObject<HTMLTextAreaElement>;
  originalCopyRef?: React.RefObject<HTMLTextAreaElement>;
  displayMode: 'all' | 'populated';
  setDisplayMode: (mode: 'all' | 'populated') => void;
}

const CopyForm: React.FC<CopyFormProps> = ({
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
  loadFormStateFromPrefill,
  projectDescriptionRef,
  businessDescriptionRef,
  originalCopyRef,
  displayMode,
  setDisplayMode
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
  const handleChange = (name: string, value: any) => {
    console.log('🎯 CopyForm handleChange called:', { name, value });
    
    if (name === 'customerId') {
      const selectedCustomer = customers.find(c => c.id === value);
      setFormState(prev => ({
        ...prev,
        customerId: value,
        customerName: selectedCustomer?.name || ''
      }));
    } else {
      console.log('🎯 Setting form state with:', { [name]: value });
      setFormState(prev => ({
        ...prev,
        [name]: value
      }));
    }
    console.log('🎯 Form state update completed');
  };

  // Wrapper for standard HTML elements that pass event objects
  const handleChangeEvent = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement | HTMLTextAreaElement>) => {
    console.log('🎯 CopyForm handleChangeEvent called:', { name: e.target.name, value: e.target.value });
    handleChange(e.target.name, e.target.value);
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

    const textToAnalyze = formState.tab === 'create' 
      ? formState.businessDescription || ''
      : formState.originalCopy || '';

    if (!textToAnalyze.trim()) {
      toast.error('Please enter business description or original copy first.');
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

  // Handle exporting form as JSON
  const handleExportForm = () => {
    setIsExporting(true);
    
    try {
      const exportData = {
        tab: formState.tab,
        language: formState.language,
        tone: formState.tone,
        wordCount: formState.wordCount,
        customWordCount: formState.customWordCount,
        businessDescription: formState.businessDescription,
        originalCopy: formState.originalCopy,
        pageType: formState.pageType,
        section: formState.section,
        productServiceName: formState.productServiceName,
        briefDescription: formState.briefDescription,
        projectDescription: formState.projectDescription,
        excludedTerms: formState.excludedTerms,
        industryNiche: formState.industryNiche,
        targetAudience: formState.targetAudience,
        readerFunnelStage: formState.readerFunnelStage,
        competitorUrls: formState.competitorUrls,
        targetAudiencePainPoints: formState.targetAudiencePainPoints,
        competitorCopyText: formState.competitorCopyText,
        keyMessage: formState.keyMessage,
        callToAction: formState.callToAction,
        desiredEmotion: formState.desiredEmotion,
        brandValues: formState.brandValues,
        keywords: formState.keywords,
        context: formState.context,
        toneLevel: formState.toneLevel,
        preferredWritingStyle: formState.preferredWritingStyle,
        languageStyleConstraints: formState.languageStyleConstraints,
        outputStructure: formState.outputStructure,
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
      const filename = `${projectDesc} & ${timestamp}.json`;
      
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
        
        // Auto-determine display mode based on populated fields
        const autoMode = getAutoDisplayMode(newFormState);
        setDisplayMode(autoMode);
        
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

  // Check if form is complete enough to generate
  const isFormComplete = () => {
    if (formState.tab === 'create') {
      return !!(formState.businessDescription?.trim() || formState.projectDescription?.trim());
    } else {
      return !!(formState.originalCopy?.trim() || formState.projectDescription?.trim());
    }
  };

  // Helper function to check if we should show floating buttons
  const shouldShowFloatingButtons = () => {
    // Show if we have any substantial content
    return !!(
      !isPrefillEditingMode && // Don't show in prefill editing mode
      formState.businessDescription?.trim() ||
      formState.originalCopy?.trim() ||
      formState.projectDescription?.trim() ||
      formState.briefDescription?.trim() ||
      formState.targetAudience?.trim() ||
      formState.keyMessage?.trim()
    );
  };
  // Handle content type button click
  const handleContentTypeClick = (prefillId: string) => {
    // Find the prefill across all groups
    let selectedPrefill = null;
    for (const group of GROUPED_PREFILLS) {
      const found = group.options.find(prefill => prefill.id === prefillId);
      if (found) {
        selectedPrefill = found;
        break;
      }
    }
    
    if (!selectedPrefill) return;

    // Use the existing prefill loading function if available
    if (loadFormStateFromPrefill) {
      loadFormStateFromPrefill({
        id: selectedPrefill.id,
        label: selectedPrefill.label,
        data: selectedPrefill.data
      });
    } else {
      // Fallback to manual state setting
      const newFormState: FormState = {
        ...DEFAULT_FORM_STATE,
        ...selectedPrefill.data,
        isLoading: false,
        isEvaluating: false,
        generationProgress: [],
        copyResult: DEFAULT_FORM_STATE.copyResult,
        promptEvaluation: undefined
      };
      setFormState(newFormState);
      
      // Auto-determine display mode based on populated fields
      const autoMode = getAutoDisplayMode(newFormState);
      setDisplayMode(autoMode);
    }
    
    toast.success(`Applied "${selectedPrefill.label}" template`);
  };

  // Popular content types for quick access
  const contentTypes = [
    { id: 'blog-post', label: 'Blog Post', icon: '📝', description: '1200 words with SEO optimization' },
    { id: 'homepage-copy', label: 'Homepage', icon: '🏠', description: '600 words with key sections' },
    { id: 'google-ads-copy', label: 'Ad Copy', icon: '📢', description: '45 words for Google Ads' },
    { id: 'email-content', label: 'Email', icon: '📧', description: '100-200 words for campaigns' },
    { id: 'landing-page-lead-gen', label: 'Landing Page', icon: '🎯', description: '400 words for lead generation' },
    { id: 'product-description-ecommerce', label: 'Product Description', icon: '🛍️', description: '300 words for e-commerce' }
  ];

  return (
    <div className="bg-white dark:bg-black border border-gray-300 dark:border-gray-800 rounded-lg p-3 sm:p-6 mx-2 sm:mx-4 lg:mx-24">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Copy Maker</h2>
        
        <div className="flex flex-col xs:flex-row items-end xs:items-center space-y-1 xs:space-y-0 xs:space-x-2">
          <button
            type="button"
            onClick={handleExportForm}
            disabled={isExporting || (!formState.businessDescription?.trim() && !formState.originalCopy?.trim())}
            className="flex items-center bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 px-2 py-1.5 rounded-md text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Export current form as JSON file"
          >
            {isExporting ? (
              <>
                <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin mr-2"></div>
                <span>Export...</span>
              </>
            ) : (
              <>
                <Download size={14} className="mr-1.5" />
                <span>Export</span>
              </>
            )}
          </button>
          
          <button
            type="button"
            onClick={handleImportForm}
            disabled={isImporting}
            className="flex items-center bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 px-2 py-1.5 rounded-md text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Import form from JSON file"
          >
            {isImporting ? (
              <>
                <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin mr-2"></div>
                <span>Import...</span>
              </>
            ) : (
              <>
                <Upload size={14} className="mr-1.5" />
                <span>Import</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Quick Start Templates Section */}
      <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800 rounded-lg">
        <label htmlFor="quickStartTemplate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Quick Start Templates
        </label>
        <select
          id="quickStartTemplate"
          name="quickStartTemplate"
          className="bg-white dark:bg-black border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5"
          value=""
          onChange={(e) => {
            if (e.target.value) {
              handleContentTypeClick(e.target.value);
              // Reset the dropdown after selection
              e.target.value = '';
            }
          }}
          disabled={formState.isLoading}
        >
          <option value="">— Choose a Content Type —</option>
          {contentTypes.map((type) => (
            <option key={type.id} value={type.id}>
              {type.icon} {type.label} - {type.description}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Select a content type to auto-fill the form with optimized settings
        </p>
      </div>
      
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
              onChange={handleChangeEvent}
            >
              {MODELS.map((model) => (
                <option key={model.value} value={model.value}>
                  {model.label}
                </option>
              ))}
            </select>
          </div>

          {/* Project Description */}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
            <div>
              <label htmlFor="customerId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Customer
              </label>
              <select
                id="customerId"
                name="customerId"
                className="bg-white dark:bg-black border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5"
                value={formState.customerId || ''}
                onChange={handleChangeEvent}
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

                    e.target.value = '';
                  }
                }}
                disabled={formState.isLoading}
              >
                <option value="">— Choose a Content Type —</option>
                {contentTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.icon} {type.label} - {type.description}
                  </option>
          <div>
            {formState.tab === 'create' ? (
              <CreateCopyForm
                formData={formState}
                handleChange={handleChange}
                currentUser={currentUser}
                onGetSuggestion={onGetSuggestion}
                isLoadingSuggestions={isLoadingSuggestions}
                activeSuggestionField={activeSuggestionField}
                handleScoreChange={(name, score) => setFormState(prev => ({ ...prev, [name]: score }))}
                displayMode={displayMode}
                businessDescriptionRef={businessDescriptionRef}
              />
            ) : (
              <ImproveCopyForm
                formData={formState}
                handleChange={handleChange}
                currentUser={currentUser}
                onGetSuggestion={onGetSuggestion}
                isLoadingSuggestions={isLoadingSuggestions}
                activeSuggestionField={activeSuggestionField}
                handleScoreChange={(name, score) => setFormState(prev => ({ ...prev, [name]: score }))}
                displayMode={displayMode}
                originalCopyRef={originalCopyRef}
              />
            )}
          </div>
        </div>
      </div>

      {/* Shared Inputs */}
      <SharedInputs
        formData={formState}
        handleChange={handleChange}
        handleToggle={handleToggle}
        currentUser={currentUser}
        onGetSuggestion={onGetSuggestion}
        displayMode={displayMode}
        isLoadingSuggestions={isLoadingSuggestions}
        activeSuggestionField={activeSuggestionField}
        isSmartMode={isSmartMode}
        setFormState={setFormState}
        displayMode={displayMode}
      />

      {/* Feature Toggles */}
      <FeatureToggles
        formData={formState}
        handleToggle={handleToggle}
        handleChange={handleChange}
        isSmartMode={isSmartMode}
        displayMode={displayMode}
      />

      {/* Action Buttons */}
      {!isPrefillEditingMode && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
          <GenerateButton
            onClick={onGenerate}
            isLoading={formState.isLoading}
            isDisabled={false}
          />
          <ClearButton
            onClick={onClearAll}
            isDisabled={formState.isLoading}
          />
        </div>
      )}

      {/* Floating Action Buttons for Evaluate and Save Template */}
      {shouldShowFloatingButtons() && (
        <div className="fixed top-1/2 left-2 sm:left-4 transform -translate-y-1/2 z-40">
          <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg p-1.5 sm:p-2 space-y-1.5 sm:space-y-2">
            {/* Evaluate Inputs */}
            {onEvaluateInputs && (
              <Tooltip content="Evaluate the quality of your input parameters">
                <button
                  onClick={onEvaluateInputs}
                  className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                  title="Evaluate Inputs"
                  disabled={formState.isEvaluating}
                >
                  <Zap size={14} className="sm:w-[18px] sm:h-[18px]" />
                </button>
              </Tooltip>
            )}

            {/* Save Template */}
            {onSaveTemplate && (
              <Tooltip content="Save current form configuration as template">
                <button
                  onClick={onSaveTemplate}
                  className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                  title="Save as Template"
                >
                  <Save size={14} className="sm:w-[18px] sm:h-[18px]" />
                </button>
              </Tooltip>
            )}
          </div>
        </div>
      )}


      {/* Display Mode Floating Buttons - Second Group */}
      {shouldShowFloatingButtons() && (
        <div className="fixed top-1/2 left-2 sm:left-4 transform translate-y-12 sm:translate-y-16 z-40">
          <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg p-1.5 sm:p-2 space-y-1.5 sm:space-y-2">
            {/* Toggle Display Mode */}
            <Tooltip content={displayMode === 'all' ? 'Show only populated fields' : 'Show all fields'}>
              <button
                onClick={() => setDisplayMode(displayMode === 'all' ? 'populated' : 'all')}
                className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                title={displayMode === 'all' ? 'Show only populated fields' : 'Show all fields'}
              >
                {displayMode === 'all' ? <Filter size={14} className="sm:w-[18px] sm:h-[18px]" /> : <List size={14} className="sm:w-[18px] sm:h-[18px]" />}
              </button>
            </Tooltip>
          </div>
        </div>
      )}

      {/* Suggestion Modal */}
      {showSuggestionModal && (
        <SuggestionModal
          fieldType={currentSuggestionField}
          suggestions={currentSuggestions}
          onClose={() => setShowSuggestionModal(false)}
          onInsert={handleInsertSuggestions}
          isLoading={isLoadingSuggestions}
        />
      )}
    </div>
  );
};

export default CopyForm;