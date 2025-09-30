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
  // Check if content is an array of headlines
  const isHeadlineArray = Array.isArray(content) && content.every(item => typeof item === 'string');
  
  // Check if we should use structured format
  const useStructuredFormat = typeof content === 'object' && !isHeadlineArray;

  // Helper function to perform emergency revision
  const performEmergencyRevision = async (failedContent: any): Promise<any> => {
    let emergencyContent = null;
    console.log('🚨 Performing emergency revision for failed content...');
    
    try {
      // Emergency revision logic would go here
      return emergencyContent;
    } catch (emergencyError) {
      console.error('Emergency revision failed:', emergencyError);
      throw emergencyError;
    }
  };
  
  try {
  // Get API configuration
  const { apiKey, baseUrl, headers, maxTokens } = getApiConfig(model);
  
  // Progress reporting if callback provided
  if (progressCallback) {
    progressCallback(`Applying ${persona}'s voice style${targetWordCount ? ` with target of ${targetWordCount} words` : ''}...`);
  }
  
  // Build the system prompt with persona characteristics - TL;DR first if needed
  let systemPrompt = '';
  
  // Add CRITICAL TL;DR formatting requirement at the very beginning if enabled
  if (formState?.enhanceForGEO && formState?.addTldrSummary && !isHeadlineArray) {
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
  } else if (persona === 'Brené Brown') {
    systemPrompt += `\n\nBrené Brown's voice is characterized by:
    - Vulnerable, authentic, and deeply empathetic tone
    - Research-backed insights combined with personal storytelling
    - Language around courage, vulnerability, and emotional intelligence
    - Warm but professional approach to difficult topics
    - Use of inclusive, non-judgmental language
    - Emphasis on human connection and belonging
    - Gentle but powerful calls to action around personal growth`;
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
      - Detailed examples in ${persona}'s style
      - Supporting evidence or anecdotes typical of ${persona}
      - Additional context and background information
      - Supporting evidence, quotes, or statistics
      - Practical applications or implications
      
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

        // Return here to avoid adding other format instructions
        return userPrompt;
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
    
    // MANDATORY TOKEN TRACKING - API call fails if tracking fails
    if (currentUser && tokenUsage > 0) {
      await trackTokenUsage(
        currentUser,
        tokenUsage,
        model,
        'apply_voice_style'
      );
    }
    
    // Extract the content from the response
    let responseContent = data.choices[0]?.message?.content;
    
    if (!responseContent || responseContent.trim() === '') {
      throw new Error(`${persona} voice styling returned empty content. This may be due to content length or model limitations.`);
    }
    
    // Handle headline array responses
    if (isHeadlineArray) {
      try {
        const headlineArray = JSON.parse(responseContent);
        if (Array.isArray(headlineArray)) {
          if (progressCallback) {
            progressCallback(`✓ Generated ${headlineArray.length} headlines in ${persona}'s voice`);
          }
          return { content: headlineArray, personaUsed: persona };
        } else {
          throw new Error('Response is not an array of headlines');
        }
      } catch (parseError) {
        console.error('Error parsing headline array response:', parseError);
        throw new Error(`Failed to parse ${persona}'s headline response. The AI may have returned invalid JSON.`);
      }
    }
    
    // If we expected structured content
    if (typeof content === 'object') {
      try {
        // Parse JSON response
        console.log('🔍 Attempting to parse structured JSON response for voice styling...');
        const parsedResponse = JSON.parse(responseContent);
        console.log('✅ Successfully parsed structured JSON response:', parsedResponse);
        
        // Check if it has the expected structure
        if (parsedResponse.headline && Array.isArray(parsedResponse.sections)) {
          console.log('✅ Structured content has valid headline and sections');
          // Get the current word count
          const contentWordCount = extractWordCount(parsedResponse);
          console.log(`📊 Structured content word count: ${contentWordCount} words (target: ${targetWordCount})`);
          
          if (progressCallback) {
            progressCallback(`Generated content in ${persona}'s voice: ${contentWordCount} words (${targetWordCount ? Math.round(contentWordCount/targetWordCount*100) : 'no target'}% of target)`);
          }
          
          // Check if word count revision is needed
          if (targetWordCount && (formState?.prioritizeWordCount || formState?.adhereToLittleWordCount)) {
            console.log('🔄 Checking if word count revision is needed for structured content...');
            const targetWordCountInfo = formState ? calculateTargetWordCount(formState) : { target: targetWordCount };
            
            let needsRevision = false;
            let revisionReason = '';
            
            if (targetWordCountInfo.min !== undefined && targetWordCountInfo.max !== undefined) {
              // Little word count mode - check if within range
              if (contentWordCount < targetWordCountInfo.min) {
                needsRevision = true;
                revisionReason = `below range (${contentWordCount} < ${targetWordCountInfo.min})`;
              } else if (contentWordCount > targetWordCountInfo.max) {
                needsRevision = true;
                revisionReason = `above range (${contentWordCount} > ${targetWordCountInfo.max})`;
              }
            } else {
              // Regular strict mode
              const minimumAcceptable = Math.floor(targetWordCount * 0.98);
              if (contentWordCount < minimumAcceptable) {
                needsRevision = true;
                revisionReason = `too short (${contentWordCount}/${targetWordCount} words)`;
              }
            }
            
            // If the content needs revision, try to revise it
            if (needsRevision) {
              console.log(`⚠️ Structured content ${revisionReason}. Attempting revision...`);
              if (progressCallback) {
                progressCallback(`${persona}-styled content ${revisionReason}. Revising...`);
              }
              
              try {
                const revisedContent = await reviseContentForWordCount(
                  parsedResponse,
                  targetWordCountInfo,
                  {
                    ...formState,
                    prioritizeWordCount: true,
                    forceElaborationsExamples: true
                  },
                  currentUser,
                  progressCallback,
                  persona,
                  formState?.sessionId
                );
                
                console.log('✅ Successfully revised structured content:', typeof revisedContent);
                const revisedWordCount = extractWordCount(revisedContent);
                console.log(`📊 Revised structured content word count: ${revisedWordCount} words`);
                
                // Generate GEO score if enabled
                if (formState?.generateGeoScore) {
                  if (progressCallback) {
                    progressCallback(`Calculating GEO score for ${persona}'s voice style...`);
                  }
                  
                  try {
                    console.log('🌍 Calculating GEO score for revised structured content...');
                    const geoScore = await calculateGeoScore(revisedContent, formState, currentUser, progressCallback);
                    console.log('✅ GEO score calculated for revised content');
                    
                    // Generate FAQ Schema if needed
                    if (formState.outputStructure && formState.outputStructure.some(element => 
                      element.value === 'faqJson' || element.label?.toLowerCase().includes('faq (json)')
                    )) {
                      if (progressCallback) {
                        progressCallback('Generating FAQ Schema from restyled content...');
                      }
                      
                      try {
                        console.log('📋 Generating FAQ Schema from revised structured content...');
                        const { generateFaqSchemaFromText } = await import('./seoGeneration');
                        const faqSchema = await generateFaqSchemaFromText(
                          typeof revisedContent === 'string' ? revisedContent : JSON.stringify(revisedContent),
                          formState,
                          currentUser,
                          progressCallback
                        );
                        console.log('✅ FAQ Schema generated successfully');
                        
                        console.log('🚀 Returning revised structured content with FAQ schema and GEO score');
                        return { content: { content: revisedContent, faqSchema }, personaUsed: persona };
                      } catch (faqError) {
                        console.error('Error generating FAQ schema for restyled content:', faqError);
                        // Continue without FAQ schema
                      }
                    }
                    
                    console.log('🚀 Returning revised structured content with GEO score');
                    return { content: revisedContent, personaUsed: persona };
                  } catch (geoError) {
                    console.error('Error calculating GEO score for restyled content:', geoError);
                    console.log('🚀 Returning revised structured content without GEO score');
                    return { content: revisedContent, personaUsed: persona };
                  }
                }
                
                console.log('🚀 Returning revised structured content (no GEO scoring)');
                return { content: revisedContent, personaUsed: persona };
              } catch (revisionError) {
                console.error(`Error revising ${persona}-styled content:`, revisionError);
                console.log('⚠️ Revision failed, falling back to original parsed content');
                if (progressCallback) {
                  progressCallback(`Error revising ${persona}-styled content: ${revisionError.message}`);
                }
                // Continue with original content if revision fails
              }
            }
          }
          
          // Generate GEO score if enabled (for non-revised content)
          if (formState?.generateGeoScore) {
            console.log('🌍 Calculating GEO score for non-revised structured content...');
            if (progressCallback) {
              progressCallback(`Calculating GEO score for ${persona}'s voice style...`);
            }
            
            try {
              const geoScore = await calculateGeoScore(parsedResponse, formState, currentUser, progressCallback);
              console.log('✅ GEO score calculated for structured content');
              
              // Generate FAQ Schema if needed
              if (formState.outputStructure && formState.outputStructure.some(element => 
                element.value === 'faqJson' || element.label?.toLowerCase().includes('faq (json)')
              )) {
                if (progressCallback) {
                  progressCallback('Generating FAQ Schema from restyled content...');
                }
                
                try {
                  console.log('📋 Generating FAQ Schema from structured content...');
                  const { generateFaqSchemaFromText } = await import('./seoGeneration');
                  const faqSchema = await generateFaqSchemaFromText(
                    typeof parsedResponse === 'string' ? parsedResponse : JSON.stringify(parsedResponse),
                    formState,
                    currentUser,
                    progressCallback
                  );
                  console.log('✅ FAQ Schema generated successfully for structured content');
                  
                  console.log('🚀 Returning structured content with FAQ schema and GEO score');
                  return { content: { content: parsedResponse, faqSchema }, personaUsed: persona };
                } catch (faqError) {
                  console.error('Error generating FAQ schema for restyled content:', faqError);
                  // Continue without FAQ schema
                }
              }
              
              console.log('🚀 Returning structured content with GEO score');
              return { content: parsedResponse, personaUsed: persona };
            } catch (geoError) {
              console.error('Error calculating GEO score for restyled content:', geoError);
              console.log('🚀 Returning structured content without GEO score');
              return { content: parsedResponse, personaUsed: persona };
            }
          }
          
          console.log('🚀 Returning structured content (no GEO scoring, no revision needed)');
          return { content: parsedResponse, personaUsed: persona };
        }
        
        // If it doesn't have the expected structure, convert it to our expected format
        console.log('⚠️ Parsed JSON does not have expected structure, converting...');
        const convertedResponse = {
          headline: persona + "'s Version",
          sections: [
            {
              title: "Restyled Content",
              content: responseContent
            }
          ]
        };
        
        console.log('🚀 Returning converted structured response');
        return { content: convertedResponse, personaUsed: persona };
      } catch (err) {
        console.error('❌ Error parsing structured content response:', err);
        console.log('📝 Raw response that failed to parse:', responseContent);
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
        
        console.log('🚀 Returning structured fallback due to JSON parsing error');
        return { content: structuredFallback, personaUsed: persona };
      }
    }
    
    // For plain text content
    console.log('📝 Processing plain text content...');
    console.log(`📊 Plain text content length: ${responseContent.length} characters`);
    
    if (targetWordCount && (formState?.prioritizeWordCount || formState?.adhereToLittleWordCount)) {
      // Get current word count
      const contentWords = responseContent.trim().split(/\s+/).length;
      console.log(`📊 Plain text word count: ${contentWords} words (target: ${targetWordCount})`);
      const targetWordCountInfo = formState ? calculateTargetWordCount(formState) : { target: targetWordCount };
      
      let needsRevision = false;
      let revisionReason = '';
      
      if (targetWordCountInfo.min !== undefined && targetWordCountInfo.max !== undefined) {
        // Little word count mode - check if within range
        if (contentWords < targetWordCountInfo.min) {
          needsRevision = true;
          revisionReason = `below range (${contentWords} < ${targetWordCountInfo.min})`;
        } else if (contentWords > targetWordCountInfo.max) {
          needsRevision = true;
          revisionReason = `above range (${contentWords} > ${targetWordCountInfo.max})`;
        }
      } else {
        // Regular strict mode
        const minimumAcceptable = Math.floor(targetWordCount * 0.98);
        if (contentWords < minimumAcceptable) {
          needsRevision = true;
          revisionReason = `too short (${contentWords}/${targetWordCount} words)`;
        }
      }
      
      if (progressCallback) {
        progressCallback(`Generated content in ${persona}'s voice: ${contentWords} words (${targetWordCount ? Math.round(contentWords/targetWordCount*100) : 'no target'}% of target)`);
      }
      
      // If the content needs revision, try to revise it
      if (needsRevision) {
        console.log(`⚠️ Plain text content ${revisionReason}. Attempting revision...`);
        if (progressCallback) {
          progressCallback(`${persona}-styled content ${revisionReason}. Revising...`);
        }
        
        try {
          const revisedContent = await reviseContentForWordCount(
            responseContent,
            targetWordCountInfo,
            {
              ...formState,
              prioritizeWordCount: true,
              forceElaborationsExamples: true
            },
            currentUser,
            progressCallback,
            persona,
            formState?.sessionId
          );
          
          console.log('✅ Successfully revised plain text content:', typeof revisedContent);
          console.log(`📊 Revised plain text content length: ${typeof revisedContent === 'string' ? revisedContent.length : 'not string'} characters`);
          
          // Validate that revisedContent is not empty
          if (!revisedContent || (typeof revisedContent === 'string' && revisedContent.trim().length === 0)) {
            console.error('❌ Revision returned empty content! Using original content as fallback.');
            if (progressCallback) {
              progressCallback(`⚠️ Content revision returned empty result. Using original content.`);
            }
            // Use original content as fallback
          } else {
            // Use the revised content
            responseContent = revisedContent;
          }
          
          // Generate GEO score if enabled
          if (formState?.generateGeoScore) {
            console.log('🌍 Calculating GEO score for revised plain text content...');
            if (progressCallback) {
              progressCallback(`Calculating GEO score for ${persona}'s voice style...`);
            }
            
            try {
              const geoScore = await calculateGeoScore(responseContent, formState, currentUser, progressCallback);
              console.log('✅ GEO score calculated for revised plain text content');
              console.log('🚀 Returning revised plain text content with GEO score');
              return { content: responseContent, personaUsed: persona };
            } catch (geoError) {
              console.error('Error calculating GEO score for restyled content:', geoError);
              console.log('🚀 Returning revised plain text content without GEO score');
              return { content: responseContent, personaUsed: persona };
            }
          }
          
          console.log('🚀 Returning revised plain text content (no GEO scoring)');
          return { content: responseContent, personaUsed: persona };
        } catch (revisionError) {
          console.error(`Error revising ${persona}-styled content:`, revisionError);
          console.log('⚠️ Revision failed for plain text, using original content');
          if (progressCallback) {
            progressCallback(`Error revising ${persona}-styled content: ${revisionError.message}`);
          }
          // Continue with original content if revision fails
        }
      }
    }
    
    // Generate GEO score if enabled (for non-revised plain text content)
    if (formState?.generateGeoScore && !isHeadlineArray) {
      console.log('🌍 Calculating GEO score for non-revised plain text content...');
      if (progressCallback) {
        progressCallback(`Calculating GEO score for ${persona}'s voice style...`);
      }
      
      try {
        const geoScore = await calculateGeoScore(responseContent, formState, currentUser, progressCallback);
        console.log('✅ GEO score calculated for plain text content');
        console.log('🚀 Returning plain text content with GEO score');
        return { content: responseContent, personaUsed: persona };
      } catch (geoError) {
        console.error('Error calculating GEO score for restyled content:', geoError);
        console.log('🚀 Returning plain text content without GEO score');
        return { content: responseContent, personaUsed: persona };
      }
    }
    
    console.log('🚀 Returning final plain text content (no GEO scoring, no revision)');
    console.log(`📊 Final content length: ${responseContent.length} characters`);
    console.log(`📝 Final content preview: ${responseContent.substring(0, 100)}...`);
    return { content: responseContent, personaUsed: persona };
  } catch (error: any) {
    console.error(`❌ Critical error in restyleCopyWithPersona for ${persona}:`, error);
    console.log('📋 Error details:', {
      persona,
      model: formState?.model,
      targetWordCount,
      useStructuredFormat,
      isHeadlineArray,
      errorMessage: error.message
    });
    console.error(`Error applying ${persona}'s voice:`, error);
    
    // Generate a more specific error message
    const errorMessage = generateErrorMessage(error);
    
    if (progressCallback) {
      progressCallback(`Error applying ${persona}'s voice: ${errorMessage}`);
    }
    
    // Throw the error to be caught by the calling function
    throw new Error(`Failed to generate ${persona}'s voice style: ${errorMessage}`);
  }
  } catch (error: any) {
    console.error(`❌ Critical error in restyleCopyWithPersona for ${persona}:`, error);
    console.log('📋 Error details:', {
      persona,
      model: formState?.model,
      targetWordCount,
      useStructuredFormat,
      isHeadlineArray,
      errorMessage: error.message
    });
    console.error(`Error applying ${persona}'s voice:`, error);
    
    // Generate a more specific error message
    const errorMessage = generateErrorMessage(error);
    
    if (progressCallback) {
      progressCallback(`Error applying ${persona}'s voice: ${errorMessage}`);
    }
    
    // Throw the error to be caught by the calling function
    throw new Error(`Failed to generate ${persona}'s voice style: ${errorMessage}`);
  }
}