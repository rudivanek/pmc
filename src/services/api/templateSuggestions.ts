/**
 * Template JSON suggestions functionality
 */
import { FormState, User, Model } from '../../types';
import { getApiConfig, handleApiResponse, storePrompts } from './utils';
import { trackTokenUsage } from './tokenTracking';
import { OUTPUT_STRUCTURE_OPTIONS, LANGUAGES, TONES, WORD_COUNTS, INDUSTRY_NICHE_OPTIONS, READER_FUNNEL_STAGES, PREFERRED_WRITING_STYLES, LANGUAGE_STYLE_CONSTRAINTS } from '../../constants';

/**
 * Generate a detailed template JSON suggestion based on user instruction
 * @param instruction - Natural language instruction for the template
 * @param currentUser - The current user (for token tracking)
 * @returns A detailed FormState object as JSON
 */
export async function generateTemplateJsonSuggestion(
  instruction: string,
  currentUser: User
): Promise<Partial<FormState>> {
  // Use GPT-4o for better JSON structure generation
  const model: Model = 'gpt-4o';
  
  // Get API configuration
  const { apiKey, baseUrl, headers, maxTokens } = getApiConfig(model);
  
  // Build comprehensive system prompt for template generation
  const systemPrompt = `You are an expert template generator for PimpMyCopy. Your task is to analyze user instructions and generate a detailed, comprehensive JSON template for the FormState object.

CRITICAL: You must respond with a valid JSON object only. No explanations, no markdown, no additional text.

The JSON should represent a FormState object with the following structure and guidelines:

REQUIRED FIELDS:
- originalCopy: string (primary content field - use this for the main content description)
- projectDescription: string (internal organization field)
- language: one of ["English", "Spanish", "French", "German", "Italian", "Portuguese"]
- tone: one of ["Professional", "Friendly", "Bold", "Minimalist", "Creative", "Persuasive"]
- wordCount: one of ["Short: 50-100", "Medium: 100-200", "Long: 200-400", "Custom"]
- customWordCount: number (if wordCount is "Custom")
- model: "deepseek-chat" (default model)

OPTIONAL FIELDS TO POPULATE WHEN RELEVANT:
- pageType: one of ["Homepage", "About", "Services", "Contact", "Other"]
- section: string (e.g., "Hero Section", "Benefits", "Features", "FAQ", "Full Copy")
- productServiceName: string
- briefDescription: string
- targetAudience: string (detailed audience description)
- keyMessage: string
- callToAction: string
- desiredEmotion: string
- brandValues: string
- keywords: string
- context: string
- industryNiche: string
- toneLevel: number (0-100, 50 is default)
- readerFunnelStage: string
- targetAudiencePainPoints: string
- preferredWritingStyle: string
- languageStyleConstraints: string[]
- competitorUrls: string[] (max 3 URLs)
- competitorCopyText: string
- excludedTerms: string

STRUCTURE AND FEATURES:
- outputStructure: array of objects with {value: string, label: string, wordCount: number}
- generateSeoMetadata: boolean
- generateScores: boolean
- generateGeoScore: boolean
- prioritizeWordCount: boolean
- forceKeywordIntegration: boolean
- forceElaborationsExamples: boolean
- enhanceForGEO: boolean
- addTldrSummary: boolean
- geoRegions: string

SEO METADATA COUNTS (when generateSeoMetadata is true):
- numUrlSlugs: number (1-5)
- numMetaDescriptions: number (1-5) 
- numH1Variants: number (1-5)
- numH2Variants: number (1-10)
- numH3Variants: number (1-10)
- numOgTitles: number (1-5)
- numOgDescriptions: number (1-5)

WORD COUNT FEATURES:
- adhereToLittleWordCount: boolean (for content under 100 words)
- littleWordCountTolerancePercentage: number (default 20)
- wordCountTolerancePercentage: number (default 2)

OUTPUT STRUCTURE OPTIONS:
Available values: "header1", "header2", "structured", "paragraphs", "problem", "solution", "benefits", "features", "bullets", "numbered", "qaFormat", "faqJson", "callToAction", "testimonial", "comparison", "statistics", "casestudy", "quote", "summary", "introduction", "conclusion"

INSTRUCTIONS:
1. Analyze the user's instruction carefully
2. Extract content type, word count, target audience, features needed
3. Set appropriate values for all relevant fields
4. Be comprehensive - fill in logical defaults and suggestions
5. Make the template immediately usable for content generation
6. Include relevant SEO and optimization features when appropriate
7. Set realistic word count allocations for output structure elements
8. Consider the content type when setting tone, style, and features`;

  // Build user prompt with examples
  const userPrompt = `Generate a comprehensive FormState JSON template based on this instruction:

"${instruction}"

ANALYSIS REQUIREMENTS:
1. Determine the content type and set appropriate pageType/section
2. Extract word count requirements and set wordCount/customWordCount
3. Infer target audience and industry from context
4. Set appropriate tone and writing style
5. Include relevant output structure with word count allocations
6. Enable appropriate features (SEO, scoring, etc.)
7. Fill in logical defaults for key messaging elements

EXAMPLE TEMPLATE STRUCTURE:
{
  "originalCopy": "Detailed description of what to achieve based on the instruction",
  "projectDescription": "Brief project identifier",
  "language": "English",
  "tone": "Professional",
  "wordCount": "Custom",
  "customWordCount": 400,
  "model": "deepseek-chat",
  "pageType": "Other",
  "section": "Blog Post",
  "productServiceName": "Twitter Marketing Services",
  "briefDescription": "Blog post template for Twitter marketing",
  "targetAudience": "Social media managers and digital marketers looking to improve their Twitter strategy",
  "keyMessage": "Effective Twitter marketing drives engagement and conversions",
  "callToAction": "Start implementing these strategies",
  "keywords": "twitter marketing, social media strategy, engagement",
  "industryNiche": "marketing-advertising",
  "preferredWritingStyle": "Informative",
  "outputStructure": [
    {"value": "introduction", "label": "Introduction", "wordCount": 50},
    {"value": "problem", "label": "Problem", "wordCount": 100},
    {"value": "solution", "label": "Solution", "wordCount": 150},
    {"value": "benefits", "label": "Benefits", "wordCount": 75},
    {"value": "callToAction", "label": "Call to Action", "wordCount": 25}
  ],
  "generateSeoMetadata": true,
  "generateScores": true,
  "forceElaborationsExamples": true,
  "prioritizeWordCount": true,
  "numH2Variants": 3,
  "numH3Variants": 5
}

Generate a similar comprehensive template based on the user's instruction. Include all relevant fields and make logical inferences about what would make this template most effective.`;

  // Store the prompts for display
  storePrompts(systemPrompt, userPrompt);
  
  // Prepare the API request
  const requestBody = {
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.7,
    max_tokens: 4000,
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
      model,
      'generate_template_json_suggestion',
      `Template JSON for: ${instruction.substring(0, 50)}...`,
      undefined,
      'Template JSON Generator'
    );
    
    // Extract the content from the response
    const responseContent = data.choices[0]?.message?.content;
    
    if (!responseContent || responseContent.trim() === '') {
      throw new Error('AI returned empty response');
    }
    
    // Parse the JSON content
    const templateJson = JSON.parse(responseContent);
    
    return templateJson;
  } catch (error) {
    console.error('Error generating template JSON suggestion:', error);
    throw error;
  }
}