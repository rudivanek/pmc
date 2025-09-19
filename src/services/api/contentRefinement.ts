/**
 * Content refinement functionality for word count adherence
 */
import { FormState, Model } from '../../types';
import { getApiConfig, handleApiResponse, storePrompts, calculateTargetWordCount, extractWordCount, generateErrorMessage } from './utils';
import { trackTokenUsage } from './tokenTracking';

/**
 * Revise content to more closely match a target word count
 * @param content - The content to revise
 * @param targetWordCountInfo - The target word count information
 * @param formState - The form state with generation settings
 * @param progressCallback - Optional callback to report progress
 * @param persona - Optional persona to maintain voice style during revision
 * @returns The revised content with better word count adherence
 */
export async function reviseContentForWordCount(
  content: any,
  targetWordCountInfo: { target: number; min?: number; max?: number },
  formState: FormState,
  currentUser?: User,
  progressCallback?: (message: string) => void,
  persona?: string,
  sessionId?: string
): Promise<any> {
  // Handle both old and new parameter formats
  const targetWordCount = typeof targetWordCountInfo === 'number' 
    ? targetWordCountInfo 
    : targetWordCountInfo.target;
  const minWordCount = typeof targetWordCountInfo === 'object' ? targetWordCountInfo.min : undefined;
  const maxWordCount = typeof targetWordCountInfo === 'object' ? targetWordCountInfo.max : undefined;
  
  // Extract text content if needed
  const textContent = typeof content === 'string' 
    ? content 
    : content.headline 
      ? `${content.headline}\n\n${content.sections.map((s: any) => 
          `${s.title}\n${s.content || (s.listItems || []).join('\n')}`
        ).join('\n\n')}`
      : JSON.stringify(content);
  
  // Count the actual words in the content
  const contentWords = textContent.trim().split(/\s+/).length;
  
  // Get tolerance settings based on form state and content length
  const toleranceSettings = getRefinementWordCountTolerance(formState, targetWordCount);
  
  // Calculate the percentage of target achieved
  const percentageOfTarget = (contentWords / targetWordCount) * 100;
  
  // Determine if revision is needed based on tolerance settings
  let needsRevision = false;
  let revisionReason = '';
  
  if (minWordCount !== undefined && maxWordCount !== undefined) {
    // Flexible range mode (little word count)
    if (contentWords < minWordCount) {
      needsRevision = true;
      revisionReason = `below minimum range (${contentWords} < ${minWordCount})`;
    } else if (contentWords > maxWordCount) {
      needsRevision = true;
      revisionReason = `above maximum range (${contentWords} > ${maxWordCount})`;
    }
  } else {
    // Check against tolerance percentages
    if (percentageOfTarget < toleranceSettings.minimumAcceptablePercentage) {
      needsRevision = true;
      revisionReason = `below tolerance (${contentWords} words = ${percentageOfTarget.toFixed(1)}% of target)`;
    } else if (toleranceSettings.maximumAcceptablePercentage && 
               percentageOfTarget > toleranceSettings.maximumAcceptablePercentage) {
      needsRevision = true;
      revisionReason = `above tolerance (${contentWords} words = ${percentageOfTarget.toFixed(1)}% of target)`;
    }
  }
  
  // If within acceptable range, return original content
  if (!needsRevision) {
    if (progressCallback) {
      console.log('📝 Emergency revision response received:', emergencyContent ? `${emergencyContent.length} chars` : 'EMPTY');
      
      // Validate emergency content is not empty
      if (!emergencyContent || emergencyContent.trim().length === 0) {
        console.error('❌ Emergency revision returned empty content!');
        if (progressCallback) {
          progressCallback('❌ Emergency revision returned empty content. Using second revision.');
        }
        return null;
      }
      
      progressCallback(`Content within acceptable range: ${contentWords} words (${percentageOfTarget.toFixed(1)}% of target)`);
    }
    return content;
  }
  
  if (progressCallback) {
        // Validate final content is not empty after parsing
        if (!finalContent || (typeof finalContent === 'string' && finalContent.trim().length === 0)) {
          console.error('❌ Emergency revision final content is empty after parsing!');
          if (progressCallback) {
            progressCallback('❌ Emergency revision produced empty final content. Using second revision.');
          }
          return null;
        }
        
    progressCallback(`Content needs revision: ${revisionReason}`);
  }
  
        console.log(`📊 Emergency revision final result: ${finalWordCount} words (${finalPercentOfTarget}% of target)`);
  try {
    // Get API configuration and validate it
    const { apiKey, baseUrl, headers, maxTokens } = getApiConfig(formState.model);
    
    // Validate API configuration before proceeding
    if (!apiKey) {
        console.error('❌ Error parsing emergency revision response:', parseError);
      throw new Error(`API key not available for model ${formState.model}`);
        
        // Validate emergency content before fallback
        if (!emergencyContent || emergencyContent.trim().length === 0) {
          console.error('❌ Emergency content is empty after parse error!');
          if (progressCallback) {
            progressCallback('❌ Emergency revision parsing failed and content is empty. Using second revision.');
          }
          return null;
        }
        
    }
    
    // Report progress if callback provided
        console.log(`📊 Emergency revision (plain text fallback): ${finalWordCount} words`);
    if (progressCallback) {
      if (minWordCount !== undefined && maxWordCount !== undefined) {
        progressCallback(`Revising content for flexible word count range ${minWordCount}-${maxWordCount} words (currently ${contentWords} words)`);
      } else {
        progressCallback(`Revising content to match target word count of ${targetWordCount} words (currently ${contentWords} words)`);
      }
    } else {
      console.error('❌ Emergency revision returned no content!');
      if (progressCallback) {
        progressCallback('❌ Emergency revision returned no content. Using second revision.');
      }
    }
    
    // Determine if we should return structured format
    const useStructuredFormat = formState.outputStructure && formState.outputStructure.length > 0;
    const isStructuredContent = typeof content === 'object' && content.headline && Array.isArray(content.sections);
    
    // Build the system prompt
    let systemPrompt: string;
    
    if (minWordCount !== undefined && maxWordCount !== undefined) {
      // Little word count mode - flexible range
      systemPrompt = buildFlexibleRangeSystemPrompt(contentWords, minWordCount, maxWordCount, targetWordCount, persona);
    } else {
      // Regular strict mode
      systemPrompt = buildStrictModeSystemPrompt(contentWords, targetWordCount, toleranceSettings.isShortContent, persona);
    }
    
    // Add common system prompt additions
    systemPrompt += buildCommonSystemPromptAdditions(useStructuredFormat, isStructuredContent, persona, minWordCount, maxWordCount, targetWordCount);
    
    // Build the user prompt
    const userPrompt = buildFirstRevisionUserPrompt(
      textContent, 
      contentWords, 
      targetWordCount, 
      minWordCount, 
      maxWordCount, 
      formState, 
      persona, 
      useStructuredFormat, 
      isStructuredContent
    );
    
    // Store the prompts for display in the UI
    storePrompts(systemPrompt, userPrompt);
    
    // Prepare the API request
    const requestBody = {
      model: formState.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.5, // Lower temperature for more precise word count adherence
      max_tokens: maxTokens, // Use dynamic token limit from API config
      response_format: useStructuredFormat || isStructuredContent ? { type: "json_object" } : undefined
    };
    
    // Make the API request with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
    
    try {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      // Parse the response
      const data = await handleApiResponse<{ 
        choices: { message: { content: string } }[];
        usage?: { total_tokens: number }
      }>(response);
      
      // Extract token usage
      const tokenUsage = data.usage?.total_tokens || 0;
      
      // Track token usage
      await trackTokenUsage(
        currentUser,
        tokenUsage,
        formState.model,
        'revise_word_count',
        `Refine word count (target: ${targetWordCount})`,
        undefined, // Don't pass sessionId to avoid foreign key constraint
        formState.projectDescription
      );
      
      // Extract the content from the response
      let revisedContent = data.choices[0]?.message?.content;
      
      if (!revisedContent) {
        throw new Error('No content in response');
      }
      
      // Parse structured content if needed
      if (useStructuredFormat || isStructuredContent) {
        try {
          const parsedContent = JSON.parse(revisedContent);
          revisedContent = parsedContent;
        } catch (err) {
          console.warn('Error parsing structured content, returning as plain text:', err);
          // Keep as plain text if parsing fails
        }
      }
      
      // Verify the word count of the revised content
      const revisedWordCount = extractWordCount(revisedContent);
      const revisedPercentageOfTarget = (revisedWordCount / targetWordCount) * 100;
      
      console.log(`First revision result: ${revisedWordCount} words (target: ${targetWordCount}, ${revisedPercentageOfTarget.toFixed(1)}% of target)`);
      
      if (progressCallback) {
        progressCallback(`First revision complete: ${revisedWordCount} words (${revisedPercentageOfTarget.toFixed(1)}% of target)`);
      }
      
      // Determine if a second revision is needed
      const needsSecondRevision = shouldPerformSecondRevision(
        revisedWordCount, 
        targetWordCount, 
        minWordCount, 
        maxWordCount, 
        toleranceSettings
      );
      
      if (needsSecondRevision) {
        if (progressCallback) {
          progressCallback(`Content still outside acceptable range. Making second revision attempt...`);
        }
        
        // Call the dedicated second revision function
        const secondRevisionContent = await performSecondRevision(
          revisedContent, 
          { target: targetWordCount, min: minWordCount, max: maxWordCount },
          formState,
          currentUser,
          progressCallback,
          persona, // Pass the persona to maintain voice style during revision
          sessionId
        );
        
        return secondRevisionContent;
      }
      
      return revisedContent;
    } catch (fetchError) {
      clearTimeout(timeoutId);
      throw fetchError;
    }
  } catch (error) {
    console.error('Error revising content for word count:', error);
    
    // Generate a more specific error message
    const errorMessage = generateErrorMessage(error);
    
    if (progressCallback) {
      progressCallback(`Error revising content: ${errorMessage}. Using original content.`);
    }
    
    // If revision fails, return the original content
    return content;
  }
}

/**
 * Helper function to build flexible range system prompt
 */
function buildFlexibleRangeSystemPrompt(contentWords: number, minWordCount: number, maxWordCount: number, targetWordCount: number, persona?: string): string {
  let systemPrompt = `You are an expert copywriter who specializes in creating concise, impactful SHORT content.
Your task is to revise the provided content to be between ${minWordCount}-${maxWordCount} words (target: ${targetWordCount} words).
This is SHORT content with flexible word count tolerance to maintain natural phrasing.

${contentWords < minWordCount
  ? `The content is currently ${minWordCount - contentWords} words BELOW the minimum. Add essential words to reach at least ${minWordCount} words.`
  : contentWords > maxWordCount
    ? `The content is currently ${contentWords - maxWordCount} words ABOVE the maximum. Remove unnecessary words to stay within ${maxWordCount} words.`
    : `The content is within range but could be optimized toward the ${targetWordCount} word target.`}

FLEXIBLE RANGE: The final word count must be between ${minWordCount}-${maxWordCount} words, ideally close to ${targetWordCount} words.`;

  if (persona) {
    systemPrompt += `\n\nIMPORTANT: This content is written in the voice style of ${persona}. 
You MUST maintain ${persona}'s distinctive voice, tone, and writing style while adjusting the word count.
${persona}'s voice is a critical aspect that must be preserved throughout the revision.`;
  }

  return systemPrompt;
}

/**
 * Helper function to build strict mode system prompt
 */
function buildStrictModeSystemPrompt(contentWords: number, targetWordCount: number, isShortContent: boolean, persona?: string): string {
  const wordDifference = contentWords - targetWordCount;
  const percentageDifference = Math.abs(wordDifference) / targetWordCount * 100;
  
  let systemPrompt = isShortContent 
    ? `You are an expert copywriter who specializes in creating concise, impactful SHORT content.
Your task is to revise the provided content to be EXACTLY ${targetWordCount} words.
This is SHORT content requiring extreme precision - every word must be essential.

${wordDifference > 0 
  ? `The content is currently ${wordDifference} words TOO LONG. Remove unnecessary words, adjectives, and phrases while preserving the core message.` 
  : `The content is currently ${Math.abs(wordDifference)} words TOO SHORT. Add only essential, high-impact words that strengthen the message.`}

CRITICAL: For short content, precision is everything. The final word count must be EXACTLY ${targetWordCount} words.`
    : `You are an expert copywriter with a NON-NEGOTIABLE task: revise the provided content to match the target word count of ${targetWordCount} words EXACTLY.
This is an ABSOLUTE REQUIREMENT with ZERO tolerance for deviation.

${wordDifference > 0 
  ? `The content is currently ${wordDifference} words (${percentageDifference.toFixed(1)}%) TOO LONG. You MUST trim unnecessary details, redundant phrases, and verbose explanations while preserving all key points.` 
  : `The content is currently ${Math.abs(wordDifference)} words (${percentageDifference.toFixed(1)}%) TOO SHORT. You MUST add substantial details, comprehensive examples, case studies, supporting evidence, or thorough elaborations to reach EXACTLY ${targetWordCount} words.`}

CRITICAL SUCCESS METRIC: The final word count must be EXACTLY ${targetWordCount} words - no approximation, no tolerance.

You MUST NOT return your response until you have meticulously counted the words and confirmed it is EXACTLY ${targetWordCount} words.`;

  if (persona) {
    systemPrompt += `\n\nCRITICAL REMINDER: Many revision attempts fail to maintain both the target word count AND ${persona}'s voice.
Your task is to achieve BOTH objectives:
1. Reaching EXACTLY ${targetWordCount} words
2. Maintaining ${persona}'s distinctive voice and style

If expanding, add content that sounds authentically like ${persona} would write it.`;
  }

  return systemPrompt;
}

/**
 * Helper function to build common system prompt additions
 */
function buildCommonSystemPromptAdditions(
  useStructuredFormat: boolean, 
  isStructuredContent: boolean, 
  persona?: string, 
  minWordCount?: number, 
  maxWordCount?: number, 
  targetWordCount?: number
): string {
  let additions = '';
  
  if (useStructuredFormat || isStructuredContent) {
    additions += `\n\nYour response MUST be a valid JSON object.`;
  }
  
  additions += `\n\nIMPORTANT: If expanding the content, do NOT add filler or repetitive content. Instead:
1. Add specific examples or case studies
2. Expand on benefits with more detail
3. Add supporting evidence or statistics
4. Elaborate on how the product/service solves specific problems
5. Include additional relevant context that enhances understanding
6. Add implementation steps, processes, or methodologies
7. Include background information, industry context, or comparative analysis`;
  
  if (minWordCount !== undefined && maxWordCount !== undefined) {
    additions += `\n\nFLEXIBLE WORD COUNT: Aim for ${targetWordCount} words but anywhere between ${minWordCount}-${maxWordCount} words is acceptable.`;
  } else if (targetWordCount) {
    additions += `\n\nABSOLUTELY CRITICAL - WORD COUNT VERIFICATION REQUIRED:
The final word count must be EXACTLY ${targetWordCount} words.

MANDATORY VERIFICATION PROCESS:
1. Write your content
2. Count every single word meticulously
3. If it's not EXACTLY ${targetWordCount} words, revise immediately
4. Repeat steps 2-3 until you have EXACTLY ${targetWordCount} words
5. Only then submit your response

NO TOLERANCE, NO APPROXIMATION, NO EXCUSES - it must be precisely ${targetWordCount} words.

FAILURE TO ACHIEVE EXACTLY ${targetWordCount} WORDS = COMPLETE FAILURE.`;
  }
  
  return additions;
}

/**
 * Helper function to build first revision user prompt
 */
function buildFirstRevisionUserPrompt(
  textContent: string,
  contentWords: number,
  targetWordCount: number,
  minWordCount?: number,
  maxWordCount?: number,
  formState?: FormState,
  persona?: string,
  useStructuredFormat?: boolean,
  isStructuredContent?: boolean
): string {
  const wordDifference = contentWords - targetWordCount;
  
  let userPrompt = `Please revise this content to match the target word count:

"""
${textContent}
"""

Current word count: ${contentWords} words
Target word count: ${targetWordCount} words`;

  if (minWordCount !== undefined && maxWordCount !== undefined) {
    userPrompt += `
Target range: ${minWordCount}-${maxWordCount} words
Status: ${contentWords < minWordCount ? `${minWordCount - contentWords} words below minimum` 
         : contentWords > maxWordCount ? `${contentWords - maxWordCount} words above maximum`
         : 'within range but can be optimized'}`;
  } else {
    userPrompt += `
Difference: ${wordDifference > 0 ? `${wordDifference} words too many` : `${Math.abs(wordDifference)} words too few`}`;
  }

  userPrompt += `

Guidelines:
- Maintain the ${formState?.tone || 'original'} tone
- Keep the same key messages and information
- ${wordDifference > 0 ? 'Remove unnecessary details or repetition without losing key points' : 'Add relevant details, examples, or elaborations that enhance the copy'}
- Ensure the content remains in ${formState?.language || 'English'} language
- Preserve the overall structure and flow`;

  // Add persona-specific instructions to user prompt if provided
  if (persona) {
    userPrompt += `\n- Maintain ${persona}'s distinctive voice and writing style throughout
- Ensure any added content sounds authentically like ${persona} would write it`;
  }

  if (minWordCount !== undefined && maxWordCount !== undefined) {
    userPrompt += `\n- Aim for the ${targetWordCount} word target within the ${minWordCount}-${maxWordCount} range`;
  } else {
    userPrompt += `\n- Count your words meticulously to ensure you hit the target word count of EXACTLY ${targetWordCount} words`;
  }
  
  // Add structured format instructions
  if (useStructuredFormat || isStructuredContent) {
    userPrompt += `\n\nPlease structure your response in this JSON format:
{
  "headline": "Main headline goes here",
  "sections": [
    {
      "title": "Section title",
      "content": "Section content paragraph(s)"
    },
    {
      "title": "Another section title",
      "listItems": ["First bullet point", "Second bullet point"]
    }
  ],
  "wordCountAccuracy": 95
}

Make sure to include a headline and appropriate sections with either paragraph content or list items.`;
  } else {
    userPrompt += `\n\nProvide your response as plain text with appropriate paragraphs and formatting.`;
  }

  if (formState?.forceKeywordIntegration && formState.keywords) {
    userPrompt += `\n\nIMPORTANT: Make sure to naturally integrate all of these keywords throughout the copy: ${formState.keywords}`;
  }
  
  // Add specific emphasis on word count for personas
  if (persona) {
    if (minWordCount !== undefined && maxWordCount !== undefined) {
      userPrompt += `\n\nVERY IMPORTANT REMINDER: Your task has TWO equally critical requirements:
1. Stay within the ${minWordCount}-${maxWordCount} word range (ideally ${targetWordCount} words)
2. Maintain ${persona}'s distinctive voice and style

Many revision attempts fail on one of these requirements. You must succeed on BOTH.`;
    } else {
      userPrompt += `\n\nVERY IMPORTANT REMINDER: Your task has TWO equally critical requirements:
1. Match the target word count of EXACTLY ${targetWordCount} words
2. Maintain ${persona}'s distinctive voice and style

Many revision attempts fail on one of these requirements. You must succeed on BOTH.

DO NOT SUBMIT your response until you've verified:
- The word count is EXACTLY ${targetWordCount} words
- The content authentically sounds like ${persona}'s writing`;
    }
  }
  
  return userPrompt;
}

/**
 * Helper function to determine if a second revision is needed
 */
function shouldPerformSecondRevision(
  revisedWordCount: number,
  targetWordCount: number,
  minWordCount?: number,
  maxWordCount?: number,
  toleranceSettings?: any
): boolean {
  // For flexible range mode, check if still outside range
  if (minWordCount !== undefined && maxWordCount !== undefined) {
    return revisedWordCount < minWordCount || revisedWordCount > maxWordCount;
  }
  
  // For strict mode, use a tighter tolerance for second revision
  if (toleranceSettings?.toleranceMode === 'strict') {
    const secondRevisionTolerance = 98; // 98% minimum for second revision
    const percentageOfTarget = (revisedWordCount / targetWordCount) * 100;
    return percentageOfTarget < secondRevisionTolerance;
  }
  
  // For normal mode, use 95% threshold
  const percentageOfTarget = (revisedWordCount / targetWordCount) * 100;
  return percentageOfTarget < 95;
}

/**
 * Perform a second, more aggressive revision attempt when the first one fails to meet the word count
 */
async function performSecondRevision(
  content: any,
  targetWordCountInfo: { target: number; min?: number; max?: number },
  formState: FormState,
  currentUser?: User,
  progressCallback?: (message: string) => void,
  persona?: string,
  sessionId?: string
): Promise<any> {
  const { target: targetWordCount, min: minWordCount, max: maxWordCount } = targetWordCountInfo;
  
  try {
    // Get API configuration and validate it
    const { apiKey, baseUrl, headers, maxTokens } = getApiConfig(formState.model);
    
    // Validate API configuration
    if (!apiKey) {
      throw new Error(`API key not available for model ${formState.model}`);
    }
    
    // Extract text content if needed
    const textContent = typeof content === 'string' 
      ? content 
      : content.headline 
        ? `${content.headline}\n\n${content.sections.map((s: any) => 
            `${s.title}\n${s.content || (s.listItems || []).join('\n')}`
          ).join('\n\n')}`
        : JSON.stringify(content);
    
    // Count the actual words in the content
    const contentWords = textContent.trim().split(/\s+/).length;
    const wordsMissing = targetWordCount - contentWords;
    const percentMissing = Math.round((wordsMissing / targetWordCount) * 100);
    const isShortContent = targetWordCount <= 150;
    const wordDifference = contentWords - targetWordCount;
    
    // Determine if we should return structured format
    const isStructuredContent = typeof content === 'object' && content.headline && Array.isArray(content.sections);
    
    // Build the second revision system prompt
    const systemPrompt = buildSecondRevisionSystemPrompt(
      wordsMissing, 
      percentMissing, 
      targetWordCount, 
      isStructuredContent, 
      persona,
      minWordCount,
      maxWordCount
    );
    
    // Build the second revision user prompt
    const userPrompt = buildSecondRevisionUserPrompt(
      textContent,
      contentWords,
      targetWordCount,
      wordsMissing,
      percentMissing,
      isShortContent,
      wordDifference,
      formState,
      persona,
      isStructuredContent,
      minWordCount,
      maxWordCount
    );
    
    // Prepare the API request
    const requestBody = {
      model: formState.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.6, // Slightly higher temperature for second attempt to encourage more creativity
      max_tokens: maxTokens, // Use dynamic token limit from API config
      response_format: isStructuredContent ? { type: "json_object" } : undefined
    };
    
    if (progressCallback) {
      progressCallback(`Making second attempt to match target word count...`);
    }
    
    // Make the API request with timeout and better error handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000); // 90 second timeout for second attempt
    
    try {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      // Parse the response
      const data = await handleApiResponse<{ 
        choices: { message: { content: string } }[];
        usage?: { total_tokens: number }
      }>(response);
      
      // Extract token usage
      const tokenUsage = data.usage?.total_tokens || 0;
      
      // Track token usage
      await trackTokenUsage(
        currentUser,
        tokenUsage,
        formState.model,
        'revise_word_count_second_attempt',
        `Second word count revision (target: ${targetWordCount})`,
        sessionId,
        formState.projectDescription
      );
      
      // Extract the content from the response
      let revisedContent = data.choices[0]?.message?.content;
      
      if (!revisedContent) {
        throw new Error('No content in second revision response');
      }
      
      // Parse structured content if needed
      if (isStructuredContent) {
        try {
          const parsedContent = JSON.parse(revisedContent);
          revisedContent = parsedContent;
        } catch (err) {
          console.warn('Error parsing structured content in second revision, returning as plain text:', err);
          // Keep as plain text if parsing fails
        }
      }
      
      // Verify the word count of the second revision
      const secondRevisedWordCount = extractWordCount(revisedContent);
      const percentOfTarget = Math.round((secondRevisedWordCount / targetWordCount) * 100);
      
      if (progressCallback) {
        progressCallback(`Second revision complete: ${secondRevisedWordCount} words (${percentOfTarget}% of target)`);
      }
      
      // Check if a third emergency revision is needed
      const needsEmergencyRevision = shouldPerformEmergencyRevision(
        secondRevisedWordCount,
        targetWordCount,
        minWordCount,
        maxWordCount,
        formState
      );
      
      if (needsEmergencyRevision) {
        if (progressCallback) {
          progressCallback(`Content still below target. Making final emergency revision...`);
        }
        
        try {
          const emergencyResult = await performEmergencyRevision(
            revisedContent,
            targetWordCount,
            secondRevisedWordCount,
            percentOfTarget,
            formState,
            currentUser,
            persona,
            isStructuredContent,
            progressCallback,
            sessionId
          );
          
          if (emergencyResult) {
            return emergencyResult;
          }
        } catch (emergencySetupError) {
          console.error('Error setting up emergency revision:', emergencySetupError);
        }
      }
      
      // Return the second revision content (or the original second revision if the emergency attempt failed)
      return revisedContent;
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      // Handle specific fetch errors
      if (fetchError.name === 'AbortError') {
        throw new Error('Second revision request timed out. Please try again or use a different model.');
      }
      
      // Re-throw with more context
      throw new Error(`Second revision API request failed: ${fetchError.message}`);
    }
  } catch (error) {
    console.error('Error in second content revision:', error);
    
    // Generate a more specific error message
    const errorMessage = generateErrorMessage(error);
    
    if (progressCallback) {
      progressCallback(`Error in second revision: ${errorMessage}. Using first revision.`);
    }
    
    // If second revision fails, return the content from the first revision
    return content;
  }
}

/**
 * Helper function to build second revision system prompt
 */
function buildSecondRevisionSystemPrompt(
  wordsMissing: number,
  percentMissing: number,
  targetWordCount: number,
  isStructuredContent: boolean,
  persona?: string,
  minWordCount?: number,
  maxWordCount?: number
): string {
  let systemPrompt = isStructuredContent 
    ? `You are an expert copywriter with a FINAL, CRITICAL ATTEMPT to fix content that is not meeting word count requirements. Your response MUST be a valid JSON object.`
    : `You are an expert copywriter with a FINAL, CRITICAL ATTEMPT to fix content that is not meeting word count requirements.`;
    
  if (minWordCount !== undefined && maxWordCount !== undefined) {
    systemPrompt += `

FLEXIBLE RANGE EMERGENCY: The content must be adjusted to fit within ${minWordCount}-${maxWordCount} words (target: ${targetWordCount} words).`;
  } else {
    systemPrompt += `

EMERGENCY SITUATION: The content provided is ${wordsMissing} words (${percentMissing}%) short of the required ${targetWordCount} word target.`;
  }
  
  systemPrompt += `

THIS IS YOUR FINAL CHANCE. Your task is to revise this content by adding substantive, valuable content:

1. Add specific examples, case studies, or scenarios that illustrate key points
2. Expand explanations with more detail and depth
3. Add supporting evidence, statistics, or expert opinions
4. Elaborate on benefits with concrete applications
5. Add contextual information that enhances understanding
6. Add implementation steps, processes, or methodologies
7. Include background information, industry context, or comparative analysis

DO NOT use filler text, repetition, or fluff. Every added word must add genuine value.`;

  if (minWordCount !== undefined && maxWordCount !== undefined) {
    systemPrompt += `

REQUIREMENT: The final content must be between ${minWordCount}-${maxWordCount} words, ideally close to ${targetWordCount} words.`;
  } else {
    systemPrompt += `

ABSOLUTE REQUIREMENT: The final content MUST be exactly ${targetWordCount} words.
FAILURE TO DELIVER EXACTLY ${targetWordCount} WORDS WILL RESULT IN COMPLETE REJECTION.

YOU MUST NOT RETURN YOUR RESPONSE UNTIL YOU HAVE VERIFIED IT CONTAINS EXACTLY ${targetWordCount} WORDS.`;
  }

  // Add persona-specific instructions if a persona is provided
  if (persona) {
    systemPrompt += `

CRITICAL: This content must sound like it was written by ${persona}.
You MUST maintain ${persona}'s distinctive voice, vocabulary, sentence structure, and overall style.
Any content you add should seamlessly blend with ${persona}'s writing style.

YOUR SUCCESS DEPENDS ON TWO EQUALLY IMPORTANT CRITERIA:`;
    
    if (minWordCount !== undefined && maxWordCount !== undefined) {
      systemPrompt += `
1. Staying within ${minWordCount}-${maxWordCount} words (ideally ${targetWordCount} words)
2. Making the entire content sound authentically like ${persona}'s writing`;
    } else {
      systemPrompt += `
1. Reaching EXACTLY ${targetWordCount} words
2. Making the entire content sound authentically like ${persona}'s writing`;
    }
    
    systemPrompt += `

Many attempts fail on one of these criteria. You must succeed on BOTH.`;
  }
  
  return systemPrompt;
}

/**
 * Helper function to build second revision user prompt
 */
function buildSecondRevisionUserPrompt(
  textContent: string,
  contentWords: number,
  targetWordCount: number,
  wordsMissing: number,
  percentMissing: number,
  isShortContent: boolean,
  wordDifference: number,
  formState: FormState,
  persona?: string,
  isStructuredContent?: boolean,
  minWordCount?: number,
  maxWordCount?: number
): string {
  let userPrompt = '';
  
  if (isShortContent && !minWordCount && !maxWordCount) {
    userPrompt = `This content needs to be EXACTLY ${targetWordCount} words for SHORT content requiring precision.
    
Content to ${wordDifference > 0 ? 'condense' : 'expand'}:
"""
${textContent}
"""

Current word count: ${contentWords} words
Required word count: ${targetWordCount} words
${wordDifference > 0 ? `Words to remove: ${wordDifference} words` : `Words to add: ${Math.abs(wordDifference)} words`}

${wordDifference > 0 
  ? `Make this content more concise by removing unnecessary words, redundant phrases, and non-essential details while preserving the core message and impact.`
  : `Add only essential, high-impact words that strengthen the core message. Do not add filler or unnecessary elaboration.`}

CRITICAL: This is SHORT content. Every word must be purposeful and essential. The final count must be EXACTLY ${targetWordCount} words.`;
  } else if (minWordCount !== undefined && maxWordCount !== undefined) {
    userPrompt = `FLEXIBLE RANGE REVISION: This content needs to be adjusted to fit within ${minWordCount}-${maxWordCount} words (target: ${targetWordCount} words).
    
Content to revise:
"""
${textContent}
"""

Current word count: ${contentWords} words
Target range: ${minWordCount}-${maxWordCount} words
Ideal target: ${targetWordCount} words
Status: ${contentWords < minWordCount ? `${minWordCount - contentWords} words below minimum` 
         : contentWords > maxWordCount ? `${contentWords - maxWordCount} words above maximum`
         : 'within range but can be optimized'}

Adjust the content to fit comfortably within the target range while maintaining quality and natural flow.`;
  } else {
    userPrompt = `EMERGENCY WORD COUNT CORRECTION REQUIRED: This content is ${wordsMissing} words short of the required ${targetWordCount} word target.
    
Content to expand:
"""
${textContent}
"""

Current word count: ${contentWords} words
Required word count: ${targetWordCount} words
Words missing: ${wordsMissing} words (${percentMissing}%)

THIS IS YOUR FINAL OPPORTUNITY to expand this content to EXACTLY ${targetWordCount} words.

YOU MUST add high-quality, substantive content that enhances its value:
- Detailed examples with specific outcomes and results
- Comprehensive case studies with measurable impacts
- Supporting evidence from credible sources
- Step-by-step processes and implementation guides
- Background context and industry insights
- Practical applications and real-world scenarios
- Expert opinions and authoritative perspectives

ADD DEPTH, EXAMPLES, AND THOROUGH ELABORATION - NEVER FILLER TEXT.`;
  }

  userPrompt += `\n\nYour ${wordDifference > 0 ? 'condensed' : 'expanded'} version must:
- Maintain the ${formState.tone} tone and ${formState.language} language`;

  if (isShortContent && !minWordCount && !maxWordCount) {
    userPrompt += `
- Be extremely concise and impactful
- Remove any unnecessary words or phrases
- Preserve only the most essential message elements`;
  } else if (minWordCount !== undefined && maxWordCount !== undefined) {
    userPrompt += `
- Fit comfortably within the ${minWordCount}-${maxWordCount} word range
- Maintain natural phrasing and flow
- Be as close to ${targetWordCount} words as possible while staying in range`;
  } else {
    userPrompt += `
- Preserve all existing content (never remove anything valuable)
- Add substantial, valuable, relevant information that enhances understanding
- Include comprehensive details that provide genuine value to the reader`;
  }
  
  if (minWordCount !== undefined && maxWordCount !== undefined) {
    userPrompt += `
- Stay within the ${minWordCount}-${maxWordCount} word range`;
  } else {
    userPrompt += `
- Reach EXACTLY ${targetWordCount} words with NO DEVIATION WHATSOEVER`;
  }

  // Add persona-specific instructions to the user prompt if provided
  if (persona) {
    userPrompt += `\n- Sound authentically like ${persona}'s writing style
- Maintain ${persona}'s distinctive voice, vocabulary, and sentence patterns
- Ensure any added content blends seamlessly with ${persona}'s style`;
  }

  userPrompt += `\n- Be formatted according to the original structure`;

  // Add JSON format instructions if structured content is expected
  if (isStructuredContent) {
    userPrompt += `\n\nPlease format your response as JSON with the following structure:
{
  "headline": "Main headline goes here",
  "sections": [
    {
      "title": "Section title",
      "content": "Section content paragraph(s)"
    },
    {
      "title": "Another section title", 
      "listItems": ["First bullet point", "Second bullet point"]
    }
  ],
  "wordCountAccuracy": 95
}

Return your response in valid JSON format.`;
  }

  if (formState.forceKeywordIntegration && formState.keywords) {
    userPrompt += `\n\nMake sure to naturally integrate these keywords in the expanded sections: ${formState.keywords}`;
  }
  
  // Add final reminder about word count, with extra emphasis for persona styling
  if (persona) {
    if (minWordCount !== undefined && maxWordCount !== undefined) {
      userPrompt += `\n\nFINAL REMINDER: The content must be within ${minWordCount}-${maxWordCount} words AND sound like ${persona}'s authentic writing style. 
I will check both requirements carefully. Do not submit your response until you have verified both criteria are met.`;
    } else {
      userPrompt += `\n\nFINAL REMINDER: The content MUST be EXACTLY ${targetWordCount} words AND sound like ${persona}'s authentic writing style. 
I will check both requirements carefully. Do not submit your response until you have verified both criteria are met.`;
    }
  } else {
    if (minWordCount !== undefined && maxWordCount !== undefined) {
      userPrompt += `\n\nFINAL VERIFICATION: Ensure the content is within ${minWordCount}-${maxWordCount} words before submitting.`;
    } else {
      userPrompt += `\n\nFINAL VERIFICATION REQUIREMENT:
The content MUST be EXACTLY ${targetWordCount} words.

MANDATORY PROCESS BEFORE SUBMISSION:
1. Count every single word in your response
2. If it's not EXACTLY ${targetWordCount} words, revise immediately
3. Count again to verify it's EXACTLY ${targetWordCount} words
4. Only submit when the count is precisely ${targetWordCount} words

YOU MUST NOT SUBMIT YOUR RESPONSE UNTIL YOU'VE VERIFIED THE WORD COUNT IS EXACTLY ${targetWordCount} WORDS.`;
    }
  }
  
  return userPrompt;
}

/**
 * Helper function to determine if emergency revision is needed
 */
function shouldPerformEmergencyRevision(
  secondRevisedWordCount: number,
  targetWordCount: number,
  minWordCount?: number,
  maxWordCount?: number,
  formState?: FormState
): boolean {
  // Skip emergency revision for flexible range mode
  if (minWordCount !== undefined && maxWordCount !== undefined) {
    return false;
  }
  
  // Only for strict word count mode
  if (!formState?.prioritizeWordCount) {
    return false;
  }
  
  // Use 95% threshold for emergency revision
  const minimumAcceptable = targetWordCount * 0.95;
  return secondRevisedWordCount < minimumAcceptable;
}

/**
 * Perform emergency (third) revision attempt
 */
async function performEmergencyRevision(
  content: any,
  targetWordCount: number,
  currentWordCount: number,
  percentOfTarget: number,
  formState: FormState,
  currentUser?: User,
  persona?: string,
  isStructuredContent?: boolean,
  progressCallback?: (message: string) => void,
  sessionId?: string
): Promise<any> {
  try {
    const { apiKey, baseUrl, headers, maxTokens } = getApiConfig(formState.model);
    
    // Set up a very targeted, emergency prompt for one final attempt
    const emergencySystemPrompt = persona 
      ? `You are ${persona}. EMERGENCY TASK: Your ONLY job is to expand this content to EXACTLY ${targetWordCount} words while maintaining my distinctive voice. Add substantive, valuable content - detailed examples, case studies, elaborations, and supporting evidence. Never use filler or fluff. ${isStructuredContent ? 'Your response MUST be a valid JSON object.' : ''} CRITICAL: Count every word before submitting - it MUST be EXACTLY ${targetWordCount} words or you have FAILED.`
      : `You are an expert copywriter with a CRITICAL EMERGENCY TASK. Your ONLY job is to expand this content to EXACTLY ${targetWordCount} words. Add substantive, valuable content only. Never use filler or fluff. ${isStructuredContent ? 'Your response MUST be a valid JSON object.' : ''} CRITICAL: Count every word before submitting - it MUST be EXACTLY ${targetWordCount} words or you have FAILED.`;
    
    const emergencyUserPrompt = `This content needs to be expanded to EXACTLY ${targetWordCount} words:
    
"""
${typeof content === 'string' ? content : JSON.stringify(content, null, 2)}
"""

Current length: ${currentWordCount} words
Target length: ${targetWordCount} words (currently at ${percentOfTarget}%)

${persona 
  ? `Add more substantive content - examples, analogies, elaborations, details - while keeping my (${persona}'s) distinctive voice and style.` 
  : `Add more substantive content - examples, analogies, elaborations, details - to reach the target word count.`}

ABSOLUTE REQUIREMENT: The content MUST be EXACTLY ${targetWordCount} words. Count every single word before submitting. If it is not EXACTLY ${targetWordCount} words, DO NOT SUBMIT. Revise until it is precisely ${targetWordCount} words.

${isStructuredContent ? `Please format your response as a valid JSON object with the following structure:
{
  "headline": "Main headline goes here",
  "sections": [
    {
      "title": "Section title",
      "content": "Section content paragraph(s)"
    }
  ],
  "wordCountAccuracy": 95
}` : 'Provide your response as plain text with appropriate formatting.'}`;
    
    // Make one final desperate attempt with higher temperature
    const emergencyRequestBody = {
      model: formState.model,
      messages: [
        { role: 'system', content: emergencySystemPrompt },
        { role: 'user', content: emergencyUserPrompt }
      ],
      temperature: 0.9, // Higher temperature for more creative expansion
      max_tokens: maxTokens,
      response_format: isStructuredContent ? { type: "json_object" } : undefined
    };
    
    const emergencyController = new AbortController();
    const emergencyTimeoutId = setTimeout(() => emergencyController.abort(), 90000); // 90 second timeout
    
    try {
      const emergencyResponse = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify(emergencyRequestBody),
        signal: emergencyController.signal
      });
      
      clearTimeout(emergencyTimeoutId);
      
      const emergencyData = await handleApiResponse<{
        choices: { message: { content: string } }[];
      }>(emergencyResponse);
      
      const emergencyContent = emergencyData.choices[0]?.message?.content;
      
      if (emergencyContent) {
        try {
          // Try to parse if structured content is expected
          const finalContent = isStructuredContent 
            ? JSON.parse(emergencyContent) 
            : emergencyContent;
          
          const finalWordCount = extractWordCount(finalContent);
          const finalPercentOfTarget = Math.round((finalWordCount / targetWordCount) * 100);
          
          if (progressCallback) {
            progressCallback(`🎯 Final emergency revision: ${finalWordCount} words (${finalPercentOfTarget}% of target)`);
          }
          
          return finalContent;
        } catch (parseError) {
          console.warn('Error parsing emergency revision response:', parseError);
          // If parsing fails, return the content as plain text
          const finalWordCount = extractWordCount(emergencyContent);
          
          if (progressCallback) {
            progressCallback(`🎯 Final emergency revision (plain text): ${finalWordCount} words`);
          }
          
          return emergencyContent;
        }
      }
    } catch (emergencyError) {
      clearTimeout(emergencyTimeoutId);
      console.error('Emergency revision failed:', emergencyError);
      if (progressCallback) {
        progressCallback(`❌ Emergency revision failed: ${emergencyError.message}. Using second revision.`);
      }
      return null;
    }
  } catch (emergencySetupError) {
    console.error('Error setting up emergency revision:', emergencySetupError);
    if (progressCallback) {
      progressCallback(`❌ Error setting up emergency revision. Using second revision.`);
    }
    return null;
  }
  
  return null;
}

function getRefinementWordCountTolerance(formState: FormState, targetWordCount: number): any {
  // This function needs to be implemented based on your requirements
  return {
    minimumAcceptablePercentage: 90,
    maximumAcceptablePercentage: 110,
    isShortContent: targetWordCount <= 150,
    toleranceMode: formState.prioritizeWordCount ? 'strict' : 'normal'
  };
}