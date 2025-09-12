/**
 * Content scoring functionality
 */
import { Model, ScoreData } from '../../types';
import { getApiConfig, handleApiResponse, calculateTargetWordCount } from './utils';
import { trackTokenUsage } from './tokenTracking';

/**
 * Generate scores for content
 * @param content - The content to score (can be string or structured content)
 * @param contentType - The type of content being scored
 * @param model - The AI model to use
 * @param originalContent - The original content (for comparison)
 * @param targetWordCount - The target word count for the content
 * @param progressCallback - Optional callback for reporting progress
 * @returns A ScoreData object with various scores and explanations
 */
export async function generateContentScores(
  content: any,
  contentType: string,
  model: Model,
  currentUser?: User,
  originalContent?: string,
  targetWordCount?: number,
  progressCallback?: (message: string) => void
): Promise<ScoreData> {
  // Extract text content from structured content if needed
  const textContent = typeof content === 'string' 
    ? content 
    : Array.isArray(content)
      ? content.join('\n')
      : content && content.headline 
        ? `${content.headline}\n\n${content.sections.map((s: any) => 
            `${s.title}\n${s.content || (s.listItems || []).join('\n')}`
          ).join('\n\n')}`
        : JSON.stringify(content);
  
  // Get API configuration
  const { apiKey, baseUrl, headers, maxTokens } = getApiConfig(model);
  
  // Progress reporting if callback provided
  if (progressCallback) {
    progressCallback(`Generating scores for ${contentType}...`);
  }
  
  // Count the actual words in the content
  const contentWords = textContent.trim().split(/\s+/).length;
  
  // Build the system prompt
  const systemPrompt = `You are an expert content evaluator who provides detailed scoring and analysis of marketing copy.
  Analyze the provided content based on clarity, persuasiveness, tone match, and engagement.
  Also evaluate how well the content matches the target word count (if provided).
  Provide a comprehensive assessment with scores and explanations.
  
  CRITICAL: You MUST respond with a valid JSON object only. All property names MUST be double-quoted. Do not include any text before or after the JSON object.`;
  
  // Build the user prompt
  let userPrompt = `Please evaluate this ${contentType}:

"""
${textContent}
"""`;

  // Add original content for comparison if provided
  if (originalContent) {
    userPrompt += `\n\nOriginal content for comparison:
"""
${originalContent}
"""`;
  }

  // Add word count information if target is provided
  if (targetWordCount) {
    userPrompt += `\n\nWord count information:
- Actual word count: ${contentWords} words
- Target word count: ${targetWordCount} words
- Difference: ${contentWords - targetWordCount} words (${Math.abs(contentWords - targetWordCount) / targetWordCount * 100}%)`;
  }

  userPrompt += `\n\nRespond with a JSON object containing:
1. overall: Overall quality score from 0-100
2. clarity: Brief assessment of clarity (1-2 sentences)
3. persuasiveness: Brief assessment of persuasiveness (1-2 sentences)
4. toneMatch: Brief assessment of tone appropriateness (1-2 sentences)
5. engagement: Brief assessment of how engaging the content is (1-2 sentences)
6. wordCountAccuracy: Score from 0-100 on how well the content matches the target word count (only if target was provided)
7. improvementExplanation: Detailed explanation of how this content meets the specified requirements and improves upon the original. Include commentary on how well it adheres to instructions like tone, word count, clarity goals, and any specific requirements that were met during generation.

The JSON should follow this structure:
{
  "overall": 85,
  "clarity": "The content clearly explains the value proposition with specific examples.",
  "persuasiveness": "The arguments are compelling and well-supported with evidence.",
  "toneMatch": "The tone is appropriately professional while remaining conversational.",
  "engagement": "The content uses storytelling elements that keep the reader interested.",
  "wordCountAccuracy": 90,
  "improvementExplanation": "This version successfully maintains professional tone while highlighting key benefits. It includes a clear CTA, avoids specified terms, focuses on outcomes, and meets the exact word count requirement. The language is persuasive yet accessible, balancing technical details with results-focused messaging."
}`;

  // Prepare the API request
  const requestBody = {
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.5,
    max_tokens: Math.round(maxTokens / 3), // Use a third of the dynamic token limit - scoring needs moderate tokens
    response_format: { type: "json_object" }
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
    
    // Track token usage without awaiting the result to not block the flow
    trackTokenUsage(
      currentUser,
      tokenUsage,
      model,
      'generate_content_scores',
      `Score ${contentType}`,
      undefined, // No sessionId available in scoring context
      undefined // No project description available in scoring context
    ).catch(err => console.error('Error tracking token usage:', err));
    
    // Extract the content from the response
    const responseContent = data.choices[0]?.message?.content;
    
    if (!responseContent || responseContent.trim() === '') {
      if (progressCallback) {
        progressCallback(`AI model returned empty response for ${contentType} scoring`);
      }
      
      // Return default scores when AI returns empty content
      return {
        overall: 0,
        clarity: "Unable to evaluate - AI model returned empty response.",
        persuasiveness: "Unable to evaluate - AI model returned empty response.",
        toneMatch: "Unable to evaluate - AI model returned empty response.",
        engagement: "Unable to evaluate - AI model returned empty response.",
        improvementExplanation: "Content scoring was not available due to an empty response from the AI model."
      };
    }
    
    // Parse the JSON content
    const parsedContent = JSON.parse(responseContent);
    
    if (progressCallback) {
      progressCallback(`Generated scores for ${contentType}: ${parsedContent.overall}/100`);
    }
    
    // Return the score data
    return {
      overall: parsedContent.overall,
      clarity: parsedContent.clarity,
      persuasiveness: parsedContent.persuasiveness,
      toneMatch: parsedContent.toneMatch,
      engagement: parsedContent.engagement,
      wordCountAccuracy: parsedContent.wordCountAccuracy,
      improvementExplanation: parsedContent.improvementExplanation
    };
  } catch (error) {
    console.error(`Error generating scores for ${contentType}:`, error);
    
    if (progressCallback) {
      progressCallback(`Error generating scores: ${error.message}`);
    }
    
    // Return default scores in case of error
    return {
      overall: 70, // Neutral score
      clarity: "Not evaluated due to an error.",
      persuasiveness: "Not evaluated due to an error.",
      toneMatch: "Not evaluated due to an error.",
      engagement: "Not evaluated due to an error.",
      improvementExplanation: "Could not evaluate due to a technical issue."
    };
  }
}