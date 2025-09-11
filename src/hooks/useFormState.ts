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