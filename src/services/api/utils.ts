/**
 * API utility functions for PimpMyCopy
 */

import { Model, FormState, ContentQualityScore } from '../../types';
import { countWords } from '../../utils/markdownUtils';
import { MAX_TOKENS_PER_MODEL } from '../../constants';

// Store the last prompts for display in the prompt modal
let lastSystemPrompt = '';
let lastUserPrompt = '';

/**
 * Helper function to clean JSON responses that might be wrapped in markdown code blocks
 * This fixes issues with responses that come back as ```json { ... } ```
 */
export function cleanJsonResponse(text: string): string {
  // If the text is already valid JSON, return it as is
  try {
    JSON.parse(text);
    return text;
  } catch (e) {
    // If it's not valid JSON, try to extract JSON from markdown
  }

  // Check if response is wrapped in markdown code blocks
  const jsonCodeBlockRegex = /```(?:json)?\s*([\s\S]*?)```/;
  const match = text.match(jsonCodeBlockRegex);
  
  if (match && match[1]) {
    return match[1].trim();
  }
  
  // Remove any trailing or leading backticks that might be present
  let cleanedText = text.replace(/^```|```$/g, '').trim();
  
  // If it starts with 'json', remove it
  if (cleanedText.startsWith('json')) {
    cleanedText = cleanedText.slice(4).trim();
  }
  
  return cleanedText;
}

/**
 * Handle API response and extract JSON data
 */
export async function handleApiResponse<T>(response: Response): Promise<T> {
  console.log('API Response status:', response.status);
  console.log('API Response headers:', Object.fromEntries(response.headers.entries()));
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('API Error Response:', errorText);
    throw new Error(`API error (${response.status}): ${errorText}`);
  }
  
  const text = await response.text();
  console.log('Raw API Response:', text);
  const cleanedJson = cleanJsonResponse(text);
  console.log('Cleaned JSON:', cleanedJson);
  
  try {
    return JSON.parse(cleanedJson);
  } catch (e) {
    console.error('Error parsing JSON response:', e);
    console.error('Response text:', text);
    console.error('Cleaned JSON:', cleanedJson);
    throw new Error(`Error parsing copy response: ${e}`);
  }
}

/**
 * Store system and user prompts for later display
 */
export function storePrompts(systemPrompt: string, userPrompt: string): void {
  lastSystemPrompt = systemPrompt;
  lastUserPrompt = userPrompt;
}

/**
 * Get the last prompts that were used
 */
export function getLastPrompts(): { systemPrompt: string; userPrompt: string } {
  return {
    systemPrompt: lastSystemPrompt,
    userPrompt: lastUserPrompt
  };
}

/**
 * Determine the API key and base URL based on the selected model
 */
export function getApiConfig(model: Model): { apiKey: string; baseUrl: string; headers: HeadersInit; maxTokens: number } {
  // Get API keys from environment variables
  const openaiKey = import.meta.env.VITE_OPENAI_API_KEY;
  const deepseekKey = import.meta.env.VITE_DEEPSEEK_API_KEY;
  const grokKey = import.meta.env.VITE_GROK_API_KEY;
  
  // Check if any API keys are available
  const availableKeys = [
    { name: 'OpenAI', key: openaiKey, models: ['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'] },
    { name: 'DeepSeek', key: deepseekKey, models: ['deepseek-chat'] },
    { name: 'Grok', key: grokKey, models: ['grok-4-latest'] }
  ];
  
  const hasAnyKey = availableKeys.some(api => api.key);
  
  if (!hasAnyKey) {
    throw new Error('No API keys available. Please check your environment variables.');
  }
  
  // Get the max tokens for the selected model, defaulting to 4000 if not specified
  const maxTokens = MAX_TOKENS_PER_MODEL[model] || 4000;
  
  // Determine which API to use based on the model
  if (model === 'deepseek-chat') {
    if (!deepseekKey) {
      const message = 'DeepSeek API key not available. Please add VITE_DEEPSEEK_API_KEY to your .env file.';
      console.error(message);
      throw new Error(message);
    }
    
    return {
      apiKey: deepseekKey,
      baseUrl: 'https://api.deepseek.com/v1',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${deepseekKey}`
      },
      maxTokens
    };
  } else if (model === 'grok-4-latest') {
    if (!grokKey) {
      const message = 'Grok API key not available. Please add VITE_GROK_API_KEY to your .env file. You can get a Grok API key from https://console.x.ai/';
      console.error(message);
      console.log('Available API keys:', availableKeys.filter(api => api.key).map(api => api.name));
      throw new Error(message);
    }
    
    return {
      apiKey: grokKey,
      baseUrl: 'https://api.x.ai/v1',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${grokKey}`
      },
      maxTokens
    };
  } else {
    if (!openaiKey) {
      const message = 'OpenAI API key not available. Please add VITE_OPENAI_API_KEY to your .env file.';
      console.error(message);
      throw new Error(message);
    }
    
    return {
      apiKey: openaiKey,
      baseUrl: 'https://api.openai.com/v1',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`
      },
      maxTokens
    };
  }
}

/**
 * Test API connectivity for a specific model
 * @param model - The model to test
 * @returns Promise that resolves if API is accessible, rejects if not
 */
export async function testApiConnectivity(model: Model): Promise<{ success: boolean; error?: string }> {
  try {
    const { apiKey, baseUrl, headers } = getApiConfig(model);
    
    // Make a simple test request (usually checking models endpoint)
    const testEndpoint = model === 'grok-4-latest' ? '/models' : '/models';
    
    const response = await fetch(`${baseUrl}${testEndpoint}`, {
      method: 'GET',
      headers: {
        'Authorization': headers.Authorization as string
      }
    });
    console.log('Using GROK API with key:', grokKey ? 'Present' : 'Missing');
      
    
    if (response.ok) {
      return { success: true };
    } else {
      const errorText = await response.text();
      return {
        success: false, 
        error: `API responded with ${response.status}: ${errorText}` 
      };
    }
  } catch (error: any) {
    return { 
      success: false, 
      error: error.message || 'Unknown API connectivity error' 
    };
  }
}

/**
 * Calculate token cost based on model
 */
export function calculateTokenCost(tokenCount: number, model: Model): number {
  // Updated pricing as of 2023 Q4
  switch (model) {
    case 'gpt-4o':
      return tokenCount * 0.000005; // $0.005 per 1K tokens (estimated)
    case 'gpt-4-turbo':
      return tokenCount * 0.000003; // $0.003 per 1K tokens
    case 'gpt-3.5-turbo':
      return tokenCount * 0.0000015; // $0.0015 per 1K tokens
    case 'deepseek-chat':
      return tokenCount * 0.0000025; // $0.0025 per 1K tokens (estimated)
    case 'grok-4-latest':
      return tokenCount * 0.000015; // $0.015 per 1K tokens (estimated based on xAI pricing)
    default:
      return tokenCount * 0.000003; // Default to gpt-4-turbo pricing
  }
}

/**
 * Calculate target word count based on form state
 * @param formState - The form state containing word count settings
 * @returns Object with target word count and optional min/max range for little word count mode
 */
export function calculateTargetWordCount(formState: FormState): { target: number; min?: number; max?: number } {
  // Calculate custom word count if selected
  let customWordCount = 0;
  let structureWordCount = 0;
  let presetWordCount = 150; // Default to medium length
  
  // Calculate custom word count if selected
  if (formState.wordCount === 'Custom' && formState.customWordCount) {
    customWordCount = formState.customWordCount;
  }
  
  // Calculate word count from preset ranges
  if (formState.wordCount.includes('Short')) {
    presetWordCount = 75; // Mid-point of 50-100
  } else if (formState.wordCount.includes('Medium')) {
    presetWordCount = 150; // Mid-point of 100-200
  } else if (formState.wordCount.includes('Long')) {
    presetWordCount = 300; // Mid-point of 200-400
  }
  
  // Calculate total from structure elements if they exist
  if (formState.outputStructure && formState.outputStructure.length > 0) {
    structureWordCount = formState.outputStructure.reduce((sum, element) => {
      return sum + (element.wordCount || 0);
    }, 0);
  }
  
  // Priority logic for determining target word count
  let targetWordCount = presetWordCount; // Start with preset as default
  
  // If we have both custom and structure counts
  if (customWordCount > 0 && structureWordCount > 0) {
    // Use the larger value when both are present
    targetWordCount = Math.max(customWordCount, structureWordCount);
  } 
  // If only custom count exists
  else if (customWordCount > 0) {
    targetWordCount = customWordCount;
  } 
  // If only structure counts exist
  else if (structureWordCount > 0) {
    targetWordCount = structureWordCount;
  }
  
  // Check if little word count mode is enabled and target is below 100 words
  if (formState.adhereToLittleWordCount && targetWordCount < 100) {
    const tolerance = formState.littleWordCountTolerancePercentage || 20;
    const toleranceAmount = Math.round(targetWordCount * (tolerance / 100));
    
    return {
      target: targetWordCount,
      min: Math.max(1, targetWordCount - toleranceAmount), // Ensure min is at least 1
      max: targetWordCount + toleranceAmount
    };
  }
  
  // Return simple target for normal mode
  return { target: targetWordCount };
}

/**
 * Get word count tolerance settings based on content length and form state
 * @param formState - The form state containing tolerance settings
 * @param targetWordCount - The target word count
 * @returns Object with tolerance settings
 */
export function getWordCountTolerance(formState: FormState, targetWordCount: number): { 
  minimumAcceptablePercentage: number; 
  maximumAcceptablePercentage?: number; 
  isShortContent: boolean; 
  toleranceMode: 'strict' | 'flexible' | 'normal';
} {
  const isShortContent = targetWordCount <= 150;
  
  // Little word count mode (flexible range)
  if (formState.adhereToLittleWordCount && targetWordCount < 100) {
    return {
      minimumAcceptablePercentage: 100 - (formState.littleWordCountTolerancePercentage || 20),
      maximumAcceptablePercentage: 100 + (formState.littleWordCountTolerancePercentage || 20),
      isShortContent: true,
      toleranceMode: 'flexible'
    };
  }
  
  // Strict word count mode
  if (formState.prioritizeWordCount) {
    const tolerance = formState.wordCountTolerancePercentage || 2;
    return {
      minimumAcceptablePercentage: 100 - tolerance,
      maximumAcceptablePercentage: isShortContent ? 100 + tolerance : undefined, // Only set max for short content
      isShortContent,
      toleranceMode: 'strict'
    };
  }
  
  // Normal mode - more lenient
  return {
    minimumAcceptablePercentage: isShortContent ? 95 : 90, // 5% leeway for short, 10% for long
    isShortContent,
    toleranceMode: 'normal'
  };
}

/**
 * Extract the actual word count from content (string or structured)
 */
export function extractWordCount(content: any): number {
  // Handle empty content
  if (!content) return 0;
  
  // Extract text from structured content
  const textContent = typeof content === 'string' 
    ? content 
    : content.headline 
      ? `${content.headline}\n\n${content.sections.map((s: any) => 
          `${s.title}\n${s.content || (s.listItems || []).join('\n')}`
        ).join('\n\n')}`
      : JSON.stringify(content);
  
  // Count words
  return countWords(textContent);
}

/**
 * Generate error message with suggested fixes
 */
export function generateErrorMessage(error: any): string {
  let message = 'An error occurred while processing your request.';
  
  if (error instanceof Error) {
    message = error.message;
    
    // Handle specific error cases
    if (message.includes('429')) {
      message = 'Rate limit exceeded. Please try again in a moment.';
    } else if (message.includes('401') || message.includes('403')) {
      message = 'Authentication error. Please check your API keys in the .env file.';
    } else if (message.includes('500') || message.includes('502') || message.includes('503') || message.includes('504')) {
      message = 'The AI service is currently experiencing issues. Please try again later.';
    } else if (message.includes('timeout')) {
      message = 'The request timed out. Please try again or use a different model.';
    }
  }
  
  return message;
}