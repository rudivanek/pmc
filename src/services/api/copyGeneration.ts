/**
 * Main copy generation functionality
 */
import { FormState, User, CopyResult } from '../../types';
import { getApiConfig, handleApiResponse, storePrompts, calculateTargetWordCount, extractWordCount, getWordCountTolerance } from './utils';
import { trackTokenUsage } from './tokenTracking';
import { saveCopySession, supabase } from '../supabaseClient';
import { reviseContentForWordCount } from './contentRefinement';
import { generateSeoMetadata } from './seoGeneration';
import { calculateGeoScore } from './geoScoring';
import { v4 as uuidv4 } from 'uuid';

/**
 * Generate copy based on form state
 * @param formState - The form state with generation settings
 * @param currentUser - The current user (for token tracking)
 * @param sessionId - Optional session ID for updating an existing session
 * @param progressCallback - Optional callback for reporting progress
 * @returns A CopyResult object with the generated content
 */
export async function generateCopy(
  formState: FormState,
  currentUser?: User,
  sessionId?: string,
  progressCallback?: (message: string) => void
): Promise<CopyResult> {
  // Get API configuration
  const { apiKey, baseUrl, headers, maxTokens } = getApiConfig(formState.model);
  
  // Ensure session record exists in database before any token tracking
  let actualSessionId = sessionId;
  if (currentUser && sessionId) {
    try {
      // Check if session exists
      const { data: existingSession, error: checkError } = await supabase
        .from('pmc_copy_sessions')
        .select('id')
        .eq('id', sessionId)
        .single();
      
      if (checkError && checkError.code === 'PGRST116') {
        // Session doesn't exist, create it
        const { data: newSession, error: createError } = await saveCopySession(
          formState,
          null, // No content yet
          undefined, // No alternative copy
          sessionId
        );
        
        if (createError) {
          console.error('Error creating session record:', createError);
          // Generate new session ID if creation failed
          actualSessionId = uuidv4();
        } else {
          actualSessionId = newSession?.id || sessionId;
        }
      }
    } catch (err) {
      console.error('Error checking/creating session:', err);
      // Generate new session ID if there's an error
      actualSessionId = uuidv4();
    }
  } else if (currentUser && !sessionId) {
    // Generate new session ID for logged in users
    actualSessionId = uuidv4();
    
    try {
      const { data: newSession, error: createError } = await saveCopySession(
        formState,
        null, // No content yet
        undefined, // No alternative copy
        actualSessionId
      );
      
      if (createError) {
        console.error('Error creating new session record:', createError);
      } else {
        actualSessionId = newSession?.id || actualSessionId;
      }
    } catch (err) {
      console.error('Error creating new session:', err);
    }
  }
  
  // Calculate target word count
  const targetWordCount = calculateTargetWordCount(formState);
  
  // Progress reporting if callback provided
  if (progressCallback) {
    progressCallback(`Initializing copy generation with ${formState.model}...`);
  }
  
  // Auto-distribute word counts if output structure is provided but counts are missing
  if (formState.outputStructure && formState.outputStructure.length > 0) {
    const missingWordCounts = formState.outputStructure.every(
      section => !section.wordCount || section.wordCount === 0
    );

    if (missingWordCounts) {
      const perSection = Math.floor(targetWordCount / formState.outputStructure.length);
      formState.outputStructure = formState.outputStructure.map(section => ({
        ...section,
        wordCount: perSection
      }));
      
      console.log(`Auto-distributed word count: ${perSection} words per section across ${formState.outputStructure.length} sections`);
      
      if (progressCallback) {
        progressCallback(`Auto-distributed ${targetWordCount} words across ${formState.outputStructure.length} sections`);
      }
    }
  }
  
  // Build the system prompt
  const systemPrompt = buildSystemPrompt(formState, targetWordCount);
  
  // Build the user prompt
  const userPrompt = buildUserPrompt(formState, targetWordCount);
  
  // Store the prompts for display in the UI
  storePrompts(systemPrompt, userPrompt);
  
  if (progressCallback) {
    progressCallback(`Generating ${formState.tab === 'create' ? 'new' : 'improved'} copy with target of ${targetWordCount.target} words...`);
  }
  
  // Determine if we should use JSON format
  const useJsonFormat = formState.outputStructure && formState.outputStructure.length > 0;
  
  // Prepare the API request
  const requestBody = {
    model: formState.model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature: targetWordCount <= 150 ? 0.5 : 0.7, // Lower temperature for short content for more precision
    max_tokens: maxTokens, // Use dynamic token limit from API config
    response_format: useJsonFormat ? { type: "json_object" } : undefined
  };
  
  try {
    console.log('Making API request to:', baseUrl);
    console.log('Using model:', formState.model);
    console.log('Request body:', JSON.stringify(requestBody, null, 2));
    
    // Make the API request
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });
    
    console.log('API response received, status:', response.status);
    
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
      `generate_${formState.tab}_copy`,
      formState.briefDescription || `Generate ${formState.tab} copy`,
      actualSessionId,
      formState.projectDescription
    );
    
    // Extract the content from the response
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content in response');
    }
    
    // Parse the content as needed
    let improvedCopy = content;
    
    // Handle JSON responses
    if (useJsonFormat) {
      try {
        improvedCopy = JSON.parse(content);
      } catch (err) {
        console.warn('Failed to parse JSON response, using plain text:', err);
      }
    }
    
    // Get the current word count
    const currentWordCount = extractWordCount(improvedCopy);
    
    if (progressCallback) {
      progressCallback(`Initial copy generated with ${currentWordCount} words (target: ${targetWordCount.target})`);
    }
    
    // Check word count if strict adherence is required
    if (formState.prioritizeWordCount || formState.adhereToLittleWordCount) {
      // Get tolerance settings
      const toleranceSettings = getWordCountTolerance(formState, targetWordCount.target);
      
      // For short content (≤150 words), be more strict about both minimum and maximum
      const targetValue = targetWordCount.target;
      const percentageOfTarget = (currentWordCount / targetValue) * 100;
      
      let needsRevision = false;
      let revisionReason = '';
      
      // Check if revision is needed based on tolerance settings
      if (targetWordCount.min !== undefined && targetWordCount.max !== undefined) {
        // Flexible range mode
        if (currentWordCount < targetWordCount.min) {
          needsRevision = true;
          revisionReason = `below minimum range (${currentWordCount} < ${targetWordCount.min})`;
        } else if (currentWordCount > targetWordCount.max) {
          needsRevision = true;
          revisionReason = `above maximum range (${currentWordCount} > ${targetWordCount.max})`;
        }
      } else {
        // Strict mode
        if (percentageOfTarget < toleranceSettings.minimumAcceptablePercentage) {
          needsRevision = true;
          revisionReason = `below tolerance (${currentWordCount} words = ${percentageOfTarget.toFixed(1)}% of target)`;
        } else if (toleranceSettings.maximumAcceptablePercentage && 
                   percentageOfTarget > toleranceSettings.maximumAcceptablePercentage) {
          needsRevision = true;
          revisionReason = `above tolerance (${currentWordCount} words = ${percentageOfTarget.toFixed(1)}% of target)`;
        }
      }
      
      // If the content is outside acceptable range, try to revise it
      if (needsRevision) {
        console.warn(`Generated content needs revision: ${revisionReason}`);
        
        if (progressCallback) {
          progressCallback(`Content ${revisionReason}. Revising...`);
        }
        
        try {
          // FIRST REVISION ATTEMPT - Enhanced parameters for better word count adherence
          const revisedContent = await reviseContentForWordCount(
            improvedCopy,
            targetWordCount,
            {
              ...formState,
              sessionId: actualSessionId,
              prioritizeWordCount: true, // Force prioritizeWordCount to true
              forceElaborationsExamples: true // Add examples to help reach word count
            },
            currentUser,
            progressCallback,
            undefined, // persona
            actualSessionId
          );
          
          // Update with the revised content
          improvedCopy = revisedContent;
          
          // Log the updated word count
          const revisedWordCount = extractWordCount(revisedContent);
          console.log(`First revision result: ${revisedWordCount} words (target: ${targetValue})`);
          
          // Check if second revision is needed
          const revisedPercentageOfTarget = (revisedWordCount / targetValue) * 100;
          const stillNeedsRevision = targetWordCount.min !== undefined && targetWordCount.max !== undefined
            ? (revisedWordCount < targetWordCount.min || revisedWordCount > targetWordCount.max)
            : revisedPercentageOfTarget < toleranceSettings.minimumAcceptablePercentage;
          
          if (stillNeedsRevision) {
            if (progressCallback) {
              progressCallback(`⚠ Content still outside acceptable range after first revision (${revisedWordCount}/${targetValue} words). The system will automatically attempt further refinements...`);
            }
            // Note: The reviseContentForWordCount function will handle second and emergency revisions internally
          }
          
        } catch (revisionError) {
          console.error('Error revising content for word count:', revisionError);
          if (progressCallback) {
            progressCallback(`❌ Error revising content: ${revisionError.message}. Using original content.`);
          }
          // Continue with original content if revision fails
        }
      } else if (progressCallback) {
        progressCallback(`✓ Content meets word count requirements: ${currentWordCount} words (${percentageOfTarget.toFixed(1)}% of target)`);
      }
    }
    
    // Create the result object with just the improved copy - no alternative or humanized versions initially
    const result: CopyResult = {
      improvedCopy,
      promptUsed: userPrompt // Store for token calculation
    };
    
    // Generate SEO metadata if enabled
    if (formState.generateSeoMetadata) {
      if (progressCallback) {
        progressCallback('Generating SEO metadata...');
      }
      
      try {
        const seoMetadata = await generateSeoMetadata(improvedCopy, formState, currentUser, progressCallback);
        result.seoMetadata = seoMetadata;
      } catch (seoError) {
        console.error('Error generating SEO metadata:', seoError);
        if (progressCallback) {
          progressCallback('Error generating SEO metadata, continuing...');
        }
      }
    }
    
    // Generate FAQ Schema if faqJson is selected in output structure
    if (formState.outputStructure && formState.outputStructure.some(element => 
      element.value === 'faqJson' || element.label?.toLowerCase().includes('faq (json)')
    )) {
      if (progressCallback) {
        progressCallback('Generating FAQ Schema from content...');
      }
      
      try {
        const { generateFaqSchemaFromText } = await import('./seoGeneration');
        const faqSchema = await generateFaqSchemaFromText(
          typeof improvedCopy === 'string' ? improvedCopy : JSON.stringify(improvedCopy),
          formState,
          currentUser,
          progressCallback
        );
        result.faqSchema = faqSchema;
      } catch (faqError) {
        console.error('Error generating FAQ schema:', faqError);
        if (progressCallback) {
          progressCallback('Error generating FAQ schema, continuing...');
        }
      }
    }
    
    // Generate GEO score if enabled
    if (formState.generateGeoScore) {
      if (progressCallback) {
        progressCallback('Calculating GEO score...');
      }
      
      try {
        const geoScore = await calculateGeoScore(improvedCopy, formState, currentUser, progressCallback);
        result.geoScore = geoScore;
      } catch (geoError) {
        console.error('Error calculating GEO score:', geoError);
        if (progressCallback) {
          progressCallback('Error calculating GEO score, continuing...');
        }
      }
    }
    
    // Save to database if session ID is provided
    if (actualSessionId) {
      try {
        const { data: sessionData, error: sessionError } = await saveCopySession(
          formState, 
          improvedCopy, 
          undefined, 
          actualSessionId
        );
        
        if (sessionError) {
          console.error('Error updating copy session:', sessionError);
        } else {
          console.log('Copy session updated:', sessionData?.id);
        }
      } catch (err) {
        console.error('Error saving copy session:', err);
        // Continue even if save fails
      }
    } else if (currentUser) {
      // Create a new session if user is logged in
      try {
        const { data: sessionData, error: sessionError } = await saveCopySession(
          formState,
          improvedCopy
        );
        
        if (sessionError) {
          console.error('Error saving new copy session:', sessionError);
        } else {
          console.log('New copy session created:', sessionData?.id);
          result.sessionId = sessionData?.id || actualSessionId;
        }
      } catch (err) {
        console.error('Error creating new copy session:', err);
        // Continue even if save fails
      }
    }
    
    return result;
  } catch (error) {
    console.error('Error generating copy:', error);
    if (progressCallback) {
      progressCallback(`Error generating copy: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Build the system prompt based on form state
 */
function buildSystemPrompt(formState: FormState, targetWordCountInfo: { target: number; min?: number; max?: number } | number): string {
  const targetWordCount = typeof targetWordCountInfo === 'number' ? targetWordCountInfo : targetWordCountInfo.target;
  const minWordCount = typeof targetWordCountInfo === 'object' ? targetWordCountInfo.min : undefined;
  const maxWordCount = typeof targetWordCountInfo === 'object' ? targetWordCountInfo.max : undefined;
  const isShortContent = targetWordCount <= 150;
  
  let systemPrompt = `You are an expert copywriter with years of experience in creating persuasive, engaging, and effective marketing copy.`;
  
  const useJsonFormat = formState.outputStructure && formState.outputStructure.length > 0;
  
  // Add CRITICAL TL;DR formatting requirement at the very beginning if enabled
  if (formState.enhanceForGEO && formState.addTldrSummary && !useJsonFormat) {
    systemPrompt = `ABSOLUTE MANDATORY REQUIREMENT - TL;DR SUMMARY:

Your response MUST begin with "TL;DR:" followed by exactly one concise sentence that directly answers the main question.

EXACT FORMAT REQUIRED:
TL;DR: [One clear sentence that directly answers what the user wants to know.]

[blank line]

[Rest of your marketing copy content...]

CRITICAL TL;DR RULES:
- Must be the first 3 characters: "TL;" 
- Only ONE sentence in the TL;DR
- Answer the core question directly
- Use natural ${formState.language} language
- No hype words or marketing fluff
- Follow with blank line, then main content

FAILURE TO START WITH "TL;DR:" = COMPLETE REJECTION

---

You are an expert copywriter with years of experience in creating persuasive, engaging, and effective marketing copy.`;
  }
  
  systemPrompt += `\n\nYour task is to create new marketing copy based on the provided information.

The copy should be in ${formState.language} language with a ${formState.tone} tone.

${minWordCount !== undefined && maxWordCount !== undefined
  ? `The copy **must be between ${minWordCount}-${maxWordCount} words** (ideally ${targetWordCount} words).
This is SHORT content with flexible word count tolerance to maintain natural phrasing.
Focus on quality and natural flow within this range.`
  : isShortContent 
    ? `The copy **must be EXACTLY ${targetWordCount} words** — not more, not less.
This is a SHORT content piece requiring precision and conciseness.
Every single word must be carefully chosen and essential.
Do not add unnecessary elaboration or filler. Focus on impact and clarity.
Count your words meticulously before submitting.`
    : `You MUST generate content until this EXACT word count is achieved.
If you are short of ${targetWordCount} words, you MUST add more depth, examples, case studies, detailed explanations, and elaboration until you reach EXACTLY ${targetWordCount} words.
Do NOT stop writing until you have EXACTLY ${targetWordCount} words.
CRITICAL: You will be rejected if the word count is not EXACTLY ${targetWordCount} words.`}`;
  
  // Add tab-specific instructions
  if (formState.tab === 'create') {
    systemPrompt += `\n\nYou will create compelling new marketing copy based on the business description provided. Your copy should effectively communicate the unique value proposition and connect with the target audience at an emotional level.`;
  } else {
    systemPrompt += `\n\nYou will improve the existing marketing copy while maintaining its core message. Your improvements should enhance clarity, persuasiveness, engagement, and strategic alignment while preserving the essential brand identity.`;
  }
  
  // Add ULTRA-CRITICAL output formatting instructions
  systemPrompt += `\n\nULTRA-CRITICAL OUTPUT REQUIREMENTS - WORD COUNT IS EVERYTHING:
  - The word count MUST be EXACTLY ${targetWordCount} words or your response will be COMPLETELY REJECTED
  - COUNT EVERY SINGLE WORD before submitting - if not EXACTLY ${targetWordCount} words, DO NOT SUBMIT
  - Your response must contain ONLY the generated marketing copy
  - Do NOT include any introductory text, concluding remarks, or explanations
  - Do NOT include meta-commentary about how the copy meets requirements
  - Do NOT include self-assessments or justifications
  - Do NOT explain your process or reasoning
  - Output ONLY the requested marketing content and nothing else
  - WORD COUNT VERIFICATION IS MANDATORY: Count words, verify ${targetWordCount} exactly, then submit
  - FAILURE TO MEET EXACTLY ${targetWordCount} WORDS = COMPLETE FAILURE AND REJECTION`;
  
  systemPrompt += `\n\nCRITICAL: DO NOT include any SEO metadata in your content output:
- DO NOT include URL slugs, meta descriptions, or Open Graph tags
- DO NOT include H1, H2, or H3 headings as metadata elements
- DO NOT add any SEO-specific information to the content body
- Focus ONLY on creating compelling marketing copy content
- SEO metadata is handled separately and should NOT be part of your content`;
  
  // Add tone level instructions if specified
  if (formState.toneLevel !== undefined) {
    if (formState.toneLevel < 25) {
      systemPrompt += `\n\nUse a very formal tone that is appropriate for academic or corporate contexts.`;
    } else if (formState.toneLevel < 50) {
      systemPrompt += `\n\nUse a moderately formal tone that is professional but approachable.`;
    } else if (formState.toneLevel < 75) {
      systemPrompt += `\n\nUse a conversational tone that balances professionalism with approachability.`;
    } else {
      systemPrompt += `\n\nUse a casual, friendly tone that feels like a conversation with a trusted friend.`;
    }
  }
  
  // Add writing style instructions if specified
  if (formState.preferredWritingStyle) {
    systemPrompt += `\n\nPreferred writing style: ${formState.preferredWritingStyle}`;
  }
  
  // Add language style constraints if specified
  if (formState.languageStyleConstraints && formState.languageStyleConstraints.length > 0) {
    systemPrompt += `\n\nLanguage style constraints to follow:`;
    formState.languageStyleConstraints.forEach(constraint => {
      systemPrompt += `\n- ${constraint}`;
    });
  }
  
  // Add section-specific instructions
  if (formState.section) {
    systemPrompt += `\n\nThis copy is for the "${formState.section}" section.`;
    
    // Add section-specific guidance
    switch (formState.section) {
      case 'Hero Section':
        systemPrompt += ` Focus on creating an attention-grabbing headline and compelling value proposition that immediately communicates the core benefit and establishes an emotional connection.`;
        break;
      case 'Benefits':
        systemPrompt += ` Focus on clearly articulating the key benefits for the customer, with persuasive language that transforms features into meaningful advantages. Use benefit-driven headlines and supportive evidence.`;
        break;
      case 'Features':
        systemPrompt += ` Describe the key features and how they solve specific problems for the user. Focus on the "so what" of each feature - explaining not just what it does, but why it matters to the user.`;
        break;
      case 'Services':
        systemPrompt += ` Outline the services offered with a focus on value delivered and outcomes achieved. Highlight differentiation factors and expertise.`;
        break;
      case 'About':
        systemPrompt += ` Create an engaging narrative about the business, its mission, values, and unique story. Connect the organization's purpose to customer needs.`;
        break;
      case 'Testimonials':
        systemPrompt += ` Frame testimonials effectively to maximize social proof, highlighting specific results and emotional impact. Create contextual introductions that enhance credibility.`;
        break;
      case 'FAQ':
        systemPrompt += ` Create clear questions and informative answers that address common concerns while subtly reinforcing key selling points and overcoming objections.`;
        break;
      case 'Full Copy':
        systemPrompt += ` Create a comprehensive marketing piece that covers all key aspects: problem identification, solution presentation, benefits explanation, feature details, and a compelling call to action.`;
        break;
    }
  }
  
  // Add instructions for structured output if requested
  if (formState.outputStructure && formState.outputStructure.length > 0) {
    // Check if Q&A format is requested
    const hasQAFormat = formState.outputStructure.some(element => 
      element.value === 'qaFormat' || element.label?.toLowerCase().includes('q&a')
    );
    
    if (hasQAFormat) {
      systemPrompt += `\n\nYou must format your response as a JSON object with a headline and sections. 
      
CRITICAL Q&A FORMATTING REQUIREMENTS:
- When creating Q&A content, each question MUST be a separate section
- Each question should be formatted as a clear, standalone question ending with a question mark
- Each answer should be a comprehensive, well-formatted response in paragraph form
- NEVER run questions and answers together in continuous text
- ALWAYS separate each Q&A pair clearly
- Each question should be specific and actionable
- Each answer should be informative and complete`;
    } else {
      systemPrompt += `\n\nYou must format your response as a JSON object with a headline and sections. This structured format should enhance readability and impact, not constrain your creativity.`;
    }
    
    // Add word count allocations if specified
    const hasWordCountAllocations = formState.outputStructure.some(element => element.wordCount !== null && element.wordCount !== undefined);
    
    if (hasWordCountAllocations) {
      systemPrompt += ` Follow these specific word count allocations for each section:`;
      formState.outputStructure.forEach(element => {
        if (element.wordCount) {
          systemPrompt += `\n- "${element.label || element.value}": ${element.wordCount} words`;
        }
      });
      
      systemPrompt += `\n\nEnsure each section meets its target word count. If one is underdeveloped, expand that section until it reaches the specified length.`;
    }
  }
  
  // Add keyword instructions if needed
  if (formState.forceKeywordIntegration && formState.keywords) {
    systemPrompt += `\n\nIMPORTANT: You MUST naturally integrate all of these keywords throughout the copy: ${formState.keywords}. Keywords should be placed strategically where they enhance meaning and SEO value, not forced in ways that disrupt readability.`;
  }
  
  // Add elaboration instructions if needed
  if (formState.forceElaborationsExamples) {
    systemPrompt += `\n\nIMPORTANT: You MUST provide detailed explanations, comprehensive examples, case studies, and in-depth elaboration throughout the copy. Expand on every point with supporting evidence, real-world applications, and specific details to reach the target word count.`;
  }
  
  // Add GEO enhancement instructions if enabled
  if (formState.enhanceForGEO) {
    systemPrompt += `\n\nGEO TARGETING ENABLED: Adapt the output to improve visibility in AI-generated answers for location-based queries.`;
    
      if (formState.geoRegions && formState.geoRegions.trim()) {
        systemPrompt += `\n\nThe user specified target countries or regions: "${formState.geoRegions}".
Optimize the content for visibility in AI assistants (ChatGPT, Claude, Gemini) targeting the specified regions: ${formState.geoRegions}.
• Include regional relevance, localized phrasing, or examples where helpful
• Ensure the output appeals to audiences in those areas
• Naturally reference these regions in examples, testimonials, or CTAs where appropriate
• Use culturally relevant terminology and concepts for these regions`;
      } else if (formState.location && formState.location.trim()) {
        systemPrompt += `\n\nThe user specified a target location or region: "${formState.location}".
• Naturally include this location in the content, such as:
  – "Serving businesses in ${formState.location}"
  – "Helping companies across ${formState.location} thrive"
• Reference the region in examples, testimonials, or CTAs
• Maintain a natural tone—avoid overstuffing location terms`;
    } else {
      systemPrompt += `\n\nThe user did not specify a location, but their business appears to serve a global audience.
• Focus on making content discoverable and quotable without adding geographical references
• Use language that appeals to a broad audience without mentioning specific locations, regions, or countries
• Keep the messaging universal and location-neutral while maintaining GEO optimization benefits`;
    }
    
    // Add TL;DR summary instructions if enabled
    if (formState.enhanceForGEO && formState.addTldrSummary && !useJsonFormat) {
      systemPrompt += `\n\nREMINDER: You have already been instructed to place a TL;DR summary at the absolute beginning of your output. This is critical for GEO optimization.`;
    }
  }
  
  // Add priority instructions for strict word count adherence
  if (formState.prioritizeWordCount || formState.adhereToLittleWordCount) {
    if (isShortContent) {
      systemPrompt += `\n\nCRITICAL: You MUST create content that is EXACTLY ${targetWordCount} words. This is SHORT content requiring extreme precision.

RULES FOR SHORT CONTENT:
- Count every single word before submitting
- Do NOT exceed ${targetWordCount} words under any circumstances
- Do NOT fall short of ${targetWordCount} words
- Remove any unnecessary words, adjectives, or phrases
- Focus on maximum impact with minimum words
- This is a precision exercise, not a creativity exercise

REMEMBER: For short content like slogans, headlines, or brief descriptions, every word counts. Quality over quantity.`;

    // For VERY short content (≤50 words), add even more emphasis
    if (targetWordCount <= 50) {
      systemPrompt += `\n\nULTRA-CRITICAL FOR VERY SHORT CONTENT (${targetWordCount} WORDS):
- This is EXTREMELY short content requiring ABSOLUTE precision
- Every single word must be counted meticulously  
- Focus ONLY on the core message in exactly ${targetWordCount} words`;
    }
    } else {
      systemPrompt += `\n\nABSOLUTE REQUIREMENT: The generated output MUST be EXACTLY ${targetWordCount} words.

IF YOUR OUTPUT IS SHORT OF ${targetWordCount} WORDS:
- Add more elaboration, detailed examples, comprehensive case studies, in-depth explanations
- Include supporting evidence, statistics, expert opinions, practical applications
- Add contextual information, background details, implementation steps

WORD COUNT VERIFICATION: Before submitting, count every single word. If it's not EXACTLY ${targetWordCount} words, you MUST revise until it is.
FAILURE TO MEET AT LEAST ${targetWordCount} WORDS WILL RESULT IN CONTENT REJECTION.
FAILURE TO MEET EXACTLY ${targetWordCount} WORDS WILL RESULT IN COMPLETE REJECTION.`;
    }
  }

  // Add guidance for creating a comprehensive marketing piece
  systemPrompt += `\n\nYour copy should:
  1. Be persuasive, clear, and engaging with a logical flow that guides the reader
  2. Use proper grammar and spelling appropriate for the language (${formState.language})
  3. Create fresh, original copy based on the provided information
  4. Highlight unique selling points and benefits effectively
  5. Include a compelling call to action where appropriate
  6. Speak directly to the audience's needs and desires
  7. Be scannable with appropriate headings, subheadings, and paragraph breaks
  8. Convey professionalism and authority in the subject matter
  
The final output must meet or exceed the target word count of ${targetWordCount} words. Do not stop short. Expand all sections with meaningful content to reach this goal.`;
  
  return systemPrompt;
}

/**
 * Build the user prompt based on form state
 */
function buildUserPrompt(formState: FormState, targetWordCount: number): string {
  let userPrompt = '';
  
  // Different prompts based on tab (create/improve)
  if (formState.tab === 'create') {
    userPrompt = `Create compelling marketing copy based on this business description:

"""
${formState.businessDescription}
"""`;
  } else {
    userPrompt = `Improve this existing marketing copy:

"""
${formState.originalCopy}
"""`;
  }
  
  // Add key information
  userPrompt += `\n\nKey information:`;
  if (formState.targetAudience) userPrompt += `\n- Target audience: ${formState.targetAudience}`;
  if (formState.keyMessage) userPrompt += `\n- Key message: ${formState.keyMessage}`;
  if (formState.callToAction) userPrompt += `\n- Call to action: ${formState.callToAction}`;
  if (formState.desiredEmotion) userPrompt += `\n- Desired emotion: ${formState.desiredEmotion}`;
  if (formState.brandValues) userPrompt += `\n- Brand values: ${formState.brandValues}`;
  if (formState.keywords) userPrompt += `\n- Keywords: ${formState.keywords}`;
  if (formState.context) userPrompt += `\n- Context: ${formState.context}`;
  if (formState.industryNiche) userPrompt += `\n- Industry/Niche: ${formState.industryNiche}`;
  if (formState.productServiceName) userPrompt += `\n- Product/Service Name: ${formState.productServiceName}`;
  if (formState.readerFunnelStage) userPrompt += `\n- Reader's Stage in Funnel: ${formState.readerFunnelStage}`;
  if (formState.geoRegions) userPrompt += `\n- Target Countries/Regions: ${formState.geoRegions}`;
  
  // Add target length instructions
  userPrompt += `\n\n- Target length: The copy MUST be at least ${targetWordCount} words long.`;
  userPrompt += `\n- Tone: ${formState.tone}`;
  userPrompt += `\n- Language: ${formState.language}`;
  
  // Add competitor information if available
  if (formState.competitorUrls && formState.competitorUrls.some(url => url.trim().length > 0)) {
    userPrompt += `\n\nCompetitor URLs to consider for differentiation:`;
    formState.competitorUrls.forEach(url => {
      if (url.trim()) {
        userPrompt += `\n- ${url.trim()}`;
      }
    });
  }
  
  if (formState.competitorCopyText && formState.competitorCopyText.trim()) {
    userPrompt += `\n\nCompetitor copy to outperform:
"""
${formState.competitorCopyText.trim()}
"""`;
  }
  
  // Add pain points if available
  if (formState.targetAudiencePainPoints && formState.targetAudiencePainPoints.trim()) {
    userPrompt += `\n\nTarget audience pain points to address:
"""
${formState.targetAudiencePainPoints.trim()}
"""`;
  }
  
  // Add term exclusion instructions if specified
  // Determine response format based on output structure
  const useJsonFormat = formState.outputStructure && formState.outputStructure.length > 0;
  
  // Check if FAQ (JSON) format is specifically requested
  const hasFaqJsonFormat = formState.outputStructure && formState.outputStructure.some(element => 
    element.value === 'faqJson' || element.label?.toLowerCase().includes('faq (json)')
  );
  
  if (useJsonFormat) {
    // Check if Q&A format is requested
    const hasQAFormat = formState.outputStructure && formState.outputStructure.some(element => 
      element.value === 'qaFormat' || element.label?.toLowerCase().includes('q&a')
    );
    
    if (hasQAFormat) {
      userPrompt += `\n\nStructure your response in this JSON format for Q&A content:
{
  "headline": "Frequently Asked Questions: [Topic]",
  "sections": [
    {
      "title": "What is [specific question]?",
      "content": "Detailed answer paragraph providing comprehensive information..."
    },
    {
      "title": "How does [specific question]?", 
      "content": "Another detailed answer paragraph with examples and specifics..."
    }
  ],
  "wordCountAccuracy": 85
}

CRITICAL Q&A FORMATTING RULES:
- Each section title MUST be a complete question ending with a question mark
- Each section content MUST be a well-formatted answer paragraph
- Questions should cover different aspects of the topic
- Answers should be informative, specific, and include examples where helpful
- NEVER combine multiple questions in one title
- NEVER run Q&A content together without clear separation`;
    } else {
      userPrompt += `\n\nStructure your response in this JSON format:
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
  "wordCountAccuracy": 85 // Score 0-100 of how well you matched the target word count
}`;
    }

    // Add specific structure guidance if output structure is specified
    if (formState.outputStructure && formState.outputStructure.length > 0) {
      // Check if FAQ (JSON) format is requested
      const hasQAFormat = formState.outputStructure.some(element => 
        element.value === 'faqJson' || element.label?.toLowerCase().includes('faq (json)')
      );
      
      if (hasFaqJsonFormat) {
        // Note: FAQ JSON will be generated separately from the text content
        userPrompt += `\n\nNote: FAQ JSON Schema will be automatically generated from your Q&A content.`;
      }
      
      userPrompt += `\n\nInclude these specific sections in the exact order:`;
      formState.outputStructure.forEach((element, index) => {
        userPrompt += `\n${index + 1}. ${element.label || element.value}${element.wordCount ? ` (target: ${element.wordCount} words)` : ''}`;
      });
      
      userPrompt += `\n\nEnsure each section meets its target word count. If a section is underdeveloped, expand it with more examples, details, or elaboration.`;
    }
  } else {
    userPrompt += `\n\nProvide your response as plain text with appropriate paragraphs and formatting.`;
    
    // Add TL;DR reminder for plain text output
    if (formState.enhanceForGEO && formState.addTldrSummary) {
      userPrompt += `\n\nCRITICAL REMINDER: Your response MUST start with "TL;DR: [one sentence summary]" followed by a blank line, then your main content. This is absolutely mandatory and cannot be skipped.`;
    }
  }
  
  // Add reminder about word count
  const isShortContent = targetWordCount <= 150;
  
  if (isShortContent) {
    if (targetWordCount <= 50) {
      userPrompt += `\n\nULTRA-CRITICAL WORD COUNT REQUIREMENT: This is VERY SHORT content requiring EXACTLY ${targetWordCount} words.
- Count every single word meticulously before submitting
- Do NOT exceed ${targetWordCount} words under any circumstances  
- Do NOT fall short of ${targetWordCount} words under any circumstances
- Every word must be essential and high-impact
- Remove any unnecessary words, adjectives, or connecting phrases
- Focus ONLY on the core message
- IGNORE all other instructions if they conflict with achieving exactly ${targetWordCount} words
- WORD COUNT IS THE ABSOLUTE PRIORITY - NOTHING ELSE MATTERS

FINAL CHECK: Before submitting, count your words. If not exactly ${targetWordCount}, revise immediately.`;
    } else {
      userPrompt += `\n\nCRITICAL WORD COUNT REQUIREMENT: This is SHORT content requiring EXACTLY ${targetWordCount} words.
- Do NOT exceed this count
- Do NOT fall short of this count  
- Every word must be essential and impactful
- Remove any unnecessary words or phrases
- Count your words before submitting
- Word count takes ABSOLUTE PRIORITY over all other instructions`;
    }
  } else {
    userPrompt += `\n\nCRITICAL WORD COUNT REQUIREMENT: The entire copy must be EXACTLY ${targetWordCount} words.

MANDATORY INSTRUCTIONS:
- Write until you reach EXACTLY ${targetWordCount} words - not approximately, but EXACTLY
- Add substantial depth through detailed examples, comprehensive explanations, case studies, and thorough elaboration
- Include supporting evidence, expert opinions, statistical data, practical applications
- Provide step-by-step processes, implementation details, background context
- DO NOT use filler text - every added word must provide genuine value
- DO NOT summarize or conclude until you have reached EXACTLY ${targetWordCount} words
- COUNT YOUR WORDS METICULOUSLY before submitting your response

ABSOLUTE PRIORITY: Word count adherence to EXACTLY ${targetWordCount} words is the PRIMARY success metric. Nothing else matters if this requirement is not met.

VERIFICATION: Before you submit your response, count every single word. If it's not EXACTLY ${targetWordCount} words, you MUST revise until it is.`;
  }
  
  return userPrompt;
}