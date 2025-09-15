import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { getCopySession, getTemplate, getSavedOutput } from '../services/supabaseClient';
import { FormState, Template, CopySession, SavedOutput } from '../types';

interface UrlParamLoaderProps {
  currentUser: any;
  isInitialized: boolean;
  formState: FormState;
  setFormState: (state: FormState | ((prev: FormState) => FormState)) => void;
  loadFormStateFromTemplate: (template: Template) => void;
  loadFormStateFromSession: (session: CopySession) => void;
  loadFormStateFromSavedOutput: (savedOutput: SavedOutput) => void;
  addProgressMessage: (message: string) => void;
  setLoadedTemplateId: (id: string | null) => void;
  setLoadedTemplateName: (name: string) => void;
}

const UrlParamLoader: React.FC<UrlParamLoaderProps> = ({
  currentUser,
  isInitialized,
  formState,
  setFormState,
  loadFormStateFromTemplate,
  loadFormStateFromSession,
  loadFormStateFromSavedOutput,
  addProgressMessage,
  setLoadedTemplateId,
  setLoadedTemplateName,
  setDisplayMode
}) => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Load session or template from URL params
  useEffect(() => {
    const sessionId = searchParams.get('sessionId');
    const templateId = searchParams.get('templateId');
    const savedOutputId = searchParams.get('savedOutputId');

    const loadData = async () => {
      if (!currentUser || !currentUser.id) return;

      if (sessionId) {
        // Validate sessionId is a proper string/UUID
        if (typeof sessionId !== 'string' || sessionId.trim() === '') {
          console.error('Invalid session ID in URL:', sessionId);
          toast.error('Invalid session ID in URL. Please check the link.');
          setSearchParams({}); // Clear invalid parameter
          return;
        }

        addProgressMessage('Loading session...');
        setFormState(prev => ({ ...prev, isLoading: true }));
        try {
          const { data, error } = await getCopySession(sessionId);
          if (error) {
            if (error.code === 'PGRST116') {
              console.warn('Session not found:', sessionId);
              toast.error('Session not found. The link may be invalid or the session may have been deleted.');
            } else {
              throw error;
            }
            return;
          }
          if (data) {
            loadFormStateFromSession(data);
            toast.success('Session loaded successfully!');
          }
        } catch (error: any) {
          console.error('Error loading session:', error);
          toast.error(`Failed to load session: ${error.message}`);
        } finally {
          setFormState(prev => ({ ...prev, isLoading: false }));
          addProgressMessage('Session loading complete.');
          setSearchParams({}); // Clear param after loading
        }
      } else if (templateId) {
        // Validate templateId is a proper string/UUID
        if (typeof templateId !== 'string' || templateId.trim() === '') {
          console.error('Invalid template ID in URL:', templateId);
          toast.error('Invalid template ID in URL. Please check the link.');
          setSearchParams({}); // Clear invalid parameter
          return;
        }

        addProgressMessage('Loading template...');
        setFormState(prev => ({ ...prev, isLoading: true }));
        try {
          const { data, error } = await getTemplate(templateId);
          if (error) {
            if (error.code === 'PGRST116') {
              console.warn('Template not found:', templateId);
              toast.error('Template not found. The link may be invalid or the template may have been deleted.');
            } else {
              throw error;
            }
            return;
          }
          if (data) {
            loadFormStateFromTemplate(data);
            setLoadedTemplateId(data.id || null);
            setLoadedTemplateName(data.template_name || '');
            setDisplayMode('populated');
            toast.success('Template loaded successfully!');
          }
        } catch (error: any) {
          console.error('Error loading template:', error);
          toast.error(`Failed to load template: ${error.message}`);
        } finally {
          setFormState(prev => ({ ...prev, isLoading: false }));
          addProgressMessage('Template loading complete.');
          setSearchParams({}); // Clear param after loading
        }
      } else if (savedOutputId) {
        // Validate savedOutputId is a proper string/UUID
        if (typeof savedOutputId !== 'string' || savedOutputId.trim() === '') {
          console.error('Invalid saved output ID in URL:', savedOutputId);
          toast.error('Invalid saved output ID in URL. Please check the link.');
          setSearchParams({}); // Clear invalid parameter
          return;
        }

        addProgressMessage('Loading saved output...');
        setFormState(prev => ({ ...prev, isLoading: true }));
        try {
          const { data, error } = await getSavedOutput(savedOutputId);
          if (error) {
            if (error.code === 'PGRST116') {
              console.warn('Saved output not found:', savedOutputId);
              toast.error('Saved output not found. The link may be invalid or the output may have been deleted.');
            } else {
              throw error;
            }
            return;
          }
          if (data) {
            loadFormStateFromSavedOutput(data);
            toast.success('Saved output loaded successfully!');
          }
        } catch (error: any) {
          console.error('Error loading saved output:', error);
          toast.error(`Failed to load saved output: ${error.message}`);
        } finally {
          setFormState(prev => ({ ...prev, isLoading: false }));
          addProgressMessage('Saved output loading complete.');
          setSearchParams({}); // Clear param after loading
        }
      }
    };

    if (isInitialized && currentUser) {
      loadData();
    }
  }, [searchParams, currentUser, isInitialized, loadFormStateFromTemplate, loadFormStateFromSession, loadFormStateFromSavedOutput, addProgressMessage, setSearchParams, setFormState, setLoadedTemplateId, setLoadedTemplateName]);

  return null; // This component doesn't render anything
};

export default UrlParamLoader;