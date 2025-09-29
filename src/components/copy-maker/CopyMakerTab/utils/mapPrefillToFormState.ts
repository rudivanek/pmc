import { FormState } from '../../../../types';
import { getAutoDisplayMode } from '../../../../utils/formUtils';

/**
 * Helper function to apply prefill data to form state
 */
export function mapPrefillToFormState(
  prefillData: Partial<FormState>,
  currentFormState: FormState,
  setFormState: (state: FormState) => void,
  setDisplayMode: (mode: 'all' | 'populated') => void
): FormState {
  const updatedFormState: FormState = {
    ...currentFormState,
    ...prefillData,
    // Always preserve loading states and other runtime states
    isLoading: currentFormState.isLoading,
    isEvaluating: currentFormState.isEvaluating,
    generationProgress: currentFormState.generationProgress,
    copyResult: currentFormState.copyResult,
    promptEvaluation: currentFormState.promptEvaluation
  };

  setFormState(updatedFormState);
  
  // Auto-determine display mode based on populated fields
  const autoMode = getAutoDisplayMode(updatedFormState);
  setDisplayMode(autoMode);
  
  return updatedFormState;
}