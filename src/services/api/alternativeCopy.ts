/**
 * Alternative copy generation functionality
 */
import { FormState } from '../../types';
import { getApiConfig, handleApiResponse, storePrompts, calculateTargetWordCount, extractWordCount } from './utils';
import { generateSeoMetadata } from './seoGeneration';
import { saveCopySession } from '../supabaseClient';
import { reviseContentForWordCount } from './contentRefinement';
import { calculateGeoScore } from './geoScoring';

/**
 * Generate an alternative version of the copy
 * @param formState - The form state with generation settings
 * @param improvedCopy - The primary copy to create an alternative for
 * @param sessionId - Optional session ID for saving to the database
 * @param progressCallback - Optional callback for reporting progress
 * @returns Alternative copy content
 */
export async function generateAlternativeCopy(
  formState: FormState,
  improvedCopy: any,
  currentUser?: User,
  sessionId?: string,
  progressCallback?: (message: string) => void
): Promise<any> {
  // Extract text content from structured content if needed
  const improvedCopyText = typeof improvedCopy === 'string' 
    ? improvedCopy 
    : improvedCopy.headline 
      ? `${improvedCopy.headline}\n\n${improvedCopy.sections.map((s: any) => 
          `${s.title}\n${s.content || (s.listItems || []).join('\n')}`
        ).join('\n\n')}`
      : JSON.stringify(improvedCopy);
  
  // Get API configuration
  const { apiKey, baseUrl, headers, maxTokens } = getApiConfig(formState.model);
  
  // Calculate target word count
  const targetWordCountInfo = calculateTargetWordCount(formState);
  const targetWordCount = targetWordCountInfo.target;
  
  // Progress reporting if callback provided
  if (progressCallback) {
    progressCallback(`Generating alternative version with target of ${targetWordCount} words...`);
  }
  
  // Build the system prompt with TL;DR requirement first if enabled
  let systemPrompt = '';
  
  // Determine if we should return structured format
  const useStructuredFormat = formState.outputStructure && formState.outputStructure.length > 0;
  
  // Add CRITICAL TL;DR formatting requirement at the very beginning if enabled and NOT using structured format
  if (formState.enhanceForGEO && formState.addTldrSummary && !useStructuredFormat) {
    systemPrompt = `ABSOLUTE MANDATORY REQUIREMENT - TL;DR SUMMARY:

Your response MUST begin with "TL;DR:" followed by exactly one concise sentence that directly answers the main question.

EXACT FORMAT REQUIRED:
TL;DR: [One clear sentence that directly answers what the user wants to know.]

[blank line]

[Rest of your alternative marketing copy content...]

CRITICAL TL;DR RULES:
- Must be the first 3 characters: "TL;" 
- Only ONE sentence in the TL;DR
- Answer the core question directly
- Use natural ${formState.language} language
- No hype words or marketing fluff
- Follow with blank line, then main content

FAILURE TO START WITH "TL;DR:" = COMPLETE REJECTION

---

You are an expert copywriter who excels at creating alternative versions of marketing content.`;
  } else {
    systemPrompt = `You are an expert copywriter who excels at creating alternative versions of marketing content.`;
  }
  
  systemPrompt += `
  Your task is to create a compelling alternative version of the marketing copy provided, with a different approach or angle.
  The alternative version should maintain the key message and purpose, but present it in a fresh way.
  Maintain the ${formState.tone} tone and stay within the approximate target of ${targetWordCount} words.
  
  CRITICAL: Do NOT include any SEO metadata in your content output:
  - Do NOT include URL slugs, meta descriptions, or Open Graph tags
  - Do NOT include H1, H2, or H3 headings as metadata elements
  - Focus ONLY on creating compelling alternative marketing copy content
  - SEO metadata is handled separately and should NOT be part of your content
  
  IMPORTANT: The copy must be ${targetWordCount} words or longer. Do not conclude early.
  If you need more content to reach the word count, add depth through examples, explanations, and elaboration.`;
  
  // Build the user prompt
  let userPrompt = `Generate an alternative version of this marketing copy with a different approach or angle.

Original copy:
"""
${improvedCopyText}
"""

Key information to maintain:
- Target audience: ${formState.targetAudience || 'Not specified'}
- Key message: ${formState.keyMessage || 'Not specified'}
- Call to action: ${formState.callToAction || 'Not specified'}
- Tone: ${formState.tone}
- Language: ${formState.language}
- Target word count: ${targetWordCount} words
${formState.geoRegions ? `- Target Countries/Regions: ${formState.geoRegions}` : ''}

${formState.keywords ? `Keywords to include: ${formState.keywords}` : ''}
${formState.brandValues ? `Brand values: ${formState.brandValues}` : ''}
${formState.desiredEmotion ? `Desired emotion: ${formState.desiredEmotion}` : ''}`;

  if (formState.location) userPrompt += `\n- Target Location/Region: ${formState.location}`;

  // Add section-specific guidelines based on formState.section
  if (formState.section) {
    userPrompt += `\n\nThis is for the "${formState.section}" section.`;
  }
  
  // Add term exclusion instructions if specified
  if (formState.excludedTerms && formState.excludedTerms.trim()) {
    userPrompt += `\n\nTERMS TO EXCLUDE: Do not mention or reference any of these terms in your response: ${formState.excludedTerms}
Use alternative terminology or avoid these topics entirely.`;
  }
  
  // Determine if we should return structured format
  
  if (useStructuredFormat) {
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
  "wordCountAccuracy": 85 // Score 0-100 of how well you matched the target word count
}`;
    }

    if (!hasQAFormat) {
      userPrompt += `\n\nMake sure to include a headline and appropriate sections with either paragraph content or list items.`;
    }
    
    // Add specific structure guidance if output structure is specified
    if (formState.outputStructure && formState.outputStructure.length > 0) {
      // Check if FAQ (JSON) format is requested
      const hasFaqJsonFormat = formState.outputStructure.some(element => 
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

MANDATORY JSON REQUIREMENTS:
- Your response MUST be ONLY this JSON object - no additional text or explanations
- Each question must be specific and relevant to the business/content
- Each answer must be comprehensive and informative (minimum 50 words per answer)
- Questions should cover different aspects: what, how, why, when, where, benefits, process, etc.
- Generate 5-8 question-answer pairs total
- All text must be properly escaped for JSON format
- Do NOT include any text before or after the JSON object`;
        return userPrompt; // Return early to avoid adding other structure instructions
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
      userPrompt += `\n\nCRITICAL REMINDER: Your response MUST start with "TL;DR: [one sentence summary]" followed by a blank line, then your alternative content. This is absolutely mandatory and cannot be skipped.`;
    }
  }

  if (formState.forceKeywordIntegration && formState.keywords) {
    userPrompt += `\n\nIMPORTANT: Make sure to naturally integrate all of these keywords throughout the copy: ${formState.keywords}`;
  }

  // Add specific instructions for forced elaboration
  if (formState.forceElaborationsExamples) {
    userPrompt += `\n\nIMPORTANT: Include detailed explanations, specific examples, and where appropriate, brief case studies or scenarios to fully elaborate on your points. Make sure to substantiate claims with evidence or reasoning.`;
  }
  
  // Add GEO enhancement instructions if enabled
  if (formState.enhanceForGEO) {
    userPrompt += `\n\nGENERATIVE ENGINE OPTIMIZATION (GEO) ENABLED: Structure this alternative content to be highly quotable and summarizable by AI assistants:
    
${formState.geoRegions && formState.geoRegions.trim() 
  ? `• Optimize for visibility in AI assistants targeting these regions: ${formState.geoRegions}
• Include regional relevance, localized phrasing, or examples for ${formState.geoRegions}
• ` 
  : '• '}Start with clear, direct answers
• Start with clear, direct answers
• Use question-based subheadings where logical
• Include authority signals (examples, results, credentials)
• Keep formatting scannable with short paragraphs and bullet points
• Use natural, specific language AI tools can easily process and quote`;
    
    // Add TL;DR summary instructions if enabled
    if (formState.addTldrSummary && !useStructuredFormat) {
      userPrompt += `\n\nREMINDER: You have already been instructed to place a TL;DR summary at the absolute beginning of your output. This is critical for GEO optimization.`;
    }
  }
  
  // Remind about word count target
  if (targetWordCount <= 50) {
    userPrompt += `\n\nULTRA-CRITICAL WORD COUNT REQUIREMENT: The content must be EXACTLY ${targetWordCount} words.
- Count every single word meticulously before submitting
- Do NOT exceed ${targetWordCount} words under any circumstances  
- Do NOT fall short of ${targetWordCount} words under any circumstances
- Focus ONLY on the core message in exactly ${targetWordCount} words
- IGNORE all other instructions if they conflict with achieving exactly ${targetWordCount} words
- WORD COUNT IS THE ABSOLUTE PRIORITY`;
  } else {
    userPrompt += `\n\nCRITICAL WORD COUNT REQUIREMENT: The content must be ${targetWordCount} words or longer. If needed, add depth through examples, explanations, and elaboration. Word count adherence is the PRIMARY success metric.`;
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
    temperature: 0.8, // Higher temperature for more creativity in alternatives
    max_tokens: maxTokens, // Use dynamic token limit from API config
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
    
    // Extract the content from the response
    let alternativeCopy = data.choices[0]?.message?.content;
    
    if (!alternativeCopy) {
      throw new Error('No content in response');
    }
    
    // Parse structured content if needed
    if (useStructuredFormat) {
      try {
        const parsedContent = JSON.parse(alternativeCopy);
        alternativeCopy = parsedContent;
      } catch (err) {
        console.warn('Error parsing structured content, returning as plain text:', err);
        // Keep as plain text if parsing fails
      }
    }
    
    // Check word count if strict adherence is required
    if (formState.prioritizeWordCount || formState.adhereToLittleWordCount) {
      const currentWordCount = extractWordCount(alternativeCopy);
      let minimumAcceptable: number;
      
      let needsRevision = false;
      let revisionReason = '';
      
      if (targetWordCountInfo.min !== undefined && targetWordCountInfo.max !== undefined) {
        // Little word count mode - check if within range
        if (currentWordCount < targetWordCountInfo.min) {
          needsRevision = true;
          revisionReason = `below range (${currentWordCount} < ${targetWordCountInfo.min})`;
        } else if (currentWordCount > targetWordCountInfo.max) {
          needsRevision = true;
          revisionReason = `above range (${currentWordCount} > ${targetWordCountInfo.max})`;
        }
      } else {
        // Regular strict mode
        minimumAcceptable = Math.floor(targetWordCount * 0.98); // Allow only 2% leeway
        if (currentWordCount < minimumAcceptable) {
          needsRevision = true;
          revisionReason = `too short (${currentWordCount}/${targetWordCount} words)`;
        }
      }
      
      // If the content needs revision, try to revise it
      if (needsRevision) {
        if (progressCallback) {
          progressCallback(`Generated alternative content ${revisionReason}. Revising...`);
        }
        
        console.warn(`Generated alternative content ${revisionReason}`);
        console.log("Attempting to revise alternative content to meet target word count...");
        
        try {
          // Use the content refinement service to expand the content
          const revisedContent = await reviseContentForWordCount(
            alternativeCopy,
            targetWordCountInfo,
            formState,
            progressCallback
          );
          
          // Update with the revised content
          alternativeCopy = revisedContent;
          
          // Log the updated word count
          const revisedWordCount = extractWordCount(revisedContent);
          console.log(`Revised alternative content word count: ${revisedWordCount} words`);
          
          // For little word count mode, we accept any result within range
          if (targetWordCountInfo.min !== undefined && targetWordCountInfo.max !== undefined) {
            // No second revision needed for flexible mode
          } else if (revisedWordCount < minimumAcceptable && formState.prioritizeWordCount) {
            // For strict mode, try second revision if still too short
            if (progressCallback) {
              progressCallback(`Alternative content still below target after revision. Making second attempt...`);
            }
            
            try {
              // Make a more aggressive second attempt
              const secondRevision = await reviseContentForWordCount(
                revisedContent,
                { target: targetWordCount }, // Use simple format for second revision
                {...formState, forceElaborationsExamples: true}, // Force elaborations for second attempt
                currentUser,
                progressCallback,
                undefined, // persona
                formState.sessionId
              );
              
              alternativeCopy = secondRevision;
              const finalWordCount = extractWordCount(secondRevision);
              
              if (progressCallback) {
                progressCallback(`Final alternative content word count: ${finalWordCount} words`);
              }
            } catch (secondRevisionError) {
              console.error('Error in second revision of alternative content:', secondRevisionError);
              // Keep first revision if second fails
            }
          }
          
        } catch (revisionError) {
          console.error('Error revising alternative content for word count:', revisionError);
          if (progressCallback) {
            progressCallback(`Error revising alternative content: ${revisionError.message}`);
          }
          // Continue with original content if revision fails
        }
      } else if (progressCallback) {
        if (targetWordCountInfo.min !== undefined && targetWordCountInfo.max !== undefined) {
          progressCallback(`✓ Alternative content generated with ${currentWordCount} words (range: ${targetWordCountInfo.min}-${targetWordCountInfo.max})`);
        } else {
          progressCallback(`✓ Alternative content generated with ${currentWordCount} words`);
        }
      }
    } else if (progressCallback) {
      const wordCount = extractWordCount(alternativeCopy);
      progressCallback(`✓ Alternative content generated with ${wordCount} words`);
    }
    
    // Generate SEO metadata if enabled (for alternative copy)
    let alternativeSeoMetadata;
    if (formState.generateSeoMetadata) {
      if (progressCallback) {
        progressCallback('Generating SEO metadata for alternative copy...');
      }
      
      try {
        alternativeSeoMetadata = await generateSeoMetadata(alternativeCopy, formState, progressCallback);
      } catch (seoError) {
        console.error('Error generating SEO metadata for alternative:', seoError);
        if (progressCallback) {
          progressCallback('Error generating SEO metadata for alternative, continuing...');
        }
      }
    }
    
    // Generate GEO score if enabled (for alternative copy)
    let alternativeGeoScore;
    if (formState.generateGeoScore) {
      if (progressCallback) {
        progressCallback('Calculating GEO score for alternative copy...');
      }
      
      try {
        alternativeGeoScore = await calculateGeoScore(alternativeCopy, formState, currentUser, progressCallback);
      } catch (geoError) {
        console.error('Error calculating GEO score for alternative:', geoError);
        if (progressCallback) {
          progressCallback('Error calculating GEO score for alternative, continuing...');
        }
      }
    }
    
    // Generate FAQ Schema if faqJson is selected in output structure
    let alternativeFaqSchema;
    if (formState.outputStructure && formState.outputStructure.some(element => 
      element.value === 'faqJson' || element.label?.toLowerCase().includes('faq (json)')
    )) {
      if (progressCallback) {
        progressCallback('Generating FAQ Schema from alternative content...');
      }
      
      try {
        const { generateFaqSchemaFromText } = await import('./seoGeneration');
        alternativeFaqSchema = await generateFaqSchemaFromText(
          typeof alternativeCopy === 'string' ? alternativeCopy : JSON.stringify(alternativeCopy),
          formState,
          currentUser,
          progressCallback
        );
      } catch (faqError) {
        console.error('Error generating FAQ schema for alternative:', faqError);
        if (progressCallback) {
          progressCallback('Error generating FAQ schema for alternative, continuing...');
        }
      }
    }
    
    // Save to database if session ID is provided
    if (sessionId) {
      try {
        await saveCopySession(formState, improvedCopy, alternativeCopy, sessionId);
      } catch (err) {
        console.error('Error saving copy session:', err);
        // Continue even if save fails
      }
    }
    
    // Return alternative copy with SEO metadata if generated
    if (alternativeSeoMetadata || alternativeGeoScore || alternativeFaqSchema) {
      return {
        content: alternativeCopy,
        seoMetadata: alternativeSeoMetadata,
        geoScore: alternativeGeoScore,
        faqSchema: alternativeFaqSchema
      };
    }
    
    return alternativeCopy;
  } catch (error) {
    console.error('Error generating alternative copy:', error);
    if (progressCallback) {
      progressCallback(`Error generating alternative copy: ${error.message}`);
    }
    throw error;
  }
}