/**
 * Content modification functionality
 */
import { FormState, User } from '../../types';
import { getApiConfig, handleApiResponse, storePrompts, calculateTargetWordCount, extractWordCount } from './utils';
import { trackTokenUsage } from './tokenTracking';
import { reviseContentForWordCount } from './contentRefinement';

/**
 * Modify content based on user instructions
 * @param content - The content to modify
 * @param instruction - Natural language instruction for modification
 * @param formState - The form state with generation settings
 * @param currentUser - The current user (for token tracking)
 * @param progressCallback - Optional callback for reporting progress
 * @returns Modified content
 */
export async function modifyContent(
  content: any,
  instruction: string,
  formState: FormState,
  currentUser?: User,
  progressCallback?: (message: string) => void
): Promise<any> {
  // Extract text content from structured content if needed
  const textContent = typeof content === 'string' 
    ? content 
    : content.headline 
      ? `${content.headline}\n\n${content.sections.map((s: any) => 
          `${s.title}\n${s.content || (s.listItems || []).join('\n')}`
        ).join('\n\n')}`
      : JSON.stringify(content);
  
  // Get API configuration
  const { apiKey, baseUrl, headers, maxTokens } = getApiConfig(formState.model);
  
  // Calculate target word count
  const targetWordCountInfo = calculateTargetWordCount(formState);
  const targetWordCount = targetWordCountInfo.target;
  
  // Progress reporting if callback provided
  if (progressCallback) {
    progressCallback(`Modifying content: "${instruction}"...`);
  }
  
  // Determine if we should return structured format
  const useStructuredFormat = typeof content === 'object' && !Array.isArray(content);
  
  // Build the system prompt
  let systemPrompt = `You are an expert copywriter who excels at modifying marketing content based on specific user instructions.

Your task is to modify the provided marketing copy according to the user's instructions while maintaining the overall quality and effectiveness.
Keep the content in ${formState.language} language with a ${formState.tone} tone unless the instructions specify otherwise.`;

  // Add word count guidance if available
  if (targetWordCount) {
    systemPrompt += `\n\nThe original content was targeted for approximately ${targetWordCount} words. Maintain a similar length unless the instruction specifically asks to make it shorter or longer.`;
  }

  // Add output format instructions
  if (useStructuredFormat) {
    systemPrompt += `\n\nYou must return your response as a JSON object with the same structure as the original content (headline and sections).`;
  } else {
    systemPrompt += `\n\nProvide your response as plain text with appropriate formatting.`;
  }

  systemPrompt += `\n\nCRITICAL: Do NOT include any SEO metadata in your content output:
- Do NOT include URL slugs, meta descriptions, or Open Graph tags
- Do NOT include H1, H2, or H3 headings as metadata elements
- Focus ONLY on modifying the marketing copy content
- SEO metadata is handled separately and should NOT be part of your content`;

  // Build the user prompt
  let userPrompt = `Please modify the following content according to this instruction: "${instruction}"

Original content:
"""
${textContent}
"""

Modification instruction: ${instruction}

Apply the requested changes while maintaining the quality and effectiveness of the marketing copy. Keep the same general structure and format unless the instruction asks you to change it.`;

  // Add context from form state
  if (formState.targetAudience) {
    userPrompt += `\n\nTarget audience: ${formState.targetAudience}`;
  }
  if (formState.keyMessage) {
    userPrompt += `\nKey message to maintain: ${formState.keyMessage}`;
  }
  if (formState.callToAction) {
    userPrompt += `\nCall to action: ${formState.callToAction}`;
  }

  // Add structured format instructions if needed
  if (useStructuredFormat) {
    userPrompt += `\n\nStructure your response in this JSON format:
{
  "headline": "Modified headline here",
  "sections": [
    {
      "title": "Section title",
      "content": "Modified section content"
    }
  ],
  "wordCountAccuracy": 85
}`;
  }

  // Store the prompts for display in the UI
  storePrompts(systemPrompt, userPrompt);
  
  // Prepare the API request
  const requestBody = {
    model: formState.model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.7,
    max_tokens: maxTokens,
    response_format: useStructuredFormat ? { type: "json_object" } : undefined
  };
  
  try {
    // Make the API request
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });
    
    // Parse the response
    const data = await handleApiResponse<{ 
      choices: { message: { content: string } }[];
      usage?: { total_tokens: number }
    }>(response);
    
    // Extract token usage
    const tokenUsage = data.usage?.total_tokens || 0;
    
    // MANDATORY TOKEN TRACKING - API call fails if tracking fails
    if (currentUser && tokenUsage > 0) {
      await trackTokenUsage(
        currentUser,
        tokenUsage,
        formState.model,
        'modify_content'
      );
    }
    
    // Extract the content from the response
    let modifiedContent = data.choices[0]?.message?.content;
    
    if (!modifiedContent) {
      throw new Error('No content in response');
    }
    
    // Parse structured content if needed
    if (useStructuredFormat) {
      try {
        const parsedContent = JSON.parse(modifiedContent);
        modifiedContent = parsedContent;
      } catch (err) {
        console.warn('Error parsing structured content, returning as plain text:', err);
        // Keep as plain text if parsing fails
      }
    }
    
    if (progressCallback) {
      const wordCount = extractWordCount(modifiedContent);
      progressCallback(`✓ Content modified successfully (${wordCount} words)`);
    }
    
    return modifiedContent;
  } catch (error) {
    console.error('Error modifying content:', error);
    if (progressCallback) {
      progressCallback(`Error modifying content: ${error.message}`);
    }
    throw error;
  }
}