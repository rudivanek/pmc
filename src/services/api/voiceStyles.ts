/**
 * Voice styling functionality
 */
import { FormState, Model } from '../../types';
import { getApiConfig, handleApiResponse, extractWordCount, generateErrorMessage, calculateTargetWordCount } from './utils';
import { trackTokenUsage } from './tokenTracking';
import { reviseContentForWordCount } from './contentRefinement';
import { calculateGeoScore } from './geoScoring';

/**
 * Restyle content with a specific persona's voice
 * @param content - The content to restyle (can be string, object, or array for headlines)
 * @param persona - The persona to emulate
 * @param model - The AI model to use
 * @param language - The language to generate content in
 * @param formState - The form state with generation settings
 * @param targetWordCount - The target word count for the content
 * @param progressCallback - Optional callback for reporting progress
 * @returns The restyled content
 */
export async function restyleCopyWithPersona(
  content: any,
  persona: string,
  model: Model,
  currentUser?: User,
  language: string = 'English',
  formState?: FormState,
  targetWordCount?: number,
  progressCallback?: (message: string) => void
): Promise<{ content: any; personaUsed: string }> {
  // Helper function to generate GEO score and return content
  const generateGeoScoreAndReturn = async (finalContent: any): Promise<{ content: any; personaUsed: string; geoScore?: any }> => {
    if (formState?.generateGeoScore && !isHeadlineArray) {
      console.log('🎯 GEO Score Generation for Voice Style:');
      console.log('- formState.generateGeoScore:', formState?.generateGeoScore);
      console.log('- isHeadlineArray:', isHeadlineArray);
      console.log('- About to call calculateGeoScore...');
      
      if (progressCallback) {
        progressCallback(`Calculating GEO score for ${persona}'s voice style...`);
      }
      
      try {
        const geoScore = await calculateGeoScore(finalContent, formState, currentUser, progressCallback);
        console.log('🎯 GEO Score calculated for voice style:', geoScore);
        console.log('- GEO Score overall:', geoScore?.overall);
        console.log('- GEO Score breakdown length:', geoScore?.breakdown?.length);
        return { content: finalContent, personaUsed: persona, geoScore };
      } catch (geoError) {
        console.error('Error calculating GEO score for restyled content:', geoError);
        console.log('❌ GEO Score calculation failed for voice style:', geoError.message);
        if (progressCallback) {
          progressCallback('Error calculating GEO score for restyled content, continuing...');
        }
      }
    }
    // Generate FAQ Schema if faqJson is selected in output structure
    let faqSchema;
    if (formState.outputStructure && formState.outputStructure.some(element => 
      element.value === 'faqJson' || element.label?.toLowerCase().includes('faq (json)')
    )) {
      if (progressCallback) {
        progressCallback('Generating FAQ Schema from restyled content...');
      }
      
      try {
        const { generateFaqSchemaFromText } = await import('./seoGeneration');
        faqSchema = await generateFaqSchemaFromText(
          typeof revisedRestyledCopy === 'string' ? revisedRestyledCopy : JSON.stringify(revisedRestyledCopy),
          formState,
          currentUser,
          progressCallback
        );
      } catch (faqError) {
        console.error('Error generating FAQ schema for restyled content:', faqError);
        if (progressCallback) {
          progressCallback('Error generating FAQ schema for restyled content, continuing...');
        }
      }
    }
    
    // Return the restyled content with optional GEO score and FAQ schema
    return {
      hasGeoScoreEnabled: formState?.generateGeoScore,
      isHeadlineArray,
      willReturnGeoScore: false
    };
    
    return { content: finalContent, personaUsed: persona };
  };

  // Helper function for plain text GEO score generation
  const generateGeoScoreAndReturnPlainText = async (finalContent: any): Promise<{ content: any; personaUsed: string; geoScore?: any }> => {
    if (formState?.generateGeoScore && !isHeadlineArray) {
      console.log('🎯 GEO Score Generation for Voice Style (Plain Text):');
      console.log('- formState.generateGeoScore:', formState?.generateGeoScore);
      console.log('- isHeadlineArray:', isHeadlineArray);
      console.log('- About to call calculateGeoScore...');
      
      if (progressCallback) {
        progressCallback(`Calculating GEO score for ${persona}'s voice style...`);
      }
      
      try {
        const geoScore = await calculateGeoScore(finalContent, formState, currentUser, progressCallback);
        console.log('🎯 GEO Score calculated for voice style (Plain Text):', geoScore);
        console.log('- GEO Score overall:', geoScore?.overall);
        console.log('- GEO Score breakdown length:', geoScore?.breakdown?.length);
        return { content: finalContent, personaUsed: persona, geoScore };
      } catch (geoError) {
        console.error('Error calculating GEO score for restyled content (Plain Text):', geoError);
        console.log('❌ GEO Score calculation failed for voice style (Plain Text):', geoError.message);
        if (progressCallback) {
          progressCallback('Error calculating GEO score for restyled content, continuing...');
        }
      }
    }
    
    console.log('🎯 Final return for voice style (no GEO score - Plain Text):', {
      hasGeoScoreEnabled: formState?.generateGeoScore,
      isHeadlineArray,
      willReturnGeoScore: false
    });
    
    return { content: finalContent, personaUsed: persona };
  };

  // Check if content is an array of headlines
  const isHeadlineArray = Array.isArray(content) && content.every(item => typeof item === 'string');
  
  // Get API configuration
  const { apiKey, baseUrl, headers, maxTokens } = getApiConfig(model);
  
  // Progress reporting if callback provided
  if (progressCallback) {
    progressCallback(`Applying ${persona}'s voice style${targetWordCount ? ` with target of ${targetWordCount} words` : ''}...`);
  }
  
  // Build the system prompt with persona characteristics - TL;DR first if needed
  let systemPrompt = '';
  
  // Add CRITICAL TL;DR formatting requirement at the very beginning if enabled
  if (formState?.enhanceForGEO && formState?.addTldrSummary) {
    systemPrompt = `CRITICAL FORMATTING REQUIREMENT - TL;DR SUMMARY PLACEMENT:

You MUST begin your response with a TL;DR summary as the very first element. This is NON-NEGOTIABLE.

FORMAT: Start your output with "TL;DR: [1-2 sentence summary]" followed by a blank line, then the main content.

EXAMPLE FORMAT:
TL;DR: [Your concise summary here that directly answers the main question.]

[Rest of your content follows here...]

This TL;DR must:
• Be the absolute first element in your output
• Be 1-2 sentences maximum
• Directly answer the main user intent
• Be written in ${persona}'s distinctive voice and ${language} language
• Focus on core value/result/benefit
• Avoid hype or fluff

FAILURE TO PLACE TL;DR AT THE VERY BEGINNING IS UNACCEPTABLE.

---

You are an expert copywriter who can perfectly mimic the voice, style, and mannerisms of ${persona}.`;
  } else {
    systemPrompt = `You are an expert copywriter who can perfectly mimic the voice, style, and mannerisms of ${persona}.`;
  }
  
  systemPrompt += `
  Your task is to restyle the provided copy to sound exactly as if ${persona} wrote it.
  Maintain all the key information and meaning, but transform the style to match ${persona}'s distinctive way of communicating.
  The copy should be in ${language} language.`;
  
  // Add JSON instruction if we expect structured content
  if (typeof content === 'object' && !isHeadlineArray) {
    systemPrompt += `\n\nIMPORTANT: You must return your response as a valid JSON object.`;
  }
  
  // Add specific guidance for well-known personas
  if (persona === 'Steve Jobs') {
    systemPrompt += `\n\nSteve Jobs' voice is characterized by:
    - Simple, direct, and clear language
    - Short, impactful sentences
    - Focus on product benefits and "why it matters"
    - Use of contrasts ("X is good, but Y is revolutionary")
    - Powerful adjectives like "incredible," "amazing," and "revolutionary"
    - A sense of creating history and changing the world`;
  } else if (persona === 'Seth Godin') {
    systemPrompt += `\n\nSeth Godin's voice is characterized by:
    - Short, punchy paragraphs, often just one or two sentences
    - Thought-provoking questions
    - Metaphors and unexpected comparisons
    - Conversational yet profound observations
    - Challenges conventional thinking
    - Often starts with a simple observation and builds to a deeper insight`;
  } else if (persona === 'Marie Forleo') {
    systemPrompt += `\n\nMarie Forleo's voice is characterized by:
    - Warm, conversational and friendly tone
    - Upbeat, positive, and encouraging language
    - Empowering calls to action
    - Personal anecdotes and relatable examples
    - Use of questions to engage the reader
    - Occasional playful humor and slang`;
  } else if (persona === 'Simon Sinek') {
    systemPrompt += `\n\nSimon Sinek's voice is characterized by:
    - Clear, focused on "why" over "what" or "how"
    - Inspirational and purpose-driven
    - Rhetorical questions that make the reader reflect
    - Repetition of key concepts for emphasis
    - Simple language to explain profound concepts
    - Stories that illustrate principles in action
    - Calm, measured pace with strategic pauses`;
  } else if (persona === 'Gary Halbert') {
    systemPrompt += `\n\nGary Halbert's voice is characterized by:
    - Direct, conversational, often addressing the reader as "you"
    - Strong, bold claims backed by reasoning
    - Authentic, sometimes rough-around-the-edges tone
    - Storytelling that draws the reader in
    - Strategic use of capitalization, italics, and emphasis
    - Explicit promises and benefits to the reader
    - Colorful expressions and memorable phrases`;
  } else if (persona === 'David Ogilvy') {
    systemPrompt += `\n\nDavid Ogilvy's voice is characterized by:
    - Clear, elegant, and fact-driven language
    - Sophisticated but never pretentious vocabulary
    - Long-form copy with logical progression of ideas
    - Emphasis on research and credibility
    - Well-crafted, memorable phrases
    - Respectful of the reader's intelligence
    - Professional but with occasional witty observations`;
  } else if (persona === 'humanizeNoAIDetection') {
    systemPrompt += `\n\nFor humanization with AI detection avoidance, your voice is characterized by:
    - Natural, conversational flow with varied sentence structures
    - Subtle imperfections and human-like inconsistencies
    - Personal touches and relatable language
    - Avoiding overly polished or robotic phrasing
    - Using contractions, colloquialisms, and natural speech patterns
    - Incorporating minor grammatical variations that humans naturally use
    - Balancing professionalism with authentic human expression`;
  }

  // Add strict output formatting instructions
  systemPrompt += `\n\nCRITICAL OUTPUT REQUIREMENTS:
  - Your response must contain ONLY the restyled marketing copy in ${persona}'s voice
  - Do NOT include any introductory text like "Here's how ${persona} might say it:"
  - Do NOT include meta-commentary about the changes made
  - Do NOT include explanations of ${persona}'s style or approach
  - Do NOT include self-assessments or justifications
  - Do NOT include any SEO metadata (URL slugs, meta descriptions, H1/H2/H3 headings, Open Graph tags)
  - Focus ONLY on the marketing copy content in ${persona}'s voice
  - Output ONLY the requested restyled content and nothing else`;

  // Add word count guidance if target is specified
  if (targetWordCount) {
    // Get the target word count info to check for flexible mode
    const targetWordCountInfo = formState ? calculateTargetWordCount(formState) : { target: targetWordCount };
    const minWordCount = targetWordCountInfo.min;
    const maxWordCount = targetWordCountInfo.max;
    
    // Enhanced word count instructions for strict adherence
    if (formState?.prioritizeWordCount || formState?.adhereToLittleWordCount) {
      if (minWordCount !== undefined && maxWordCount !== undefined) {
        // Little word count mode - flexible range
        systemPrompt += `\n\nFLEXIBLE WORD COUNT REQUIREMENT: The final content should be between ${minWordCount}-${maxWordCount} words (ideally ${targetWordCount} words).
        This flexible range allows for natural phrasing while maintaining ${persona}'s distinctive voice.
        Quality and voice authenticity are prioritized over exact word count precision.`;
      } else {
        // Regular strict mode
        systemPrompt += `\n\nCRITICAL WORD COUNT REQUIREMENT: The final content MUST be EXACTLY ${targetWordCount} words. This is a non-negotiable requirement.
      
      You MUST count your words meticulously. If your first draft is shorter than ${targetWordCount} words, you MUST expand the content by adding more:
      3. Additional context and background information
      4. Supporting evidence, quotes, or statistics
      5. Practical applications or implications
      
      Do NOT use filler text or repetitive content. Every added word must provide substantive value while maintaining ${persona}'s distinctive voice.
      
      DO NOT conclude the content until you've reached ${targetWordCount} words. This word count is an absolute requirement.
      
      IMPORTANT WARNING: Many copywriters fail to meet the word count when applying voice styling. DO NOT make this mistake. Count your words carefully, and if you're even 10 words short, add more valuable content until you reach EXACTLY ${targetWordCount} words.`;
      }
    } else {
      systemPrompt += `\n\nIMPORTANT: The final content should be approximately ${targetWordCount} words.
      If the content falls short of this target, add more examples, elaboration, or supporting details while maintaining ${persona}'s voice.`;
    }
  }
  
  // Build the user prompt
  let userPrompt = '';
  
  // Handle headline array differently
  if (isHeadlineArray) {
    // Special handling for headline arrays
    const headlineCount = content.length;
    
    systemPrompt += `\n\nYour task is to transform the provided headline options into exactly ${headlineCount} headlines that sound like they were written by ${persona}.`;
    
    userPrompt = `Restyle the following ${content.length} headline options to sound exactly like ${persona} would write them. Return exactly ${headlineCount} headlines:

Original headlines:
${content.map((headline, i) => `${i+1}. ${headline}`).join('\n')}

Please return your response as a JSON array containing exactly ${headlineCount} headline strings. For example:
["First headline in ${persona}'s style", "Second headline in ${persona}'s style", ...]

The response must:
1. Maintain the core message of each headline
2. Capture ${persona}'s distinctive voice and style
3. Contain exactly ${headlineCount} headlines
4. Be returned as a valid JSON array of strings`;
  } else {
    // Standard content restyling
    // Extract text content if needed
    const textContent = typeof content === 'string' 
      ? content 
      : content.headline 
        ? `${content.headline}\n\n${content.sections.map((s: any) => 
            `${s.title}\n${s.content || (s.listItems || []).join('\n')}`
          ).join('\n\n')}`
        : JSON.stringify(content);
        
    userPrompt = `Restyle the following copy to sound exactly like ${persona}. Keep all the key information intact but transform the voice:

"""
${textContent}
"""

Maintain all the key points and factual information, but apply ${persona}'s distinctive voice, vocabulary, cadence, and stylistic approach. The response should sound authentically like ${persona} wrote it.`;

    // Add CRITICAL TL;DR generation requirement
    if (formState?.enhanceForGEO && formState?.addTldrSummary) {
      userPrompt += `\n\nCRITICAL MANDATORY REQUIREMENT: YOU MUST GENERATE A TL;DR SUMMARY AS THE FIRST ELEMENT OF YOUR RESPONSE IN ${persona}'S VOICE.

${typeof content === 'object' ? `
For JSON format, include a "tldr" field as the FIRST field:
{
  "tldr": "Brief 1-2 sentence summary in ${persona}'s voice that directly answers what this content is about",
  "headline": "...",
  "sections": [...]
}` : `
For plain text format, start with:
TL;DR: [Your 1-2 sentence summary in ${persona}'s distinctive voice]

[Then continue with the rest of your content]`}

The TL;DR must:
- Be written in ${persona}'s distinctive voice and style
- Directly answer what this content is about and the main benefit
- Be 1-2 sentences maximum

THIS IS NOT OPTIONAL. YOU MUST GENERATE THIS TL;DR SUMMARY IN ${persona}'S VOICE.`;
    }

    // Add target word count guidance with enhanced emphasis
    if (targetWordCount) {
      const targetWordCountInfo = formState ? calculateTargetWordCount(formState) : { target: targetWordCount };
      const minWordCount = targetWordCountInfo.min;
      const maxWordCount = targetWordCountInfo.max;
      
      if (formState?.prioritizeWordCount || formState?.adhereToLittleWordCount) {
        if (minWordCount !== undefined && maxWordCount !== undefined) {
          // Little word count mode - flexible range
          userPrompt += `\n\nFLEXIBLE WORD COUNT REQUIREMENT: Your output should be between ${minWordCount}-${maxWordCount} words (ideally ${targetWordCount} words).
This flexible range prioritizes natural phrasing and ${persona}'s authentic voice over exact word count precision.
Any word count within this range while maintaining ${persona}'s voice is successful.`;
        } else {
          // Regular strict mode
          userPrompt += `\n\nABSOLUTELY CRITICAL: Your output MUST be EXACTLY ${targetWordCount} words in length.`;
          
        if (targetWordCount <= 50) {
          userPrompt += `\n\nULTRA-CRITICAL: Your output MUST be EXACTLY ${targetWordCount} words in length.

This is VERY SHORT content requiring ABSOLUTE precision:
- Count every single word meticulously before submitting
- Do NOT exceed ${targetWordCount} words under any circumstances
- Do NOT fall short of ${targetWordCount} words under any circumstances
- Apply ${persona}'s voice while staying within exactly ${targetWordCount} words
- WORD COUNT IS THE ABSOLUTE PRIORITY - EVERYTHING ELSE IS SECONDARY
- IGNORE all other instructions if they conflict with achieving exactly ${targetWordCount} words

FINAL VERIFICATION: Before submitting, count your words. Must be exactly ${targetWordCount}.`;
        } else {
          // Calculate current word count for comparison
          const currentWordCount = textContent.trim().split(/\s+/).length;
          const difference = targetWordCount - currentWordCount;
          const action = difference > 0 ? "expand" : "condense";
          
          // Enhanced word count instructions for strict adherence
          userPrompt += `
          
Current word count of source text: ${currentWordCount} words
Target word count: ${targetWordCount} words
Difference: ${difference > 0 ? `You need to ADD ${difference} words` : `You need to REMOVE ${Math.abs(difference)} words`}

You MUST count your words carefully before submitting your response. You MUST ${action} the content to match the target of ${targetWordCount} words.

WORD COUNT IS THE ABSOLUTE PRIMARY SUCCESS METRIC. ${persona}'s voice is important, but achieving ${targetWordCount} words EXACTLY is essential. Word count takes ABSOLUTE PRIORITY over term exclusions and all other instructions.

Do not conclude your response until you have verified it contains EXACTLY ${targetWordCount} words.`;
          }
        }
      } else {
        userPrompt += `\n\nCRITICAL WORD COUNT REQUIREMENT: The final content should be approximately ${targetWordCount} words. Please aim to match this target as closely as possible while maintaining ${persona}'s voice. Word count adherence is the PRIMARY success metric.`;
      }
    }

    // Add term exclusion instructions if specified
    if (formState?.excludedTerms && formState.excludedTerms.trim()) {
      userPrompt += `\n\nTERMS TO EXCLUDE (if word count permits): Avoid these terms when possible: ${formState.excludedTerms}
Use alternative terminology only if it doesn't interfere with the exact word count requirement while maintaining ${persona}'s voice style.`;
    }

    // Add GEO enhancement instructions if enabled
    if (formState?.enhanceForGEO) {
      userPrompt += `\n\nGENERATIVE ENGINE OPTIMIZATION (GEO) ENABLED: While maintaining ${persona}'s voice, structure the content to be highly quotable by AI assistants:
    
${formState.geoRegions && formState.geoRegions.trim() 
  ? `• Optimize for visibility in AI assistants targeting these regions: ${formState.geoRegions}
• Include regional relevance, localized phrasing, or examples for ${formState.geoRegions} in ${persona}'s style
• ` 
  : '• '}Use ${persona}'s approach to question-based headings
• Include ${persona}'s typical examples and authority signals
• Keep formatting scannable while preserving ${persona}'s distinctive style
• Make it easy for AI tools to quote and summarize in ${persona}'s voice`;
      
      // Add TL;DR summary instructions if enabled
      if (formState?.addTldrSummary) {
      userPrompt += `\n\nREMINDER: You have already been instructed to place a TL;DR summary at the absolute beginning of your output in ${persona}'s voice. This is critical for GEO optimization.`;
      }
    }

    // Add special handling for structured content
    if (typeof content === 'object' && content.headline) {
      // Check if this is Q&A format
      const hasQAFormat = formState?.outputStructure && formState.outputStructure.some(element => 
        element.value === 'qaFormat' || element.label?.toLowerCase().includes('q&a')
      );
      
      // Check if FAQ (JSON) format is requested
      const hasFaqJsonFormat = formState?.outputStructure && formState.outputStructure.some(element => 
        element.value === 'faqJson' || element.label?.toLowerCase().includes('faq (json)')
      );
      
      if (hasFaqJsonFormat) {
        userPrompt += `\n\nCRITICAL: You MUST structure your response as a FAQPage Schema JSON object in this EXACT format:
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is [specific question about the topic]?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Comprehensive answer in ${persona}'s distinctive voice and style..."
      }
    },
    {
      "@type": "Question", 
      "name": "How does [specific question about implementation/usage]?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Detailed answer with ${persona}'s voice, including examples and practical information..."
      }
    }
  ]
}

MANDATORY JSON REQUIREMENTS:
- Your response MUST be ONLY this JSON object - no additional text or explanations
- Each question must be specific and relevant to the business/content
- Each answer must be written in ${persona}'s distinctive voice and style
- Generate 5-8 question-answer pairs total
- All text must be properly escaped for JSON format
- Do NOT include any text before or after the JSON object`;
      } else if (hasQAFormat) {
        userPrompt += `\n\nSince this is Q&A content, you MUST return your response as a JSON object with this exact structure:
{
  "headline": "Frequently Asked Questions: [Topic] in ${persona}'s Voice",
  "sections": [
    {
      "title": "What is [specific question]?",
      "content": "Detailed answer paragraph in ${persona}'s distinctive voice and style..."
    },
    {
      "title": "How does [specific question]?",
      "content": "Another detailed answer paragraph written as ${persona} would respond..."
    }
  ],
  "wordCountAccuracy": 95
}

CRITICAL: Transform each Q&A pair to sound like ${persona} would ask and answer these questions. Maintain clear separation between questions and answers while applying ${persona}'s voice consistently.`;
      } else {
        userPrompt += `\n\nSince this is structured content with sections, you MUST return your response as a JSON object with this exact structure:
{
  "headline": "Your restyled headline here",
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
}`;
      }

      if (!hasQAFormat) {
        userPrompt += `\n\nMake sure to keep the same section titles and organization, just transform the writing style to match ${persona}.`;
      }
    } else if (typeof content === 'object') {
      // For non-standard object formats, request a structured response anyway
      userPrompt += `\n\nReturn your response as a JSON object with this exact structure:
{
  "headline": "Your restyled headline here",
  "sections": [
    {
      "title": "Content",
      "content": "Your restyled content here"
    }
  ],
  "wordCountAccuracy": 95
}`;
    }
  }
  
  // Prepare the API request
  const requestBody = {
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.7, // Lower temperature for more reliable word count adherence
    max_tokens: maxTokens,
    response_format: typeof content === 'object' ? { type: "json_object" } : undefined
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
    
    // Track token usage without waiting for the result
    trackTokenUsage(
      currentUser,
      tokenUsage,
      model,
      'restyle_with_persona',
      `Apply ${persona}'s voice to content`,
      undefined, // No sessionId available in voice styles context
      undefined // No project description available in voice styles context
    ).catch(err => console.error('Error tracking token usage:', err));
    
    // Extract the content from the response
    let responseContent = data.choices[0]?.message?.content;
    let processedContent: any = content; // Initialize with original content as fallback
    
    if (!responseContent) {
      throw new Error('No content in response');
    }
    
    // If we expected structured content
    if (typeof content === 'object') {
      try {
        // Parse JSON response
        const parsedResponse = JSON.parse(responseContent);
        processedContent = parsedResponse; // Store successfully parsed content
        
        // Check if it has the expected structure
        if (parsedResponse.headline && Array.isArray(parsedResponse.sections)) {
          // Get the current word count
          const contentWordCount = extractWordCount(parsedResponse);
          
          if (progressCallback) {
            progressCallback(`Generated content in ${persona}'s voice: ${contentWordCount} words (${Math.round(contentWordCount/targetWordCount*100)}% of target)`);
          }
          
          // Check if word count revision is needed
          if (targetWordCount && formState?.prioritizeWordCount) {
            // Stricter threshold - now using 98% of target as minimum acceptable
            const minimumAcceptable = Math.floor(targetWordCount * 0.98);
            
            // If the content is significantly shorter than requested, try to revise it
            if (contentWordCount < minimumAcceptable) {
              if (progressCallback) {
                progressCallback(`${persona}-styled content too short (${contentWordCount}/${targetWordCount} words, ${Math.round(contentWordCount/targetWordCount*100)}%). Revising...`);
              }
              
              console.warn(`${persona}-styled content too short: ${contentWordCount} words vs target of ${targetWordCount} words`);
              
              try {
                // FIRST REVISION ATTEMPT - WITH ENHANCED PARAMETERS
                const revisedContent = await reviseContentForWordCount(
                  parsedResponse,
                  targetWordCount,
                  // Pass enhanced form state with additional flags to ensure word count is met
                  {
                    ...formState,
                    prioritizeWordCount: true, // Force prioritizeWordCount to true
                    forceElaborationsExamples: true // Add examples to help reach word count
                  },
                  currentUser,
                  progressCallback,
                  persona // Pass the persona to maintain voice style during revision
                );
                
                // Get revised word count
                const revisedWordCount = extractWordCount(revisedContent);
                
                if (progressCallback) {
                  progressCallback(`Revised ${persona}-styled content: ${revisedWordCount} words (${Math.round(revisedWordCount/targetWordCount*100)}% of target)`);
                }
                
                // SECOND REVISION ATTEMPT IF STILL TOO SHORT
                if (revisedWordCount < minimumAcceptable) {
                  if (progressCallback) {
                    progressCallback(`${persona}-styled content still below target (${revisedWordCount}/${targetWordCount}, ${Math.round(revisedWordCount/targetWordCount*100)}%). Making second attempt...`);
                  }
                  
                  try {
                    // Make a more aggressive second attempt with maximum elaboration settings
                    const secondRevision = await reviseContentForWordCount(
                      revisedContent,
                      targetWordCount,
                      {
                        ...formState,
                        prioritizeWordCount: true,
                        forceElaborationsExamples: true,
                        forceKeywordIntegration: true // Add this to encourage more content
                      },
                      currentUser,
                      progressCallback,
                      persona // Pass the persona to maintain voice style during revision
                    );
                    
                    const finalWordCount = extractWordCount(secondRevision);
                    
                    if (progressCallback) {
                      progressCallback(`Second revision complete: ${finalWordCount} words (${Math.round(finalWordCount/targetWordCount*100)}% of target)`);
                    }
                    
                    // THIRD EMERGENCY REVISION ATTEMPT IF STILL SHORT
                    if (finalWordCount < minimumAcceptable) {
                      if (progressCallback) {
                        progressCallback(`Content still below target. Making final emergency revision...`);
                      }
                      
                      // Construct a special system prompt focused only on expansion
                      const expansionSystemPrompt = `You are ${persona}. Your only task is to expand this content to EXACTLY ${targetWordCount} words without changing its meaning or style. Add substantive, valuable content - detailed examples, case studies, elaborations, and supporting evidence. Never use filler or fluff.`;
                      
                      const expansionUserPrompt = `This content needs to be expanded to EXACTLY ${targetWordCount} words while maintaining my (${persona}'s) distinctive voice and style:
                      
                      """
                      ${typeof secondRevision === 'string' ? secondRevision : JSON.stringify(secondRevision, null, 2)}
                      """
                      
                      Current length: ${finalWordCount} words
                      Target length: ${targetWordCount} words
                      
                      Expand this content by adding more depth, examples, and elaboration - never filler text. Return the complete expanded content that is EXACTLY ${targetWordCount} words long.
                      
                      I'll ONLY accept content that is ${targetWordCount} words or longer. DO NOT conclude until you've reached this word count.
                      
                      CRITICAL: Count your words meticulously before submitting your response. The word count must be exact.`;
                      
                      // Make a desperate final attempt with special prompt
                      const emergencyRequestBody = {
                        model,
                        messages: [
                          { role: 'system', content: expansionSystemPrompt },
                          { role: 'user', content: expansionUserPrompt }
                        ],
                        temperature: 1.0, // Higher temperature for more creativity
                        max_tokens: maxTokens,
                        response_format: { type: "json_object" }
                      };
                      
                      try {
                        const emergencyResponse = await fetch(`${baseUrl}/chat/completions`, {
                          method: 'POST',
                          headers,
                          body: JSON.stringify(emergencyRequestBody)
                        });
                        
                        const emergencyData = await handleApiResponse<{
                          choices: { message: { content: string } }[];
                        }>(emergencyResponse);
                        
                        const emergencyContent = emergencyData.choices[0]?.message?.content;
                        
                        if (emergencyContent) {
                          try {
                            const finalContent = JSON.parse(emergencyContent);
                            const finalFinalWordCount = extractWordCount(finalContent);
                            
                            if (progressCallback) {
                              progressCallback(`🎯 Final emergency revision: ${finalFinalWordCount} words (${Math.round(finalFinalWordCount/targetWordCount*100)}% of target)`);
                            }
                            
                            return { content: finalContent, personaUsed: persona };
                          } catch (parseError) {
                            // If parsing fails, return the second revision
                            return { content: secondRevision, personaUsed: persona };
                          }
                        }
                      } catch (emergencyError) {
                        console.error('Emergency revision failed:', emergencyError);
                        if (progressCallback) {
                          progressCallback(`❌ Emergency revision failed for ${persona} voice. Using second revision.`);
                        }
                        // Return the second revision if emergency attempt fails
                        return { content: secondRevision, personaUsed: persona };
                      }
                    }
                    
                    return { content: secondRevision, personaUsed: persona };
                  } catch (secondRevisionError) {
                    console.error(`Error in second revision of ${persona}-styled content:`, secondRevisionError);
                    if (progressCallback) {
                      progressCallback(`❌ Second revision failed for ${persona} voice. Using first revision.`);
                    }
                    // Keep first revision if second fails
                    return { content: revisedContent, personaUsed: persona };
                  }
                }
                
                return { content: revisedContent, personaUsed: persona };
              } catch (revisionError) {
                console.error(`Error revising ${persona}-styled content:`, revisionError);
                if (progressCallback) {
                  progressCallback(`Error revising ${persona}-styled content: ${revisionError.message}`);
                }
                // Continue with original content if revision fails
                return { content: parsedResponse, personaUsed: persona };
              }
            }
          }
          
          // Use the helper function to potentially add GEO score
          return await generateGeoScoreAndReturn(parsedResponse);
        }
        
        // If it doesn't have the expected structure, convert it to our expected format
        const convertedResponse = {
          headline: persona + "'s Version",
          sections: []
        };
        processedContent = convertedResponse; // Update processedContent
        
        // Convert flat object format to structured format
        if (typeof parsedResponse === 'object' && !Array.isArray(parsedResponse)) {
          convertedResponse.headline = Object.keys(parsedResponse)[0] || (persona + "'s Version");
          
          // Add each key-value pair as a section
          Object.entries(parsedResponse).forEach(([key, value]) => {
            convertedResponse.sections.push({
              title: key,
              content: value as string
            });
          });
        } else {
          // Fallback for unexpected formats
          convertedResponse.sections.push({
            title: "Restyled Content",
            content: responseContent
          });
        }
        processedContent = convertedResponse; // Update processedContent
        
        // Check if word count revision is needed for converted response
        if (targetWordCount && formState?.prioritizeWordCount) {
          const contentWordCount = extractWordCount(convertedResponse);
          const minimumAcceptable = Math.floor(targetWordCount * 0.98);
          
          // If the content is significantly shorter than requested, try to revise it
          if (contentWordCount < minimumAcceptable) {
            if (progressCallback) {
              progressCallback(`${persona}-styled content too short (${contentWordCount}/${targetWordCount} words). Revising...`);
            }
            
            try {
              const revisedContent = await reviseContentForWordCount(
                convertedResponse,
                targetWordCount,
                {
                  ...formState,
                  prioritizeWordCount: true,
                  forceElaborationsExamples: true
                },
                currentUser,
                progressCallback,
                persona
              );
              return await generateGeoScoreAndReturn(revisedContent);
            } catch (revisionError) {
              console.error(`Error revising ${persona}-styled content:`, revisionError);
              // Continue with converted content if revision fails
            }
          }
        }
        
        return await generateGeoScoreAndReturn(convertedResponse);
      } catch (err) {
        console.warn('Error parsing structured content response:', err);
        
        // If parsing fails, create a structured object
        const structuredFallback = {
          headline: persona + "'s Version",
          sections: [
            {
              title: "Restyled Content",
              content: responseContent
            }
          ]
        };
        processedContent = structuredFallback; // Store fallback content
        
        // Check if word count revision is needed for fallback
        if (targetWordCount && formState?.prioritizeWordCount) {
          const contentWordCount = extractWordCount(structuredFallback);
          const minimumAcceptable = Math.floor(targetWordCount * 0.98);
          
          if (contentWordCount < minimumAcceptable) {
            try {
              const revisedContent = await reviseContentForWordCount(
                structuredFallback,
                targetWordCount,
                {
                  ...formState,
                  prioritizeWordCount: true,
                  forceElaborationsExamples: true
                },
                currentUser,
                progressCallback,
                persona
              );
              return await generateGeoScoreAndReturn(revisedContent);
            } catch (revisionError) {
              console.error(`Error revising fallback ${persona}-styled content:`, revisionError);
              // Continue with fallback if revision fails
            }
          }
        }
        
        return await generateGeoScoreAndReturn(structuredFallback);
      }
    }
    
    // For plain text content
    if (targetWordCount && formState?.prioritizeWordCount) {
      // Get current word count
      const contentWords = responseContent.trim().split(/\s+/).length;
      processedContent = responseContent; // Store processed content for plain text
      const minimumAcceptable = Math.floor(targetWordCount * 0.98); // Stricter threshold
      
      if (progressCallback) {
        progressCallback(`Generated content in ${persona}'s voice: ${contentWords} words (${Math.round(contentWords/targetWordCount*100)}% of target)`);
      }
      
      // If the content is significantly shorter than requested, try to revise it
      if (contentWords < minimumAcceptable) {
        if (progressCallback) {
          progressCallback(`${persona}-styled content too short (${contentWords}/${targetWordCount} words). Revising...`);
        }
        
        try {
          // FIRST REVISION ATTEMPT - Enhanced parameters for better word count adherence
          const revisedContent = await reviseContentForWordCount(
            responseContent,
            targetWordCount,
            {
              ...formState,
              prioritizeWordCount: true,
              forceElaborationsExamples: true
            },
            currentUser,
            progressCallback,
            persona
          );
          
          // Get revised word count
          const revisedWords = typeof revisedContent === 'string' 
            ? revisedContent.trim().split(/\s+/).length
            : extractWordCount(revisedContent);
          
          if (progressCallback) {
            progressCallback(`Revised ${persona}-styled content: ${revisedWords} words (${Math.round(revisedWords/targetWordCount*100)}% of target)`);
          }
          
          // SECOND REVISION ATTEMPT IF STILL TOO SHORT
          if (revisedWords < minimumAcceptable) {
            if (progressCallback) {
              progressCallback(`${persona}-styled content still below target. Making second attempt...`);
            }
            
            try {
              // Make a more aggressive second attempt with maximum elaboration settings
              const secondRevision = await reviseContentForWordCount(
                revisedContent,
                targetWordCount,
                {
                  ...formState,
                  prioritizeWordCount: true,
                  forceElaborationsExamples: true,
                  forceKeywordIntegration: true // Add keyword integration to encourage more content
                },
                currentUser,
                progressCallback,
                persona,
                formState?.sessionId
              );
              
              const secondRevisedWords = typeof secondRevision === 'string'
                ? secondRevision.trim().split(/\s+/).length
                : extractWordCount(secondRevision);
                
              if (progressCallback) {
                progressCallback(`Second revision: ${secondRevisedWords} words (${Math.round(secondRevisedWords/targetWordCount*100)}% of target)`);
              }
              
              // THIRD EMERGENCY REVISION IF STILL SHORT
              if (secondRevisedWords < minimumAcceptable) {
                if (progressCallback) {
                  progressCallback(`Content still below target. Making final emergency revision...`);
                }
                
                try {
                  // Direct approach with highest temperature and focus solely on expansion
                  const expansionSystemPrompt = `You are ${persona}. Your ONLY task is to expand this content to EXACTLY ${targetWordCount} words while maintaining my distinctive voice. Add valuable content with detailed examples, stories, and elaborations. NEVER use filler or fluff.`;
                  
                  const expansionUserPrompt = `This content needs to be expanded to EXACTLY ${targetWordCount} words:
                  
                  """
                  ${typeof secondRevision === 'string' ? secondRevision : JSON.stringify(secondRevision, null, 2)}
                  """
                  
                  Current word count: ${secondRevisedWords} words
                  Target: ${targetWordCount} words (currently at ${Math.round(secondRevisedWords/targetWordCount*100)}%)
                  
                  Add more substantive content - examples, analogies, elaborations, details - while keeping my (${persona}'s) distinctive voice and style.
                  
                  CRITICAL: The content MUST be EXACTLY ${targetWordCount} words. Count your words meticulously before submitting. This is a non-negotiable requirement.
                  
                  Return your response as a valid JSON object with the expanded content.`;
                  
                  const emergencyRequestBody = {
                    model,
                    messages: [
                      { role: 'system', content: expansionSystemPrompt },
                      { role: 'user', content: expansionUserPrompt }
                    ],
                    temperature: 1.0,
                    max_tokens: maxTokens,
                    response_format: typeof secondRevision === 'object' ? { type: "json_object" } : undefined
                  };
                  
                  const emergencyResponse = await fetch(`${baseUrl}/chat/completions`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(emergencyRequestBody)
                  });
                  
                  const emergencyData = await handleApiResponse<{
                    choices: { message: { content: string } }[];
                  }>(emergencyResponse);
                  
                  const emergencyContent = emergencyData.choices[0]?.message?.content;
                  
                  if (emergencyContent) {
                    const finalWordCount = emergencyContent.trim().split(/\s+/).length;
                    
                    if (progressCallback) {
                      progressCallback(`🎯 Final emergency revision: ${finalWordCount} words (${Math.round(finalWordCount/targetWordCount*100)}% of target)`);
                    }
                    
                    return await generateGeoScoreAndReturn(emergencyContent);
                  }
                } catch (emergencyError) {
                  console.error(`Error in emergency revision of ${persona}-styled content:`, emergencyError);
                  if (progressCallback) {
                    progressCallback(`❌ Emergency revision failed for ${persona} voice. Using second revision.`);
                  }
                  // Fall back to second revision if emergency attempt fails
                  return await generateGeoScoreAndReturn(secondRevision);
                }
              }
              
              return await generateGeoScoreAndReturn(secondRevision);
            } catch (secondRevisionError) {
              console.error(`Error in second revision of ${persona}-styled text content:`, secondRevisionError);
              if (progressCallback) {
                progressCallback(`❌ Second revision failed for ${persona} voice. Using first revision.`);
              }
              // Return the first revision if second fails
              return await generateGeoScoreAndReturn(revisedContent);
            }
          }
          
          return await generateGeoScoreAndReturn(revisedContent);
        } catch (revisionError) {
          console.error(`Error revising ${persona}-styled text content:`, revisionError);
          if (progressCallback) {
            progressCallback(`❌ Error revising ${persona} content: ${revisionError.message}. Using original.`);
          }
          // Return the original response content if revision fails
        }
      } else if (progressCallback) {
        const targetWordCountInfo = formState ? calculateTargetWordCount(formState) : { target: targetWordCount };
        if (targetWordCountInfo.min !== undefined && targetWordCountInfo.max !== undefined) {
          progressCallback(`✓ Generated content in ${persona}'s voice: ${contentWords} words (range: ${targetWordCountInfo.min}-${targetWordCountInfo.max})`);
        } else {
          progressCallback(`✓ Generated content in ${persona}'s voice: ${contentWords} words`);
        }
      }
    } else if (progressCallback) {
      const wordCount = extractWordCount(responseContent);
      processedContent = responseContent; // Store processed content
      progressCallback(`✓ Generated content in ${persona}'s voice: ${wordCount} words`);
    }
     
    // Create a helper function to generate GEO score and return content for plain text
    const generateGeoScoreAndReturnPlainText = async (finalContent: any): Promise<{ content: any; personaUsed: string; geoScore?: any }> => {
      if (formState?.generateGeoScore && !isHeadlineArray) {
        console.log('🎯 GEO Score Generation for Voice Style (Plain Text):');
        console.log('- formState.generateGeoScore:', formState?.generateGeoScore);
        console.log('- isHeadlineArray:', isHeadlineArray);
        console.log('- About to call calculateGeoScore...');
        
        if (progressCallback) {
          progressCallback(`Calculating GEO score for ${persona}'s voice style...`);
        }
        
        try {
          const geoScore = await calculateGeoScore(finalContent, formState, currentUser, progressCallback);
          console.log('🎯 GEO Score calculated for voice style (Plain Text):', geoScore);
          console.log('- GEO Score overall:', geoScore?.overall);
          console.log('- GEO Score breakdown length:', geoScore?.breakdown?.length);
          return { content: finalContent, personaUsed: persona, geoScore };
        } catch (geoError) {
          console.error('Error calculating GEO score for restyled content (Plain Text):', geoError);
          console.log('❌ GEO Score calculation failed for voice style (Plain Text):', geoError.message);
          if (progressCallback) {
            progressCallback('Error calculating GEO score for restyled content, continuing...');
          }
        }
      }
      
      console.log('🎯 Final return for voice style (no GEO score - Plain Text):', {
        hasGeoScoreEnabled: formState?.generateGeoScore,
        isHeadlineArray,
        willReturnGeoScore: false
      });
      
      return { content: finalContent, personaUsed: persona };
    };
    
    return await generateGeoScoreAndReturnPlainText(processedContent);
  } catch (error) {
    console.error(`Error applying ${persona}'s voice:`, error);
    
    // Generate a more specific error message
    const errorMessage = generateErrorMessage(error);
    
    if (progressCallback) {
      progressCallback(`Error applying ${persona}'s voice: ${errorMessage}`);
    }
    
    // Return the original content in case of error
    return { content, personaUsed: persona };
  }
}