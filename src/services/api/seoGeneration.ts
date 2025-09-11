/**
 * SEO metadata generation functionality
 */
import { FormState, Model, SeoMetadata } from '../../types';
import { getApiConfig, handleApiResponse, storePrompts } from './utils';
import { trackTokenUsage } from './tokenTracking';

/**
 * Generate SEO metadata and structural elements for content
 * @param content - The content to generate SEO metadata for
 * @param formState - The form state with generation settings
 * @param progressCallback - Optional callback for reporting progress
 * @returns A SeoMetadata object with all requested SEO elements
 */
export async function generateSeoMetadata(
  content: any,
  formState: FormState,
  currentUser?: User,
  progressCallback?: (message: string) => void
): Promise<SeoMetadata> {
  // Extract text from structured content if needed
  const contentText = typeof content === 'string' 
    ? content 
    : content.headline 
      ? `${content.headline}\n\n${content.sections.map((s: any) => 
          `${s.title}\n${s.content || (s.listItems || []).join('\n')}`
        ).join('\n\n')}`
      : JSON.stringify(content);
  
  // Get API configuration
  const { apiKey, baseUrl, headers, maxTokens } = getApiConfig(formState.model);
  
  // Progress reporting if callback provided
  if (progressCallback) {
    progressCallback('Generating SEO metadata and structural elements...');
  }
  
  // Build the system prompt
  const systemPrompt = `You are an expert SEO strategist with ABSOLUTE CHARACTER LIMIT ENFORCEMENT. 

CRITICAL NON-NEGOTIABLE REQUIREMENTS:
- NEVER EXCEED the specified character limits under ANY circumstances
- If your generated content approaches the limit, IMMEDIATELY shorten it
- Count characters meticulously for EVERY piece of content you generate
- CHARACTER LIMITS ARE ABSOLUTE - exceeding them by even 1 character is COMPLETE FAILURE
- If unsure about length, always err on the side of being shorter rather than longer

Respond only in JSON using the format and limits provided. Do not include any explanations, markdown, or extra output — only return the final JSON. If you cannot generate content for any reason, return an empty JSON object with all required fields as empty arrays: {"urlSlugs":[],"metaDescriptions":[],"h1Variants":[],"h2Headings":[],"h3Headings":[],"ogTitles":[],"ogDescriptions":[]}.`;
  
  // Build the user prompt as a structured JSON object
  const userPromptObject = {
    task: "Generate the following metadata and structural elements for the content below. Use the character limits EXACTLY as specified. If any field exceeds its limit, you MUST shorten it intelligently while preserving the meaning and keyword relevance.",
    content: contentText,
    context: {
      language: formState.language,
      tone: formState.tone,
      audience: formState.targetAudience || 'General audience',
      industry: formState.industryNiche ? [formState.industryNiche] : ['General'],
      keywords: formState.keywords ? formState.keywords.split(',').map(k => k.trim()).filter(Boolean) : []
    },
    characterLimits: {
      urlSlugs: 60,
      metaDescriptions: 160,
      h1Variants: 60,
      h2Headings: 70,
      h3Headings: 70,
      ogTitles: 60,
      ogDescriptions: 110
    },
    exampleOutputFormat: {
      urlSlugs: Array(formState.numUrlSlugs || 1).fill("example-slug"),
      metaDescriptions: Array(formState.numMetaDescriptions || 1).fill("Example meta description"),
      h1Variants: Array(formState.numH1Variants || 1).fill("Example H1"),
      h2Headings: Array(formState.numH2Variants || 2).fill("Example H2"),
      h3Headings: Array(formState.numH3Variants || 2).fill("Example H3"),
      ogTitles: Array(formState.numOgTitles || 1).fill("Example OG Title"),
      ogDescriptions: Array(formState.numOgDescriptions || 1).fill("Example OG Description")
    },
    instructions: [
      "Your entire response MUST be a single valid JSON object using the same keys as in exampleOutputFormat. DO NOT include any explanation, markdown, extra text, or comments — only pure JSON.",
      "ABSOLUTE CHARACTER LIMIT ENFORCEMENT: Each value MUST NEVER exceed its character limit. Exceeding limits by even 1 character is COMPLETE FAILURE.",
      "COUNT CHARACTERS BEFORE SUBMITTING: For every string you generate, count the characters and ensure it stays within the specified maximum.",
      "IF APPROACHING LIMIT: Immediately shorten content by removing words, using abbreviations, or simplifying language.",
      "PRIORITY ORDER: 1) Stay within character limits (non-negotiable), 2) Include keywords, 3) Make compelling.",
      "Each string must be compelling, keyword-rich, and benefit-focused WITHIN the character constraints.",
      `Use natural ${formState.language} phrasing appropriate for professional audiences.`,
      "No explanations, markdown, comments, or narrative. Just pure JSON.",
      "FINAL VERIFICATION: Before submitting your JSON response, verify that EVERY string is within its character limit. NO EXCEPTIONS."
    ]
  };

  // Convert to string for the API call
  const userPrompt = JSON.stringify(userPromptObject, null, 2);

  // Store the prompts for display in the UI
  storePrompts(systemPrompt, userPrompt);
  
  // Prepare the API request
  const requestBody = {
    model: formState.model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.7, // Balanced creativity and consistency
    max_tokens: maxTokens / 2, // SEO generation needs moderate tokens
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
    
    // Track token usage
    await trackTokenUsage(
      currentUser,
      tokenUsage,
      formState.model,
      'generate_seo_metadata',
      formState.briefDescription || 'Generate SEO metadata',
      formState.sessionId,
      formState.projectDescription
    );
    
    // Extract the content from the response
    const responseContent = data.choices[0]?.message?.content;
    
    if (!responseContent || responseContent.trim() === '') {
      console.warn('Empty response from AI, returning empty SEO metadata');
      return {
        urlSlugs: [],
        metaDescriptions: [],
        h1Variants: [],
        h2Headings: [],
        h3Headings: [],
        ogTitles: [],
        ogDescriptions: []
      };
    }
    
    // Parse the JSON content
    const parsedResponse = JSON.parse(responseContent);
    
    // Validate and clean up the response
    const seoMetadata: SeoMetadata = {
      urlSlugs: Array.isArray(parsedResponse.urlSlugs) ? parsedResponse.urlSlugs : [],
      metaDescriptions: Array.isArray(parsedResponse.metaDescriptions) ? parsedResponse.metaDescriptions : [],
      h1Variants: Array.isArray(parsedResponse.h1Variants) ? parsedResponse.h1Variants : [],
      h2Headings: Array.isArray(parsedResponse.h2Headings) ? parsedResponse.h2Headings : [],
      h3Headings: Array.isArray(parsedResponse.h3Headings) ? parsedResponse.h3Headings : [],
      ogTitles: Array.isArray(parsedResponse.ogTitles) ? parsedResponse.ogTitles : [],
      ogDescriptions: Array.isArray(parsedResponse.ogDescriptions) ? parsedResponse.ogDescriptions : []
    };
    
    if (progressCallback) {
      const totalElements = Object.values(seoMetadata).reduce((sum, arr) => sum + (arr?.length || 0), 0);
      progressCallback(`Generated ${totalElements} SEO metadata elements`);
    }
    
    return seoMetadata;
  } catch (error) {
    console.error('Error generating SEO metadata:', error);
    if (progressCallback) {
      progressCallback(`Error generating SEO metadata: ${error.message}`);
    }
    
    // Return empty structure in case of error
    return {
      urlSlugs: [],
      metaDescriptions: [],
      h1Variants: [],
      h2Headings: [],
      h3Headings: [],
      ogTitles: [],
      ogDescriptions: []
    };
  }
}

/**
 * Generate FAQ Schema from existing text content
 * @param textContent - The text content to extract FAQ from
 * @param formState - The form state with generation settings
 * @param currentUser - The current user (for token tracking)
 * @param progressCallback - Optional callback for reporting progress
 * @returns FAQ Schema as JSON-LD object
 */
export async function generateFaqSchemaFromText(
  textContent: string,
  formState: FormState,
  currentUser?: User,
  progressCallback?: (message: string) => void
): Promise<any> {
  // Get API configuration
  const { apiKey, baseUrl, headers, maxTokens } = getApiConfig(formState.model);
  
  // Progress reporting if callback provided
  if (progressCallback) {
    progressCallback('Generating FAQ Schema from content...');
  }
  
  // Build the system prompt
  const systemPrompt = `You are an expert in structured data and FAQ Schema generation.

Your task is to analyze the provided text content and generate a valid FAQPage Schema (JSON-LD) object.

CRITICAL REQUIREMENTS:
- Extract or create relevant FAQ content from the provided text
- Format as valid JSON-LD FAQPage Schema
- Include 5-8 question-answer pairs
- Each answer must be comprehensive (minimum 50 words)
- Questions should cover different aspects: what, how, why, when, where, benefits, process, etc.

Respond only with the JSON-LD object. No additional text or explanations.`;
  
  // Build the user prompt
  const userPrompt = `Analyze this content and generate a FAQPage Schema (JSON-LD) object:

"""
${textContent}
"""

Generate a FAQPage Schema in this EXACT format:
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is [specific question about the topic]?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Comprehensive answer explaining the topic with specific details and examples..."
      }
    },
    {
      "@type": "Question", 
      "name": "How does [specific question about implementation/usage]?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Detailed answer with step-by-step explanations and practical information..."
      }
    }
  ]
}

MANDATORY REQUIREMENTS:
- Your response MUST be ONLY this JSON object - no additional text
- Each question must be specific and relevant to the content
- Each answer must be comprehensive and informative (minimum 50 words per answer)
- Generate 5-8 question-answer pairs total
- All text must be properly escaped for JSON format
- Language: ${formState.language}`;

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
    max_tokens: Math.floor(maxTokens / 2),
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
    
    // Track token usage
    await trackTokenUsage(
      currentUser,
      tokenUsage,
      formState.model,
      'generate_faq_schema_from_text',
      'Generate FAQ Schema from text content',
      formState.sessionId,
      formState.projectDescription
    );
    
    // Extract the content from the response
    const responseContent = data.choices[0]?.message?.content;
    
    if (!responseContent || responseContent.trim() === '') {
      console.warn('Empty response from AI, returning empty FAQ schema');
      return {};
    }
    
    // Parse the JSON content
    const faqSchema = JSON.parse(responseContent);
    
    if (progressCallback) {
      const questionCount = faqSchema.mainEntity?.length || 0;
      progressCallback(`Generated FAQ Schema with ${questionCount} question-answer pairs`);
    }
    
    return faqSchema;
  } catch (error) {
    console.error('Error generating FAQ schema from text:', error);
    if (progressCallback) {
      progressCallback(`Error generating FAQ schema: ${error.message}`);
    }
    
    // Return empty object in case of error
    return {};
  }
}