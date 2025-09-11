/**
 * Token usage tracking functionality
 */
import { User, Model } from '../../types';
import { saveTokenUsage } from '../supabaseClient';
import { calculateTokenCost } from './utils';

/**
 * Track token usage in Supabase
 * @param user - The user object
 * @param tokenUsage - The number of tokens used
 * @param model - The AI model used
 * @param controlExecuted - The UI control that was executed (for analytics)
 * @param briefDescription - Brief description of what the tokens were used for
 * @param sessionId - Optional session ID to group related token usage
 * @param projectDescription - Optional project description for organization
 */
export async function trackTokenUsage(
  user: User | undefined,
  tokenUsage: number,
  model: Model,
  controlExecuted: string,
  briefDescription: string,
  sessionId?: string,
  projectDescription?: string
): Promise<void> {
  if (!user) {
    console.log('No user provided, skipping token tracking');
    return;
  }
  
  try {
    // Calculate token cost based on the model
    const tokenCost = calculateTokenCost(tokenUsage, model);
    
    // Get the user's email
    const userEmail = user.email || '';
    
    // Note: saveTokenUsage has fallback logic to get email from auth session
    // even if user.email is not available, so we don't return early here
    
    console.log(`Tracking ${tokenUsage} tokens (${tokenCost} USD) for ${userEmail}`);
    
    // Save token usage to Supabase
    const { data, error } = await saveTokenUsage(
      userEmail,
      tokenUsage,
      tokenCost,
      controlExecuted,
      briefDescription,
      model,
      'Copy Generator', // Copy source is always the same for this application
      sessionId,
      projectDescription
    );
    
    if (error) {
      console.error('Error tracking token usage:', error);
    } else {
      console.log('Token usage tracked successfully');
    }
  } catch (error) {
    console.error('Error in trackTokenUsage:', error);
    // Don't rethrow - token tracking failures shouldn't interrupt the main flow
  }
}

// Estimated token count for evaluating a typical text
export function estimateTokenCount(text: string): number {
  // A simple estimation: 1 token ≈ 4 chars for English text
  return Math.ceil(text.length / 4);
}