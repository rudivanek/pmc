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
import { DEFAULT_FORM_STATE } from './constants';
import { v4 as uuidv4 } from 'uuid';

const AppRouter: React.FC = () => {
  const { currentUser, isInitialized, initError, handleLogin, handleLogout, fallbackToDemoMode } = useAuth();
  const { formState, setFormState, loadFormStateFromTemplate, loadFormStateFromSession, loadFormStateFromSavedOutput, loadFormStateFromPrefill } = useFormState();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Display mode state for form field filtering
  const [displayMode, setDisplayMode] = useState<'all' | 'populated'>('all');
  
  // State for managing loaded template
  const [loadedTemplateId, setLoadedTemplateId] = useState<string | null>(null);
  const [loadedTemplateName, setLoadedTemplateName] = useState<string>('');
  
  // State for managing modals
  const [isSaveTemplateModalOpen, setIsSaveTemplateModalOpen] = useState(false);
  const [isTemplateSuggestionModalOpen, setIsTemplateSuggestionModalOpen] = useState(false);
  
  // State for managing prompts display
  const [showPrompts, setShowPrompts] = useState(false);
  const [prompts, setPrompts] = useState<any[]>([]);
  const [isLoadingPrompts, setIsLoadingPrompts] = useState(false);
  
  // State for managing evaluation
  const [evaluationResult, setEvaluationResult] = useState<any>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  
  // State for managing operations
  const [isOperationCancelled, setIsOperationCancelled] = useState(false);

  const handleEvaluateInputs = async () => {
    if (!currentUser) return;
    
    setIsEvaluating(true);
    setIsOperationCancelled(false);
    
    try {
      const result = await evaluatePrompt(formState, currentUser.id);
      if (!isOperationCancelled) {
        setEvaluationResult(result);
      }
    } catch (error) {
      if (!isOperationCancelled) {
        console.error('Error evaluating inputs:', error);
        toast.error('Failed to evaluate inputs');
      }
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleSaveOutput = async (outputData: any) => {
    if (!currentUser) return;
    
    try {
      const savedOutput = await saveSavedOutput({
        user_id: currentUser.id,
        name: outputData.name,
        output_data: outputData.data,
        form_state: formState
      });
      
      if (savedOutput) {
        toast.success('Output saved successfully!');
      }
    } catch (error) {
      console.error('Error saving output:', error);
      toast.error('Failed to save output');
    }
  };

  const handleViewPrompts = async () => {
    if (!currentUser) return;
    
    setIsLoadingPrompts(true);
    setShowPrompts(true);
    
    try {
      const promptsData = await getLastPrompts(currentUser.id);
      setPrompts(promptsData || []);
    } catch (error) {
      console.error('Error fetching prompts:', error);
      toast.error('Failed to load prompts');
      setPrompts([]);
    } finally {
      setIsLoadingPrompts(false);
    }
  };

  const handleCancelOperation = () => {
    setIsOperationCancelled(true);
    setIsEvaluating(false);
  };

  const handleSaveTemplate = async (templateData: any) => {
    if (!currentUser) return;
    
    try {
      const template = await saveTemplate({
        user_id: currentUser.id,
        name: templateData.name,
        description: templateData.description,
        form_state: formState,
        is_public: templateData.isPublic || false
      });
      
      if (template) {
        setLoadedTemplateId(template.id);
        setLoadedTemplateName(template.name);
        toast.success('Template saved successfully!');
        setIsSaveTemplateModalOpen(false);
      }
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Failed to save template');
    }
  };

  // Track user's last visited page and save to localStorage
  React.useEffect(() => {
    if (currentUser && (location.pathname === '/dashboard' || location.pathname === '/copy-maker')) {
      localStorage.setItem('lastVisitedPage', location.pathname);
    }
  }, [location.pathname, currentUser]);

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (initError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Connection Error</h2>
            <p className="text-red-600 mb-4">{initError}</p>
            <button
              onClick={fallbackToDemoMode}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Continue in Demo Mode
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Routes>
        <Route 
          path="/" 
          element={
            currentUser ? (() => {
              const lastVisitedPage = localStorage.getItem('lastVisitedPage');
              const targetPath = lastVisitedPage === '/dashboard' ? '/dashboard' : '/copy-maker';
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
        <Route 
          path="/manage-users" 
          element={
            currentUser ? (
            <ManageUsers currentUser={currentUser} onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
        <Route 
          path="/manage-prefills" 
          element={
            currentUser ? (
            <ManagePrefills currentUser={currentUser} onLogout={handleLogout} />
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
        <Route path="/guide" element={<StepByStepGuide />} />
        <Route path="*" element={<NotFound />} />
      </Routes>

      {/* URL Parameter Loader */}
      <UrlParamLoader
        loadFormStateFromTemplate={loadFormStateFromTemplate}
        loadFormStateFromSession={loadFormStateFromSession}
        loadFormStateFromSavedOutput={loadFormStateFromSavedOutput}
        setLoadedTemplateId={setLoadedTemplateId}
        setLoadedTemplateName={setLoadedTemplateName}
      />

      {/* Save Template Modal */}
      {isSaveTemplateModalOpen && (
        <SaveTemplateModal
          isOpen={isSaveTemplateModalOpen}
          onClose={() => setIsSaveTemplateModalOpen(false)}
          onSave={handleSaveTemplate}
          currentTemplateName={loadedTemplateName}
        />
      )}

      {/* Template Suggestion Modal */}
      {isTemplateSuggestionModalOpen && (
        <TemplateSuggestionModal
          isOpen={isTemplateSuggestionModalOpen}
          onClose={() => setIsTemplateSuggestionModalOpen(false)}
          onSaveTemplate={() => {
            setIsTemplateSuggestionModalOpen(false);
            setIsSaveTemplateModalOpen(true);
          }}
        />
      )}

      {/* Prompts Display Modal */}
      {showPrompts && (
        <PromptDisplay
          prompts={prompts}
          isLoading={isLoadingPrompts}
          onClose={() => setShowPrompts(false)}
        />
      )}

      {/* Evaluation Result Modal */}
      {evaluationResult && (
        <PromptEvaluation
          result={evaluationResult}
          onClose={() => setEvaluationResult(null)}
          onSaveOutput={handleSaveOutput}
        />
      )}

      {/* Cookie Consent */}
      <CookieConsent />

      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#4ade80',
              secondary: '#fff',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </>
  );
};

export default AppRouter;