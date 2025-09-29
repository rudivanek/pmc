import React, { useState, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { Lightbulb } from 'lucide-react';

// Component imports
import CopyForm from '../../CopyForm';
import AppSpinner from '../../ui/AppSpinner';
import FloatingActionBar from '../../FloatingActionBar';
import UrlParamLoader from '../../UrlParamLoader';

// Section components
import HeaderBar from './sections/HeaderBar';
import TemplateLoader from './sections/TemplateLoader';
import QuickStartPicker from './sections/QuickStartPicker';
import ResultsPanel from './sections/ResultsPanel';
import EmptyState from './sections/EmptyState';

// Modal components
import PrefillSaveDialog from './modals/PrefillSaveDialog';
import JsonLdViewer from './modals/JsonLdViewer';

// Custom hooks
import { usePrefillEditing } from './hooks/usePrefillEditing';
import { useTemplates } from './hooks/useTemplates';
import { useGeneration } from './hooks/useGeneration';
import { useExports } from './hooks/useExports';

// Utils
import { mapPrefillToFormState } from './utils/mapPrefillToFormState';

// Types
import { FormState, User } from '../../../types';
import { calculateTargetWordCount } from '../../../services/api/utils';

interface CopyMakerTabProps {
  currentUser?: User;
  formState: FormState;
  setFormState: (state: FormState) => void;
  onClearAll: () => void;
  loadedTemplateId: string | null;
  setLoadedTemplateId: (id: string | null) => void;
  loadedTemplateName: string;
  setLoadedTemplateName: (name: string) => void;
  isSmartMode: boolean;
  onEvaluateInputs?: () => void;
  onSaveTemplate?: () => void;
  onSaveOutput?: () => void;
  onViewPrompts?: () => void;
  onCancel?: () => void;
  onOpenTemplateSuggestion?: () => void;
  loadFormStateFromPrefill: any;
  loadFormStateFromTemplate: any;
  displayMode: 'all' | 'populated';
  setDisplayMode: (mode: 'all' | 'populated') => void;
  addProgressMessage: (message: string) => void;
}

const CopyMakerTab: React.FC<CopyMakerTabProps> = ({
  currentUser,
  formState,
  setFormState,
  onClearAll,
  loadedTemplateId,
  setLoadedTemplateId,
  loadedTemplateName,
  setLoadedTemplateName,
  isSmartMode,
  displayMode,
  setDisplayMode,
  onEvaluateInputs,
  onSaveTemplate,
  onSaveOutput,
  onViewPrompts,
  onCancel,
  onOpenTemplateSuggestion = () => {},
  loadFormStateFromTemplate,
  loadFormStateFromPrefill,
  addProgressMessage,
}) => {
  // URL loaders (session / saved-output fallbacks)
  const loadFormStateFromSession = React.useCallback((session: any) => {
    if (!session || !session.input_data) {
      console.error('Invalid session data:', session);
      return;
    }
    setFormState(prevState => {
      const inputData = session.input_data;
      return {
        ...prevState,
        ...inputData,
        sessionId: session.id,
        customerId: session.customer_id || undefined,
        customerName: session.customer?.name || undefined,
        copyResult: { generatedVersions: [] },
        isLoading: false,
        isEvaluating: false,
        generationProgress: [],
      };
    });
    toast.success('Session loaded successfully!');
  }, [setFormState]);

  const loadFormStateFromSavedOutput = React.useCallback((savedOutput: any) => {
    if (!savedOutput || !savedOutput.input_snapshot || !savedOutput.output_content) {
      console.error('Invalid saved output data:', savedOutput);
      return;
    }
    setFormState(prevState => {
      const inputSnapshot = savedOutput.input_snapshot;
      return {
        ...prevState,
        ...inputSnapshot,
        customerId: savedOutput.customer_id || undefined,
        customerName: savedOutput.customer?.name || undefined,
        copyResult: savedOutput.output_content,
        isLoading: false,
        isEvaluating: false,
        generationProgress: [],
      };
    });
    toast.success('Saved output loaded successfully!');
  }, [setFormState]);

  // Modals
  const [showJsonLdModal, setShowJsonLdModal] = useState(false);
  const [jsonLdContent, setJsonLdContent] = useState('');
  const [showSavePrefillModal, setShowSavePrefillModal] = useState(false);

  // Refs for focusing
  const projectDescriptionRef = useRef<HTMLInputElement>(null);
  const businessDescriptionRef = useRef<HTMLTextAreaElement>(null);
  const originalCopyRef = useRef<HTMLTextAreaElement>(null);

  // Hooks
  const {
    isPrefillEditingMode,
    prefillEditingData,
    handleSavePrefill,
    handleCancelPrefillEditing
  } = usePrefillEditing(currentUser, formState, loadFormStateFromPrefill);

  const {
    filteredAndGroupedTemplates,
    selectedTemplateId,
    setSelectedTemplateId,
    templateSearchQuery,
    setTemplateSearchQuery,
    isLoadingTemplates,
    templateLoadError,
    handleTemplateSelection
  } = useTemplates(currentUser, loadFormStateFromTemplate, setLoadedTemplateId, setLoadedTemplateName, onClearAll);

  const {
    handleGenerate,
    handleOnDemandGeneration,
    handleModifyContent,
    handleGenerateFaqSchema: baseHandleGenerateFaqSchema,
    handleCancelOperation
  } = useGeneration(currentUser, formState, setFormState, addProgressMessage);

  const {
    isExporting,
    handleExportForm,
    isImporting,
    handleImportForm
  } = useExports(formState, setFormState);

  const handleGenerateFaqSchema = async (content: string) => {
    await baseHandleGenerateFaqSchema(content);
  };

  const handleApplyPrefill = (prefill: { id: string; label: string; data: Partial<FormState> }) => {
    mapPrefillToFormState(prefill.data, formState, setFormState, setDisplayMode);
  };

  const handleClearAllOverride = () => {
    onClearAll();
    setSelectedTemplateId('');
    setTemplateSearchQuery('');
    setLoadedTemplateId(null);
    setLoadedTemplateName('');
  };

  return (
    <div className="relative min-h-screen">
      {/* URL Parameter Loader */}
      <UrlParamLoader
        currentUser={currentUser}
        isInitialized={true}
        formState={formState}
        setFormState={setFormState}
        loadFormStateFromTemplate={loadFormStateFromTemplate}
        loadFormStateFromSession={loadFormStateFromSession}
        loadFormStateFromSavedOutput={loadFormStateFromSavedOutput}
        addProgressMessage={addProgressMessage}
        setLoadedTemplateId={setLoadedTemplateId}
        setLoadedTemplateName={setLoadedTemplateName}
        setDisplayMode={setDisplayMode}
      />

      {/* Main Content */}
      <div className="space-y-8 px-8 md:px-12 lg:px-16">
        {/* Prefill & Template Bar */}
        <div className="bg-white dark:bg-black border border-gray-300 dark:border-gray-800 rounded-lg p-3 sm:p-6">
          <HeaderBar
            isExporting={isExporting}
            onExport={handleExportForm}
            isImporting={isImporting}
            onImport={handleImportForm}
            onClearAll={() => {
              handleClearAllOverride();
              setDisplayMode('all');
            }}
            isClearDisabled={isExporting || (!formState.businessDescription?.trim() && !formState.originalCopy?.trim()) || formState.isLoading}
          />

          {/* Row: Saved Template | Quick Start | AI Prompt (right card) */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch">
            {/* Load Saved Template */}
            <div className="flex-1 min-w-0">
              <TemplateLoader
                templateLoadError={templateLoadError}
                isLoadingTemplates={isLoadingTemplates}
                templateSearchQuery={templateSearchQuery}
                setTemplateSearchQuery={setTemplateSearchQuery}
                filteredAndGroupedTemplates={filteredAndGroupedTemplates}
                selectedTemplateId={selectedTemplateId}
                onSelectTemplate={handleTemplateSelection}
              />
            </div>

            {/* Load Quick Start Template */}
            <div className="flex-1 min-w-0">
              <QuickStartPicker
                formState={formState}
                onApplyPrefill={handleApplyPrefill}
              />
            </div>

            {/* AI Prompt – standalone right-side container */}
            <div className="w-full sm:w-48 shrink-0">
              <div className="h-full p-3 sm:p-4 bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800 rounded-lg flex items-end">
                <button
                  type="button"
                  onClick={onOpenTemplateSuggestion}
                  className="bg-white dark:bg-black border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-xs rounded-lg focus:ring-primary-500 focus:border-primary-500 w-full p-2 sm:p-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors inline-flex items-center justify-center whitespace-nowrap"
                  disabled={!currentUser}
                  title="Generate template JSON from natural language"
                >
                  <Lightbulb size={14} className="mr-1" />
                  <span className="hidden sm:inline">AI Prompt</span>
                  <span className="sm:hidden">AI</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Form Section */}
        <div>
          <CopyForm
            currentUser={currentUser}
            formState={formState}
            setFormState={setFormState}
            onGenerate={isPrefillEditingMode ? undefined : handleGenerate}
            onClearAll={handleClearAllOverride}
            loadedTemplateId={loadedTemplateId}
            setLoadedTemplateId={setLoadedTemplateId}
            loadedTemplateName={loadedTemplateName}
            setLoadedTemplateName={setLoadedTemplateName}
            isSmartMode={isSmartMode}
            onEvaluateInputs={onEvaluateInputs}
            onSaveTemplate={onSaveTemplate}
            loadFormStateFromPrefill={loadFormStateFromPrefill}
            projectDescriptionRef={projectDescriptionRef}
            businessDescriptionRef={businessDescriptionRef}
            originalCopyRef={originalCopyRef}
            isPrefillEditingMode={isPrefillEditingMode}
            displayMode={displayMode}
            setDisplayMode={setDisplayMode}
          />

          {/* Prefill Action Buttons */}
          {isPrefillEditingMode && (
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => setShowSavePrefillModal(true)}
                className="w-full bg-primary-600 hover:bg-primary-500 text-white font-medium text-base px-5 py-3.5 transition-colors flex items-center justify-center"
              >
                Save Prefill
              </button>
              <button
                onClick={handleCancelPrefillEditing}
                className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 font-medium text-base px-5 py-3 transition-colors flex items-center justify-center"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Results Section */}
        <div>
          {formState.copyResult?.generatedVersions && formState.copyResult.generatedVersions.length > 0 ? (
            <ResultsPanel
              generatedVersions={formState.copyResult.generatedVersions}
              formState={formState}
              currentUser={currentUser}
              onAlternative={(item) => handleOnDemandGeneration('alternative', item)}
              onRestyle={(item, persona) => handleOnDemandGeneration('restyle', item, persona)}
              onScore={(item) => handleOnDemandGeneration('score', item)}
              onGenerateFaqSchema={handleGenerateFaqSchema}
              onModify={handleModifyContent}
              targetWordCount={calculateTargetWordCount(formState).target}
            />
          ) : (
            <EmptyState />
          )}
        </div>
      </div>

      {/* Floating Action Bar */}
      {formState.copyResult?.generatedVersions && formState.copyResult.generatedVersions.length > 0 && (
        <FloatingActionBar
          formState={formState}
          generatedOutputCards={formState.copyResult.generatedVersions}
          currentUser={currentUser}
          onSaveOutput={onSaveOutput || (() => toast.info('Save output not available'))}
          onViewPrompts={onViewPrompts || (() => toast.info('View prompts not available'))}
          onGenerateFaqSchema={handleGenerateFaqSchema}
        />
      )}

      {/* Progress Modal */}
      <AppSpinner
        isLoading={formState.isLoading || formState.isEvaluating}
        message={formState.isLoading ? 'Generating copy...' : 'Evaluating inputs...'}
        progressMessages={formState.generationProgress}
        onCancel={onCancel || handleCancelOperation}
      />

      {/* Save Prefill Modal */}
      {showSavePrefillModal && prefillEditingData && (
        <PrefillSaveDialog
          isOpen={showSavePrefillModal}
          onClose={() => setShowSavePrefillModal(false)}
          onSave={handleSavePrefill}
          mode={prefillEditingData.mode}
          initialLabel={prefillEditingData.originalLabel || ''}
          currentUser={currentUser}
        />
      )}

      {/* JSON-LD Modal */}
      {showJsonLdModal && (
        <JsonLdViewer
          isOpen={showJsonLdModal}
          onClose={() => setShowJsonLdModal(false)}
          jsonLd={jsonLdContent}
        />
      )}
    </div>
  );
};

export default CopyMakerTab;

