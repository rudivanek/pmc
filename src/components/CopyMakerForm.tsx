import React, { useState } from 'react';
import { FormState, User } from '../types';
import { MODELS } from '../constants';
import { DEFAULT_FORM_STATE } from '../constants';
import { toast } from 'react-hot-toast';
import { checkUserAccess, getCustomers } from '../services/supabaseClient';
import { getSuggestions } from '../services/apiService';
import TemplateSelector from './TemplateSelector';
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
import useFormState from '../hooks/useFormState';

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
  isTemplateEditingMode?: boolean;
  projectDescriptionRef?: React.RefObject<HTMLInputElement>;
  businessDescriptionRef?: React.RefObject<HTMLTextAreaElement>;
  originalCopyRef?: React.RefObject<HTMLTextAreaElement>;
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
  isTemplateEditingMode = false,
  projectDescriptionRef,
  businessDescriptionRef,
  originalCopyRef
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

  // Get template loading function from useFormState
  const { loadFormStateFromTemplate } = useFormState();

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
      !isTemplateEditingMode && // Don't show in template editing mode
      formState.businessDescription?.trim() ||
      formState.originalCopy?.trim() ||
      formState.projectDescription?.trim() ||
      formState.briefDescription?.trim() ||
      formState.targetAudience?.trim() ||
      formState.keyMessage?.trim()
    );
  };

  return (
    <div className="bg-white dark:bg-black border border-gray-300 dark:border-gray-800 rounded-lg p-6 mx-24">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Copy Maker</h2>
        
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={handleExportForm}
            disabled={isExporting || (!formState.businessDescription?.trim() && !formState.originalCopy?.trim())}
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
      
      {/* Template Selector */}
      <TemplateSelector
        formState={formState}
        setFormState={setFormState}
        setDisplayMode={setDisplayMode}
        loadFormStateFromTemplate={loadFormStateFromTemplate}
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
              value={formState.projectDescription || ''}
              onChange={handleChange}
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
                value={formState.productServiceName || ''}
                onChange={handleChange}
            </div>
          </div>

          <div>
            <label htmlFor="briefDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Brief Description
            </label>
            <input
              type="text"
              id="briefDescription"
              name="briefDescription"
              className="bg-white dark:bg-black border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5"
              placeholder="Brief project description for your reference"
              value={formState.briefDescription || ''}
              onChange={handleChange}
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

      {/* Shared Inputs */}
      <SharedInputs
        formData={formState}
        handleChange={handleChange}
        handleToggle={handleToggle}
        currentUser={currentUser}
        onGetSuggestion={onGetSuggestion}
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
      {!isTemplateEditingMode && onGenerate && (
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
        <div className="fixed top-1/2 left-4 transform -translate-y-1/2 z-40">
          <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg p-2 space-y-2">
            {/* Evaluate Inputs */}
            {onEvaluateInputs && (
              <Tooltip content="Evaluate the quality of your input parameters">
                <button
                  onClick={onEvaluateInputs}
                  className="w-10 h-10 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                  title="Evaluate Inputs"
                  disabled={formState.isEvaluating}
                >
                  <Zap size={18} />
                </button>
              </Tooltip>
            )}

            {/* Save Template */}
            {onSaveTemplate && (
              <Tooltip content="Save current form configuration as template">
                <button
                  onClick={onSaveTemplate}
                  className="w-10 h-10 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                  title="Save as Template"
                >
                  <Save size={18} />
                </button>
              </Tooltip>
            )}
          </div>
        </div>
      )}

      {/* Display Mode Floating Buttons - Second Group */}
      {shouldShowFloatingButtons() && (
        <div className="fixed top-1/2 left-4 transform translate-y-16 z-40">
          <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg p-2 space-y-2">
            {/* Toggle Display Mode */}
            <Tooltip content={displayMode === 'all' ? 'Show only populated fields' : 'Show all fields'}>
              <button
                onClick={() => setDisplayMode(displayMode === 'all' ? 'populated' : 'all')}
                className="w-10 h-10 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                title={displayMode === 'all' ? 'Show only populated fields' : 'Show all fields'}
              >
                {displayMode === 'all' ? <Filter size={18} /> : <List size={18} />}
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

export default CopyMakerForm;