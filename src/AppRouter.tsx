@@ .. @@
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
-import App from './components/App';
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
-import { useMode } from './context/ModeContext';
 import { DEFAULT_FORM_STATE } from './constants';
 import { v4 as uuidv4 } from 'uuid';

 const AppRouter: React.FC = () => {
   const { currentUser, isInitialized, initError, handleLogin, handleLogout, fallbackToDemoMode } = useAuth();
   const { formState, setFormState, loadFormStateFromTemplate, loadFormStateFromSession, loadFormStateFromSavedOutput, loadFormStateFromPrefill } = useFormState();
-  const { isSmartMode } = useMode();
   const navigate = useNavigate();
   const location = useLocation();
   
   // Display mode state for form field filtering
   const [displayMode, setDisplayMode] = useState<'all' | 'populated'>('all');
@@ .. @@
         <Route 
           path="/" 
           element={
             currentUser ? (() => {
               const lastVisitedPage = localStorage.getItem('lastVisitedPage');
-              const defaultPath = '/dashboard';
-              const targetPath = (lastVisitedPage === '/dashboard' || lastVisitedPage === '/copy-maker') 
-                ? lastVisitedPage 
-                : defaultPath;
+              const targetPath = lastVisitedPage === '/dashboard' ? '/dashboard' : '/copy-maker';
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
-        <Route 
-          path="/app" 
-          element={
-            currentUser ? (
-            <App onViewPrompts={handleViewPrompts} />
-            ) : (
-              <Navigate to="/login" replace />
-            )
-          } 
-        />
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
-              isSmartMode={isSmartMode}
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
@@ .. @@
   // Track user's last visited page and save to localStorage
   React.useEffect(() => {
-    if (currentUser && (location.pathname === '/dashboard' || location.pathname === '/copy-maker')) {
+    if (currentUser && (location.pathname === '/dashboard' || location.pathname === '/copy-maker')) {
       localStorage.setItem('lastVisitedPage', location.pathname);
     }
   }, [location.pathname, currentUser]);