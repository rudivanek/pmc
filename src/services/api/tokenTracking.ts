/**
 * Bulletproof token tracking functionality
 */
import { User } from '../../types';
import { calculateTokenCost } from './utils';

// Store failed tracking attempts for retry
let failedTrackingQueue: Array<{
  user_id: string;
  operation_type: string;
  model: string;
  tokens_used: number;
  cost_usd: number;
  attempts: number;
  lastAttempt: number;
}> = [];

/**
 * Track token usage with bulletproof reliability
 * @param user - The user who consumed tokens
 * @param tokenUsage - Number of tokens consumed
 * @param model - AI model used
 * @param operationType - Type of operation performed
 * @param retryCount - Current retry attempt (internal use)
 */
export async function trackTokenUsage(
  user: User,
  tokenUsage: number,
  model: string,
  operationType: string,
  retryCount: number = 0
): Promise<void> {
  // Validate inputs
  if (!user?.id || !tokenUsage || tokenUsage <= 0 || !model || !operationType) {
    console.error('Invalid token tracking parameters:', {
      userId: user?.id,
      tokenUsage,
      model,
      operationType
    });
    throw new Error('Invalid parameters for token tracking');
  }

  // Calculate cost
  const cost = calculateTokenCost(tokenUsage, model);

  const trackingData = {
    user_id: user.id,
    operation_type: operationType,
    model,
    tokens_used: tokenUsage,
    cost_usd: cost
  };

  console.log(`📊 Tracking token usage: ${tokenUsage} tokens for ${operationType} (${model})`);

  try {
    // Call Edge Function for token tracking
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase configuration missing');
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/track-tokens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify(trackingData)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Token tracking failed: ${response.status} - ${errorData.error || 'Unknown error'}`);
    }

    const result = await response.json();
    console.log(`✅ Token usage tracked successfully:`, result);

    // Remove from failed queue if it was there
    failedTrackingQueue = failedTrackingQueue.filter(
      item => !(item.user_id === user.id && item.operation_type === operationType && item.tokens_used === tokenUsage)
    );

  } catch (error: any) {
    console.error(`❌ Token tracking failed (attempt ${retryCount + 1}):`, error);

    // Add to failed queue for retry if not already there
    const existingIndex = failedTrackingQueue.findIndex(
      item => item.user_id === user.id && item.operation_type === operationType && item.tokens_used === tokenUsage
    );

    if (existingIndex === -1) {
      failedTrackingQueue.push({
        ...trackingData,
        attempts: 1,
        lastAttempt: Date.now()
      });
    } else {
      failedTrackingQueue[existingIndex].attempts++;
      failedTrackingQueue[existingIndex].lastAttempt = Date.now();
    }

    // Retry logic with exponential backoff
    if (retryCount < 3) {
      const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
      console.log(`⏰ Retrying token tracking in ${delay}ms...`);
      
      setTimeout(async () => {
        try {
          await trackTokenUsage(user, tokenUsage, model, operationType, retryCount + 1);
        } catch (retryError) {
          console.error(`❌ Token tracking retry ${retryCount + 1} failed:`, retryError);
        }
      }, delay);
    } else {
      console.error(`❌ Token tracking failed after ${retryCount + 1} attempts. Added to queue for background retry.`);
    }

    // CRITICAL: Make this mandatory - throw error if tracking fails completely
    if (retryCount >= 3) {
      throw new Error(`Failed to track token usage after ${retryCount + 1} attempts. API call aborted to prevent untracked usage.`);
    }
  }
}

/**
 * Retry failed tracking attempts from queue
 * Call this periodically (e.g., every 5 minutes)
 */
export async function retryFailedTracking(): Promise<void> {
  if (failedTrackingQueue.length === 0) return;

  console.log(`🔄 Retrying ${failedTrackingQueue.length} failed tracking attempts...`);

  const currentTime = Date.now();
  const itemsToRetry = failedTrackingQueue.filter(
    item => item.attempts < 5 && (currentTime - item.lastAttempt) > 60000 // Wait 1 minute between retries
  );

  for (const item of itemsToRetry) {
    try {
      await trackTokenUsage(
        { id: item.user_id } as User,
        item.tokens_used,
        item.model,
        item.operation_type,
        item.attempts
      );
      
      // Remove successful retry from queue
      failedTrackingQueue = failedTrackingQueue.filter(
        queueItem => queueItem !== item
      );
      
    } catch (error) {
      console.error('Background retry failed for token tracking:', error);
    }
  }

  // Remove items that have failed too many times (over 5 attempts)
  const removedItems = failedTrackingQueue.filter(item => item.attempts >= 5);
  if (removedItems.length > 0) {
    console.warn(`⚠️ Removing ${removedItems.length} token tracking attempts that failed over 5 times`);
    failedTrackingQueue = failedTrackingQueue.filter(item => item.attempts < 5);
  }
}

/**
 * Get failed tracking queue status (for admin monitoring)
 */
export function getTrackingQueueStatus(): {
  queueLength: number;
  oldestFailure: number | null;
  totalFailedTokens: number;
} {
  const totalFailedTokens = failedTrackingQueue.reduce((sum, item) => sum + item.tokens_used, 0);
  const oldestFailure = failedTrackingQueue.length > 0 
    ? Math.min(...failedTrackingQueue.map(item => item.lastAttempt))
    : null;

  return {
    queueLength: failedTrackingQueue.length,
    oldestFailure,
    totalFailedTokens
  };
}

/**
 * Estimate token count for text (rough approximation)
 * @param text - Text to estimate tokens for
 * @returns Estimated token count
 */
export function estimateTokenCount(text: string): number {
  // Rough approximation: 1 token ≈ 4 characters for English
  // This is just for estimation, actual tokens are returned by API
  return Math.ceil(text.length / 4);
}