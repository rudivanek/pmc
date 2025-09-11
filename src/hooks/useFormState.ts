import { useState, useCallback } from 'react';
import { FormState, Template, CopySession, SavedOutput, ContentQualityScore, GeneratedContentItem, GeneratedContentItemType } from '../types';
import { DEFAULT_FORM_STATE } from '../constants';
import { v4 as uuidv4 } from 'uuid';

export function useFormState() {
  const [formState, setFormState] = useState<FormState>(DEFAULT_FORM_STATE);

  /**
   * Load form state from a copy session
   */
  const loadFormStateFromSession = useCallback((session: CopySession) => {
    if (!session || !session.input_data) {
      return;
    }
    
    setFormState(prevState => {
      // Extract input data from the session
      const inputData = session.input_data;
      
      // Create a new state object with the session data
      const newState: FormState = {
        ...DEFAULT_FORM_STATE,
        ...inputData,
        sessionId: session.id,
        customerId: session.customer_id || undefined,
        customerName: session.customer?.name || undefined,
        
        // Keep model and other fields from previous state
        model: inputData.model || prevState.model,
        
        // Explicitly reset copyResult to ensure no outputs are shown
        copyResult: DEFAULT_FORM_STATE.copyResult,
        
        // Initialize loading states
        isLoading: false,
        isEvaluating: false,
        generationProgress: []
      };
      
      // Copy Sessions now only restore inputs, not outputs
      // The copyResult will remain undefined (empty) when loading from a copy session
      
      return newState;
    });
  }, [setFormState]);

  /**
   * Load form state from a saved output
   */
  const loadFormStateFromSavedOutput = useCallback((savedOutput: SavedOutput) => {
    if (!savedOutput || !savedOutput.input_snapshot || !savedOutput.output_content) {
      return;
    }
    
    setFormState(prevState => {
      // Extract input data and output content from the saved output
      const inputSnapshot = savedOutput.input_snapshot;
      
      // Create a new state object with the saved output data
      const newState: FormState = {
        ...DEFAULT_FORM_STATE,
        ...inputSnapshot,
        customerId: savedOutput.customer_id || undefined,
        customerName: savedOutput.customer?.name || undefined,
        
        // Keep model and other fields from previous state if not in snapshot
        model: inputSnapshot.model || prevState.model,
        
        // Set the copyResult directly from the saved output's output_content
        copyResult: savedOutput.output_content,
        
        // Initialize loading states
        isLoading: false,
        isEvaluating: false,
        generationProgress: []
      };
      
      // If the saved output has a session ID, set it
      if (savedOutput.input_snapshot.sessionId) {
        newState.sessionId = savedOutput.input_snapshot.sessionId;
      }
      
      return newState;
    });
  }, [setFormState]);

  /**
   * Load form state from a template (replaces loadFormStateFromPrefill)
   */
  const loadFormStateFromTemplate = useCallback((template: Template) => {
    setFormState(prevState => {
      // Create a new state object with the template data
      const newState: FormState = {
        ...DEFAULT_FORM_STATE,
        // Apply template data from form_state_snapshot or individual fields
        ...(template.form_state_snapshot || {}),
        // Also apply individual template fields for backward compatibility
        tab: template.template_type as 'create' | 'improve',
        language: template.language,
        tone: template.tone,
        wordCount: template.word_count,
        customWordCount: template.custom_word_count || undefined,
        targetAudience: template.target_audience || undefined,
        keyMessage: template.key_message || undefined,
        desiredEmotion: template.desired_emotion || undefined,
        callToAction: template.call_to_action || undefined,
        brandValues: template.brand_values || undefined,
        keywords: template.keywords || undefined,
        context: template.context || undefined,
        briefDescription: template.brief_description || undefined,
        pageType: template.page_type || undefined,
        section: template.section || undefined,
        businessDescription: template.business_description || undefined,
        originalCopy: template.original_copy || undefined,
        projectDescription: template.project_description || undefined,
        competitorUrls: template.competitor_urls || ['', '', ''],
        outputStructure: template.output_structure 
          ? typeof template.output_structure === 'string'
            ? JSON.parse(template.output_structure)
            : template.output_structure
          : [],
        // Always preserve loading states and other runtime states
        isLoading: false,
        isEvaluating: false,
        generationProgress: [],
        copyResult: DEFAULT_FORM_STATE.copyResult,
        promptEvaluation: undefined
      };
      
      // Handle originalCopyGuidance from template data
      const templateData = template.form_state_snapshot || template;
      if (templateData.originalCopyGuidance) {
        // Store the guidance in form state
        newState.originalCopyGuidance = templateData.originalCopyGuidance;
        
        // Populate the appropriate primary content field based on tab
        if (newState.tab === 'create') {
          newState.businessDescription = templateData.originalCopyGuidance;
        } else if (newState.tab === 'improve') {
          newState.originalCopy = templateData.originalCopyGuidance;
        }
      }
      
      return newState;
    });
  }, [setFormState]);

  // Function to update a quality score in the form state
  const handleScoreChange = useCallback((name: string, score: ContentQualityScore) => {
    setFormState(prevState => {
      // Create a copy of the previous state
      const newState = { ...prevState };
      
      // Update the score field based on the name
      switch (name) {
        case 'businessDescriptionScore':
          newState.businessDescriptionScore = score;
          break;
        case 'originalCopyScore':
          newState.originalCopyScore = score;
          break;
        default:
          console.warn(`Unknown score field: ${name}`);
      }
      
      return newState;
    });
  }, [setFormState]);

  return {
    formState,
    setFormState,
    loadFormStateFromTemplate,
    loadFormStateFromSession,
    loadFormStateFromSavedOutput,
    handleScoreChange
  };
}