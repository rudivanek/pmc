import React, { useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { toast } from 'react-hot-toast';
import { X, Copy, Check } from 'lucide-react';
import { useAuth } from './hooks/useAuth';
import HomePage from './components/HomePage';
import Login from './components/Login';
import MainMenu from './components/MainMenu';
import Dashboard from './components/Dashboard';
import Features from './components/Features';
import Documentation from './components/Documentation';
import Privacy from './components/Privacy';
import App from './components/App';
import CopyMakerTab from './components/CopyMakerTab';
import ManageUsers from './components/ManageUsers';
import PromptDisplay from './components/PromptDisplay';
import UrlParamLoader from './components/UrlParamLoader';
import SaveTemplateModal from './components/SaveTemplateModal';
import PromptEvaluation from './components/results/PromptEvaluation';
import CookieConsent from './components/CookieConsent';
import NotFound from './components/NotFound';
import FAQ from './components/FAQ';
import BetaThanks from './components/BetaThanks';
import StepByStepGuide from './components/StepByStepGuide';
import ManagePrefills from './components/ManagePrefills';
import TemplateSuggestionModal from './components/TemplateSuggestionModal';
import { getLastPrompts, evaluatePrompt } from './services/apiService';
import { getCopySession, getTemplate, getSavedOutput, saveTemplate, saveSavedOutput } from './services/supabaseClient';
import { checkUserAccess } from './services/supabaseClient';
import { useFormState } from './hooks/useFormState';
import { useMode } from './context/ModeContext';
import { DEFAULT_FORM_STATE } from './constants';
import { v4 as uuidv4 } from 'uuid';

const AppRouter: React.FC = () => {
  const { currentUser, isInitialized, initError, handleLogin, handleLogout, fallbackToDemoMode } = useAuth();
  const { formState, setFormState, loadFormStateFromTemplate, loadFormStateFromSession, loadFormStateFromSavedOutput, loadFormStateFromPrefill } = useFormState();
  const { isSmartMode } = useMode();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Display mode state for form field filtering
  const [displayMode, setDisplayMode] = useState<'all' | 'populated'>('all');
  
  // Prompt modal state
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [userPrompt, setUserPrompt] = useState('');

  // Template management state
  const [loadedTemplateId, setLoadedTemplateId] = useState<string | null>(null);
  const [loadedTemplateName, setLoadedTemplateName] = useState<string>('');
  const [isSaveTemplateModalOpen, setIsSaveTemplateModalOpen] = useState(false);
  const [isTemplateSuggestionModalOpen, setIsTemplateSuggestionModalOpen] = useState(false);
  
  // Evaluation modal state
  const [showEvaluationModal, setShowEvaluationModal] = useState(false);
  const [evaluationCopied, setEvaluationCopied] = useState(false);

  // Progress callback
  const addProgressMessage = React.useCallback((message: string) => {
    setFormState(prevState => ({
      ...prevState,
      generationProgress: [...prevState.generationProgress, message]
    }));
  }, [setFormState]);

  // Track user's last visited page and save to localStorage
  React.useEffect(() => {
    if (currentUser && (location.pathname === '/dashboard' || location.pathname === '/copy-maker')) {
      localStorage.setItem('lastVisitedPage', location.pathname);
    }
  }, [location.pathname, currentUser]);

  // Enhanced logout handler that navigates to homepage
  const handleEnhancedLogout = async () => {
    await handleLogout();
    navigate('/');
  };
  
  // Handle viewing prompts
  const handleViewPrompts = () => {
    const { systemPrompt, userPrompt } = getLastPrompts();
    setSystemPrompt(systemPrompt);
    setUserPrompt(userPrompt);
    setShowPromptModal(true);
  };

  // Handle evaluate inputs
  const handleEvaluateInputs = async () => {
    if (!currentUser) {
      toast.error('Please log in to evaluate inputs.');
      return;
    }
    
    // Check user access before evaluating inputs
    try {
      const accessResult = await checkUserAccess(currentUser.id, currentUser.email || '');
      
      if (!accessResult.hasAccess) {
        toast.error(accessResult.message);
        return;
      }
    } catch (error) {
      console.error('Error checking user access for input evaluation:', error);
      toast.error("Unable to verify access. Please try again.");
      return;
    }
    
    setFormState(prev => ({ ...prev, isEvaluating: true, generationProgress: [] }));
    addProgressMessage('Evaluating inputs...');
    try {
      const evaluation = await evaluatePrompt(formState, currentUser, addProgressMessage, formState.sessionId);
      setFormState(prev => ({ ...prev, promptEvaluation: evaluation }));
      toast.success('Inputs evaluated successfully!');
      setShowEvaluationModal(true);
    } catch (error: any) {
      console.error('Error evaluating inputs:', error);
      toast.error(`Failed to evaluate inputs: ${error.message}`);
    } finally {
      setFormState(prev => ({ ...prev, isEvaluating: false }));
      addProgressMessage('Input evaluation complete.');
    }
  };

  // Handle cancelling operations
  const handleCancelOperation = () => {
    const isGenerating = formState.isLoading;
    const isEvaluating = formState.isEvaluating;
    
    const operationType = isGenerating ? 'copy generation' : 'input evaluation';
    
    // Show confirmation dialog
    if (window.confirm(`Are you sure you want to cancel the ${operationType}?`)) {
      setFormState(prev => ({
        ...prev,
        isLoading: false,
        isEvaluating: false,
        generationProgress: [...prev.generationProgress, `${operationType} cancelled by user.`]
      }));
      toast.success(`${operationType.charAt(0).toUpperCase() + operationType.slice(1)} cancelled`);
    }
  };

  // Handle save template
  const handleSaveTemplate = async (templateName: string, description: string, formStateToSave: FormState, forceSaveAsNew?: boolean, category: string) => {
    console.log('🎯 HANDLE SAVE TEMPLATE CALLED');
    console.log('Template name:', templateName);
    console.log('Force save as new:', forceSaveAsNew);
    console.log('Form state public fields:', {
      is_public: formStateToSave.is_public,
      public_name: formStateToSave.public_name,
      public_description: formStateToSave.public_description
    });
    
    if (!currentUser || !currentUser.id) {
      toast.error('You must be logged in to save templates.');
      return;
    }

    setFormState(prev => ({ ...prev, isLoading: true }));
    addProgressMessage('Saving template...');

    try {
      const templateData = {
        user_id: currentUser.id,
        template_name: templateName,
        description: description,
        language: formStateToSave.language,
        tone: formStateToSave.tone,
        word_count: formStateToSave.wordCount,
        custom_word_count: formStateToSave.customWordCount,
        target_audience: formStateToSave.targetAudience,
        key_message: formStateToSave.keyMessage,
        desired_emotion: formStateToSave.desiredEmotion,
        call_to_action: formStateToSave.callToAction,
        brand_values: formStateToSave.brandValues,
        keywords: formStateToSave.keywords,
        context: formStateToSave.context,
        brief_description: formStateToSave.briefDescription,
        page_type: formStateToSave.pageType,
        section: formStateToSave.section,
        business_description: formStateToSave.businessDescription,
        original_copy: formStateToSave.originalCopy,
        template_type: formStateToSave.tab,
        competitor_urls: formStateToSave.competitorUrls,
        output_structure: formStateToSave.outputStructure?.map(item => item.value),
        product_service_name: formStateToSave.productServiceName,
        industry_niche: formStateToSave.industryNiche,
        tone_level: formStateToSave.toneLevel,
        reader_funnel_stage: formStateToSave.readerFunnelStage,
        competitor_copy_text: formStateToSave.competitorCopyText,
        target_audience_pain_points: formStateToSave.targetAudiencePainPoints,
        preferred_writing_style: formStateToSave.preferredWritingStyle,
        language_style_constraints: formStateToSave.languageStyleConstraints,
        excluded_terms: formStateToSave.excludedTerms,
        generateHeadlines: formStateToSave.generateHeadlines,
        generateScores: formStateToSave.generateScores,
        selectedPersona: formStateToSave.selectedPersona,
        numberOfHeadlines: formStateToSave.numberOfHeadlines,
        forceElaborationsExamples: formStateToSave.forceElaborationsExamples,
        forceKeywordIntegration: formStateToSave.forceKeywordIntegration,
        prioritizeWordCount: formStateToSave.prioritizeWordCount,
        adhereToLittleWordCount: formStateToSave.adhereToLittleWordCount,
        littleWordCountTolerancePercentage: formStateToSave.littleWordCountTolerancePercentage,
        project_description: formStateToSave.projectDescription,
        // Public template fields from formStateToSave
        is_public: formStateToSave.is_public,
        public_name: formStateToSave.public_name,
        public_description: formStateToSave.public_description,
        category: category, // Add the category parameter
      };

      // If forceSaveAsNew is true, pass undefined to create a new template
      // Otherwise, use the loadedTemplateId to update existing template
      const templateIdToUse = forceSaveAsNew ? undefined : (loadedTemplateId || undefined);
      const { error, updated, id } = await saveTemplate(templateData, templateIdToUse);

      if (error) throw error;

      if (updated) {
        toast.success('Template updated successfully!');
        addProgressMessage('Template updated.');
      } else {
        toast.success('Template saved successfully!');
        addProgressMessage('Template saved.');
        setLoadedTemplateId(id || null);
        setLoadedTemplateName(templateName);
      }
      setIsSaveTemplateModalOpen(false);
    } catch (error: any) {
      console.error('Error saving template:', error);
      toast.error(`Failed to save template: ${error.message}`);
    } finally {
      setFormState(prev => ({ ...prev, isLoading: false }));
    }
  };

  // Handle save output
  const handleSaveOutput = async () => {
    if (!currentUser || !currentUser.id) {
      toast.error('You must be logged in to save outputs.');
      return;
    }
    if (!formState.copyResult || !formState.copyResult.generatedVersions || formState.copyResult.generatedVersions.length === 0) {
      toast.error('No content to save.');
      return;
    }

    setFormState(prev => ({ ...prev, isLoading: true }));
    addProgressMessage('Saving output...');

    try {
      const savedOutput = {
        user_id: currentUser.id,
        customer_id: formState.customerId || null,
        brief_description: formState.briefDescription || 'Untitled Output',
        language: formState.language,
        tone: formState.tone,
        model: formState.model,
        selected_persona: formState.selectedPersona || null,
        input_snapshot: formState,
        output_content: formState.copyResult,
        saved_at: new Date().toISOString(),
      };

      const { data, error } = await saveSavedOutput(savedOutput);

      if (error) throw error;

      toast.success('Output saved successfully!');
      addProgressMessage('Output saved to dashboard.');
    } catch (error: any) {
      console.error('Error saving output:', error);
      toast.error(`Failed to save output: ${error.message}`);
    } finally {
      setFormState(prev => ({ ...prev, isLoading: false }));
    }
  };

  // Handle copying evaluation suggestions
  const handleCopyEvaluation = () => {
    if (!formState.promptEvaluation) return;
    
    let copyText = `Input Evaluation Results\n\n`;
    copyText += `Quality Score: ${formState.promptEvaluation.score}/100\n\n`;
    
    if (formState.promptEvaluation.tips && formState.promptEvaluation.tips.length > 0) {
      copyText += `Improvement Suggestions:\n`;
      formState.promptEvaluation.tips.forEach((tip, index) => {
        copyText += `${index + 1}. ${tip}\n`;
      });
    }
    
    navigator.clipboard.writeText(copyText);
    setEvaluationCopied(true);
    setTimeout(() => setEvaluationCopied(false), 2000);
    toast.success('Evaluation copied to clipboard!');
  };

  // Handle applying template JSON to form
  const handleApplyTemplateToForm = (templateData: Partial<FormState>) => {
    // Filter out undefined, null, and empty string values to prevent overwriting valid form state
    const filteredTemplateData: Partial<FormState> = {};
    Object.entries(templateData).forEach(([key, value]) => {
      // Only include values that are not undefined, null, or empty strings
      if (value !== undefined && value !== null && value !== '') {
        filteredTemplateData[key as keyof FormState] = value;
      }
    });
    
    setFormState(prevState => ({
      ...prevState,
      ...filteredTemplateData,
      // Reset runtime states to provide clean state after applying template
      isLoading: false,
      isEvaluating: false,
      generationProgress: [],
      copyResult: null,
      promptEvaluation: null,
      sessionId: uuidv4() // Generate new session ID for the new template application
    }));
    toast.success('Template applied to form successfully!');
  };

  // Handle applying template JSON to form
  // Show loading screen while initializing
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-500 border-t-transparent animate-spin mb-4"></div>
          <p className="text-gray-700 dark:text-gray-300">
            {initError || "Initializing application..."}
          </p>
          {initError && (
            <button
              onClick={fallbackToDemoMode}
              className="mt-4 bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-md"
            >
              Continue in Demo Mode
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black overflow-x-hidden">
      {/* URL Parameter Loader - handles sessionId, templateId, savedOutputId */}
      <UrlParamLoader
        currentUser={currentUser}
        isInitialized={isInitialized}
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
      
      <MainMenu 
        userName={currentUser?.user_metadata?.name || currentUser?.email?.split('@')[0] || 'User'} 
        onLogout={handleEnhancedLogout}
        onOpenTemplateSuggestion={() => {
          // Check if we're on the copy-maker page
          if (location.pathname === '/copy-maker') {
            setIsTemplateSuggestionModalOpen(true);
          } else {
            toast('Template JSON Generator is only available on the Copy Maker page');
          }
        }}
      />
      
      <Routes>
        <Route 
          path="/" 
          element={
            currentUser ? (() => {
              const lastVisitedPage = localStorage.getItem('lastVisitedPage');
              const defaultPath = '/dashboard';
              const targetPath = (lastVisitedPage === '/dashboard' || lastVisitedPage === '/copy-maker') 
                ? lastVisitedPage 
                : defaultPath;
              return <Navigate to={targetPath} replace />;
            })() : <HomePage />
          } 
        />
        <Route 
          path="/login" 
          element={
            currentUser ? <Navigate to="/dashboard" replace /> : <Login onLogin={handleLogin} />
          } 
        />
        <Route 
          path="/dashboard" 
          element={
            currentUser ? (
            <Dashboard 
              userId={currentUser.id} 
              onLogout={handleLogout}
            />
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
        <Route 
          path="/app" 
          element={
            currentUser ? (
            <App onViewPrompts={handleViewPrompts} />
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
        <Route 
          path="/copy-maker" 
          element={
            currentUser ? (
            <CopyMakerTab
              currentUser={currentUser}
              formState={formState}
              setFormState={setFormState}
              onClearAll={() => setFormState(DEFAULT_FORM_STATE)}
              loadedTemplateId={loadedTemplateId}
              setLoadedTemplateId={setLoadedTemplateId}
              loadedTemplateName={loadedTemplateName}
              setLoadedTemplateName={setLoadedTemplateName}
              isSmartMode={isSmartMode}
              displayMode={displayMode}
              setDisplayMode={setDisplayMode}
              onEvaluateInputs={handleEvaluateInputs}
              onSaveTemplate={() => setIsSaveTemplateModalOpen(true)}
              onSaveOutput={handleSaveOutput}
              onViewPrompts={handleViewPrompts}
              onCancel={handleCancelOperation}
              loadFormStateFromPrefill={loadFormStateFromPrefill}
              loadFormStateFromTemplate={loadFormStateFromTemplate}
              isTemplateSuggestionModalOpen={isTemplateSuggestionModalOpen}
              setIsTemplateSuggestionModalOpen={setIsTemplateSuggestionModalOpen}
            />
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
        <Route path="/features" element={<Features />} />
        <Route path="/documentation" element={<Documentation />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/beta-thanks" element={<BetaThanks />} />
        <Route path="/step-by-step" element={<StepByStepGuide />} />
        <Route 
          path="/manage-users" 
          element={
            currentUser ? (
              <ManageUsers />
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
        <Route 
          path="/manage-prefills" 
          element={
            currentUser ? (
              <ManagePrefills />
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
      
      {/* Prompt Display Modal - available across all routes */}
      {showPromptModal && (
        <PromptDisplay
          systemPrompt={systemPrompt}
          userPrompt={userPrompt}
          onClose={() => setShowPromptModal(false)}
        />
      )}
      
      {/* Save Template Modal - available across all routes */}
      {isSaveTemplateModalOpen && (
        <SaveTemplateModal
          isOpen={isSaveTemplateModalOpen}
          onClose={() => setIsSaveTemplateModalOpen(false)}
          onSave={handleSaveTemplate}
          initialTemplateName={loadedTemplateName || formState.briefDescription || ''}
          initialDescription={formState.briefDescription || ''}
          formStateToSave={formState}
        />
      )}
      
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'var(--toastify-color-light)',
            color: 'var(--toastify-text-color-light)',
          },
        }}
      />
      
      {/* Evaluation Results Modal */}
      {showEvaluationModal && formState.promptEvaluation && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-300 dark:border-gray-700 max-w-2xl w-full max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-300 dark:border-gray-800">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Input Evaluation Results</h3>
              <button
                onClick={() => setShowEvaluationModal(false)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-grow overflow-auto p-0">
              <PromptEvaluation
                evaluation={formState.promptEvaluation}
                isLoading={formState.isEvaluating || false}
              />
            </div>
            
            <div className="p-4 border-t border-gray-300 dark:border-gray-800 flex justify-end">
              <button
                onClick={handleCopyEvaluation}
                className="bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-800 dark:text-white px-4 py-2 rounded-md text-sm mr-2 flex items-center"
              >
                {evaluationCopied ? (
                  <>
                    <Check size={16} className="mr-1.5 text-green-500 dark:text-green-400" />
                    <span className="text-green-500 dark:text-green-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={16} className="mr-1.5" />
                    Copy Suggestions
                  </>
                )}
              </button>
              <button
                onClick={() => setShowEvaluationModal(false)}
                className="bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-md text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
      {isTemplateSuggestionModalOpen && (
        <TemplateSuggestionModal
          isOpen={isTemplateSuggestionModalOpen}
          onClose={() => setIsTemplateSuggestionModalOpen(false)}
          currentUser={currentUser}
          onApplyToForm={handleApplyTemplateToForm}
        />
      )}
      
      {/* Cookie Consent Banner */}
      <CookieConsent />
    </div>
  );
};

export default AppRouter;