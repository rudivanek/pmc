import { CopyResult, PromptEvaluation, StructuredCopyOutput, FormState, ContentQualityScore, ScoreData } from '../types';
import { GeoScoreData } from '../types';
import { GeneratedContentItem, GeneratedContentItemType } from '../types';

/**
 * Converts basic Markdown formatting to HTML
 */
const markdownToHtml = (markdownText: string): string => {
  if (!markdownText) return '';
  
  let html = markdownText;
  
  // Convert horizontal rules first (---)
  html = html.replace(/^---+$/gm, '<hr>');
  
  // Convert tables
  const tableRegex = /^\|(.+)\|\s*\n\|[-:\s|]+\|\s*\n((?:\|.+\|\s*\n?)*)/gm;
  html = html.replace(tableRegex, (match, headerRow, bodyRows) => {
    // Process header row
    const headers = headerRow.split('|').filter(cell => cell.trim()).map(cell => cell.trim());
    
    // Process body rows
    const rows = bodyRows.trim().split('\n').filter(row => row.trim());
    
    let tableHtml = '<table border="1" style="border-collapse: collapse; width: 100%;">\n';
    
    // Add header
    if (headers.length > 0) {
      tableHtml += '  <thead>\n    <tr>\n';
      headers.forEach(header => {
        tableHtml += `      <th style="border: 1px solid #ddd; padding: 8px; background-color: #f2f2f2;">${header}</th>\n`;
      });
      tableHtml += '    </tr>\n  </thead>\n';
    }
    
    // Add body
    if (rows.length > 0) {
      tableHtml += '  <tbody>\n';
      rows.forEach(row => {
        const cells = row.split('|').filter(cell => cell.trim()).map(cell => cell.trim());
        if (cells.length > 0) {
          tableHtml += '    <tr>\n';
          cells.forEach(cell => {
            tableHtml += `      <td style="border: 1px solid #ddd; padding: 8px;">${cell}</td>\n`;
          });
          tableHtml += '    </tr>\n';
        }
      });
      tableHtml += '  </tbody>\n';
    }
    
    tableHtml += '</table>';
    return tableHtml;
  });
  
  // Convert headers (### H3, ## H2, # H1)
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
  
  // Convert bold (**text**)
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Convert italics (*text*)
  html = html.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');
  
  // Convert links [text](url)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  
  // Convert code blocks (`code`)
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  
  // Process content line by line for better list and structure handling
  const lines = html.split('\n');
  const processedLines: string[] = [];
  let inUnorderedList = false;
  let inOrderedList = false;
  let listIndentLevel = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();
    
    // Check for unordered list items (- or *)
    const unorderedListMatch = line.match(/^(\s*)([-*])\s+(.+)$/);
    // Check for ordered list items (1., 2., etc.)
    const orderedListMatch = line.match(/^(\s*)\d+\.\s+(.+)$/);
    
    if (unorderedListMatch) {
      const [, indent, marker, content] = unorderedListMatch;
      const currentIndent = indent.length;
      
      // Close ordered list if we were in one
      if (inOrderedList) {
        processedLines.push('</ol>');
        inOrderedList = false;
      }
      
      if (!inUnorderedList) {
        processedLines.push('<ul>');
        inUnorderedList = true;
        listIndentLevel = currentIndent;
      }
      processedLines.push(`  <li>${content}</li>`);
    } else if (orderedListMatch) {
      const [, indent, content] = orderedListMatch;
      const currentIndent = indent.length;
      
      // Close unordered list if we were in one
      if (inUnorderedList) {
        processedLines.push('</ul>');
        inUnorderedList = false;
      }
      
      if (!inOrderedList) {
        processedLines.push('<ol>');
        inOrderedList = true;
        listIndentLevel = currentIndent;
      }
      processedLines.push(`  <li>${content}</li>`);
    } else {
      // Not a list item - close any open lists
      if (inUnorderedList) {
        processedLines.push('</ul>');
        inUnorderedList = false;
      }
      if (inOrderedList) {
        processedLines.push('</ol>');
        inOrderedList = false;
      }
      processedLines.push(line);
    }
  }
  
  // Close any remaining lists
  if (inUnorderedList) {
    processedLines.push('</ul>');
  }
  if (inOrderedList) {
    processedLines.push('</ol>');
  }
  
  html = processedLines.join('\n');
  
  // Convert paragraphs (double line breaks to paragraph separation)
  const paragraphs = html.split('\n\n').filter(p => p.trim());
  const htmlParagraphs = paragraphs.map(paragraph => {
    const trimmed = paragraph.trim();
    
    // Don't wrap if it's already an HTML block element
    if (trimmed.startsWith('<h') || 
        trimmed.startsWith('<ul') || 
        trimmed.startsWith('<ol') || 
        trimmed.startsWith('<table') || 
        trimmed.startsWith('<div') || 
        trimmed.startsWith('<hr') ||
        trimmed.includes('</ul>') ||
        trimmed.includes('</ol>') ||
        trimmed.includes('</table>') ||
        trimmed.includes('</h1>') ||
        trimmed.includes('</h2>') ||
        trimmed.includes('</h3>')) {
      return trimmed;
    }
    
    // Handle multi-line content within a paragraph
    const paragraphContent = trimmed.replace(/\n/g, '<br>');
    return `<p>${paragraphContent}</p>`;
  });
  
  return htmlParagraphs.join('\n\n');
};

/**
 * Converts structured content to plain text
 */
export const structuredToPlainText = (content: string | StructuredCopyOutput): string => {
  if (typeof content === 'string') return content;
  
  // Handle arrays (like headlines)
  if (Array.isArray(content)) {
    return content.map((item, index) => `${index + 1}. ${item}`).join('\n');
  }
  
  if (!content) {
    return "No content available";
  }
  
  // Handle proper structured content
  if (content.headline && Array.isArray(content.sections)) {
    let result = content.headline + '\n\n';
    
    content.sections.forEach(section => {
      if (section && section.title) {
        result += section.title + '\n';
        
        if (section.content) {
          result += section.content + '\n\n';
        } else if (section.listItems && section.listItems.length > 0) {
          section.listItems.forEach(item => {
            result += '• ' + item + '\n';
          });
          result += '\n';
        }
      }
    });
    
    return result.trim();
  }
  
  // Handle other object formats by checking common text-containing properties
  if (typeof content === 'object') {
    if (content.text && typeof content.text === 'string') {
      return content.text;
    } else if (content.content && typeof content.content === 'string') {
      return content.content;
    } else if (content.output && typeof content.output === 'string') {
      return content.output;
    } else if (content.message && typeof content.message === 'string') {
      return content.message;
    } else {
      // Fall back to JSON stringification for unknown object formats
      try {
        return JSON.stringify(content, null, 2);
      } catch (e) {
        return "Unable to display content";
      }
    }
  }
  
  // If all else fails, convert to string
  return String(content);
};

/**
 * Formats a quality score as markdown
 */
export const formatQualityScoreAsMarkdown = (score: ContentQualityScore, title: string): string => {
  let markdown = `### ${title}\n\n`;
  markdown += `**Score:** ${score.score}/100\n\n`;
  
  if (score.tips && score.tips.length > 0) {
    markdown += `**Improvement Tips:**\n\n`;
    score.tips.forEach(tip => {
      markdown += `- ${tip}\n`;
    });
    markdown += `\n`;
  }
  
  return markdown;
};

/**
 * Format score data as markdown
 */
export const formatScoreDataAsMarkdown = (score: ScoreData, title: string): string => {
  let markdown = `### ${title}\n\n`;
  markdown += `**Overall:** ${score.overall}/100\n`;
  markdown += `**Clarity:** ${score.clarity}\n`;
  markdown += `**Persuasiveness:** ${score.persuasiveness}\n`;
  markdown += `**Tone Match:** ${score.toneMatch}\n`;
  markdown += `**Engagement:** ${score.engagement}\n`;
  
  if (score.improvementExplanation) {
    markdown += `\n**Why it's improved:** ${score.improvementExplanation}\n\n`;
  }
  
  return markdown;
};

/**
 * Format GEO score data as markdown
 */
export const formatGeoScoreAsMarkdown = (geoScore: GeoScoreData, title: string): string => {
  let markdown = `### ${title}\n\n`;
  markdown += `**Overall GEO Score:** ${geoScore.overall}/100\n\n`;
  
  if (geoScore.breakdown && geoScore.breakdown.length > 0) {
    markdown += `**GEO Score Breakdown:**\n\n`;
    geoScore.breakdown.forEach(item => {
      const status = item.detected ? '✓' : '✗';
      markdown += `- **${item.criterion}** ${status} ${item.score} points: ${item.explanation}\n`;
    });
    markdown += `\n`;
  }
  
  if (geoScore.suggestions && geoScore.suggestions.length > 0 && geoScore.overall < 80) {
    markdown += `**GEO Optimization Suggestions:**\n\n`;
    geoScore.suggestions.forEach(suggestion => {
      markdown += `- ${suggestion}\n`;
    });
    markdown += `\n`;
  }
  
  return markdown;
};

/**
 * Formats generated content items as Markdown (new version)
 */
export const formatCopyResultAsMarkdown = (
  formState: FormState,
  generatedOutputCards: GeneratedContentItem[],
  originalInputScore?: any,
  promptEvaluation?: PromptEvaluation,
  includeInputs: boolean = true
): string => {
  let markdown = `# Generated Copy\n\n`;
  
  // Add input content section if includeInputs is true
  if (includeInputs) {
    markdown += `## Input Content\n\n`;
    
    if (formState.tab === 'create') {
      markdown += `### Business Description\n\n`;
      markdown += `${formState.businessDescription || 'No business description provided'}\n\n`;
      
      // Add business description score if available
      if (formState.businessDescriptionScore) {
        markdown += formatQualityScoreAsMarkdown(formState.businessDescriptionScore, 'Business Description Score');
      }
    } else {
      markdown += `### Original Copy\n\n`;
      markdown += `${formState.originalCopy || 'No original copy provided'}\n\n`;
      
      // Add original copy score if available
      if (formState.originalCopyScore) {
        markdown += formatQualityScoreAsMarkdown(formState.originalCopyScore, 'Original Copy Score');
      }
    }
    
    // Add original input score if available
    if (originalInputScore) {
      markdown += `### Original Input Quality Score\n\n`;
      markdown += `**Overall:** ${originalInputScore.overall}/100\n`;
      markdown += `**Clarity:** ${originalInputScore.clarity}\n`;
      markdown += `**Persuasiveness:** ${originalInputScore.persuasiveness}\n`;
      markdown += `**Tone Match:** ${originalInputScore.toneMatch}\n`;
      markdown += `**Engagement:** ${originalInputScore.engagement}\n`;
      
      if (originalInputScore.improvementExplanation) {
        markdown += `\n**Assessment:** ${originalInputScore.improvementExplanation}\n`;
      }
      
      markdown += `\n`;
    }
    
    // Add key information from form state
    markdown += `### Key Information\n\n`;
    markdown += `- **Language:** ${formState.language}\n`;
    markdown += `- **Tone:** ${formState.tone}\n`;
    markdown += `- **Word Count:** ${formState.wordCount}${formState.wordCount === 'Custom' ? ` (${formState.customWordCount})` : ''}\n`;
    
    if (formState.targetAudience) {
      markdown += `- **Target Audience:** ${formState.targetAudience}\n`;
    }
    
    if (formState.keyMessage) {
      markdown += `- **Key Message:** ${formState.keyMessage}\n`;
    }
    
    if (formState.callToAction) {
      markdown += `- **Call to Action:** ${formState.callToAction}\n`;
    }
    
    if (formState.desiredEmotion) {
      markdown += `- **Desired Emotion:** ${formState.desiredEmotion}\n`;
    }
    
    if (formState.brandValues) {
      markdown += `- **Brand Values:** ${formState.brandValues}\n`;
    }
    
    if (formState.keywords) {
      markdown += `- **Keywords:** ${formState.keywords}\n`;
    }
    
    markdown += `\n`;
  }
  
  // Add prompt evaluation if available
  if (promptEvaluation) {
    markdown += `## Prompt Evaluation\n\n`;
    markdown += `**Score:** ${promptEvaluation.score}/100\n\n`;
    
    if (promptEvaluation.tips && promptEvaluation.tips.length > 0) {
      markdown += `**Improvement Tips:**\n\n`;
      promptEvaluation.tips.forEach(tip => {
        markdown += `- ${tip}\n`;
      });
      markdown += `\n`;
    }
  }
  
  // Add SEO metadata if available
  // Separate dedicated SEO metadata cards from content cards
  const dedicatedSeoCards: GeneratedContentItem[] = [];
  const contentCards: GeneratedContentItem[] = [];

  generatedOutputCards.forEach(item => {
    if (item.type === GeneratedContentItemType.SeoMetadata) {
      dedicatedSeoCards.push(item);
    } else {
      contentCards.push(item);
    }
  });

  // Helper function to format SEO metadata
  const formatSeoMetadataBlock = (seoMetadata: SeoMetadata, headingLevel: string = '###'): string => {
    let seoMarkdown = '';
    if (seoMetadata.urlSlugs && seoMetadata.urlSlugs.length > 0) {
      seoMarkdown += `${headingLevel} URL Slugs\n\n`;
      seoMetadata.urlSlugs.forEach((slug, index) => {
        seoMarkdown += `${index + 1}. \`${slug}\` (${slug.length}/60 chars)\n`;
      });
      seoMarkdown += `\n`;
    }
    
    if (seoMetadata.metaDescriptions && seoMetadata.metaDescriptions.length > 0) {
      seoMarkdown += `${headingLevel} Meta Descriptions\n\n`;
      seoMetadata.metaDescriptions.forEach((desc, index) => {
        seoMarkdown += `${index + 1}. ${desc} (${desc.length}/160 chars)\n`;
      });
      seoMarkdown += `\n`;
    }
    
    if (seoMetadata.h1Variants && seoMetadata.h1Variants.length > 0) {
      seoMarkdown += `${headingLevel} H1 (Page Titles)\n\n`;
      seoMetadata.h1Variants.forEach((h1, index) => {
        seoMarkdown += `${index + 1}. ${h1} (${h1.length}/60 chars)\n`;
      });
      seoMarkdown += `\n`;
    }
    
    if (seoMetadata.h2Headings && seoMetadata.h2Headings.length > 0) {
      seoMarkdown += `${headingLevel} H2 Headings\n\n`;
      seoMetadata.h2Headings.forEach((h2, index) => {
        seoMarkdown += `${index + 1}. ${h2} (${h2.length}/70 chars)\n`;
      });
      seoMarkdown += `\n`;
    }
    
    if (seoMetadata.h3Headings && seoMetadata.h3Headings.length > 0) {
      seoMarkdown += `${headingLevel} H3 Headings\n\n`;
      seoMetadata.h3Headings.forEach((h3, index) => {
        seoMarkdown += `${index + 1}. ${h3} (${h3.length}/70 chars)\n`;
      });
      seoMarkdown += `\n`;
    }
    
    if (seoMetadata.ogTitles && seoMetadata.ogTitles.length > 0) {
      seoMarkdown += `${headingLevel} Open Graph Titles\n\n`;
      seoMetadata.ogTitles.forEach((ogTitle, index) => {
        seoMarkdown += `${index + 1}. ${ogTitle} (${ogTitle.length}/60 chars)\n`;
      });
      seoMarkdown += `\n`;
    }
    
    if (seoMetadata.ogDescriptions && seoMetadata.ogDescriptions.length > 0) {
      seoMarkdown += `${headingLevel} Open Graph Descriptions\n\n`;
      seoMetadata.ogDescriptions.forEach((ogDesc, index) => {
        seoMarkdown += `${index + 1}. ${ogDesc} (${ogDesc.length}/110 chars)\n`;
      });
      seoMarkdown += `\n`;
    }
    return seoMarkdown;
  };

  // Process dedicated SEO metadata cards first
  dedicatedSeoCards.forEach(item => {
    if (item.seoMetadata) { // This will always be true for dedicated SeoMetadata cards
      markdown += `## SEO Metadata for ${item.sourceDisplayName || item.type}\n\n`;
      markdown += formatSeoMetadataBlock(item.seoMetadata, '###');
    }
  });
  
  // Process all generated content items
  contentCards.forEach(item => {
    // Create section title based on item type and metadata
    let sectionTitle = item.sourceDisplayName || item.type;
    
    if (item.persona) {
      sectionTitle += ` (${item.persona}'s Voice)`;
    }
    
    markdown += `## ${sectionTitle}\n\n`;
    
    // Handle different content types
    let actualContentToProcess: any = item.content;
    let nestedSeoMetadata: SeoMetadata | undefined;

    // Check if content is a nested object containing both content and seoMetadata
    if (typeof item.content === 'object' && item.content !== null && 'content' in item.content && 'seoMetadata' in item.content) {
      actualContentToProcess = (item.content as any).content;
      nestedSeoMetadata = (item.content as any).seoMetadata;
    }

    if (Array.isArray(actualContentToProcess)) {
      // Handle headlines array
      actualContentToProcess.forEach((headline, index) => {
        markdown += `${index + 1}. ${headline}\n`;
      });
      markdown += `\n`;
    } else {
      // Handle string or structured content
      markdown += `${structuredToPlainText(actualContentToProcess)}\n\n`;
    }
    
   // Add modification instruction if available
   if (item.modificationInstruction) {
     markdown += `**Modification Applied:** ${item.modificationInstruction}\n\n`;
   }
   
    // Add score if available
    if (item.score) {
      markdown += formatScoreDataAsMarkdown(item.score, `${sectionTitle} Score`);
    }

    // Add GEO score if available
    if (item.geoScore) {
      markdown += formatGeoScoreAsMarkdown(item.geoScore, `${sectionTitle} GEO Score`);
    }

    // Add FAQ Schema if available
    if (item.faqSchema && Object.keys(item.faqSchema).length > 0) {
      markdown += `### ${sectionTitle} FAQ Schema (JSON-LD)\n\n`;
      markdown += '```json\n';
      markdown += JSON.stringify(item.faqSchema, null, 2);
      markdown += '\n```\n\n';
    }

    // Add nested SEO metadata if available
    if (nestedSeoMetadata) {
      markdown += `### SEO Metadata for ${sectionTitle}\n\n`; // Use a sub-heading for nested SEO
      markdown += formatSeoMetadataBlock(nestedSeoMetadata, '####'); // Use H4 for nested SEO elements
    }
  });
  
  return markdown;
};

/**
 * Formats copy result as HTML for rich text copying
 */
export const formatCopyResultAsHTML = (
  formState: FormState,
  copyResult: CopyResult,
  promptEvaluation?: PromptEvaluation,
  selectedPersona?: string
): string => {
  let html = `<h1>Generated Copy</h1>`;
  
  // Add input content section
  html += `<h2>Input Content</h2>`;
  
  if (formState.tab === 'create') {
    html += `<h3>Business Description</h3>`;
    html += `<div style="white-space: pre-wrap;">${formState.businessDescription || 'No business description provided'}</div>`;
    
    // Add business description score if available
    if (formState.businessDescriptionScore) {
      html += `<h4>Business Description Score</h4>`;
      html += `<p><strong>Score:</strong> ${formState.businessDescriptionScore.score}/100</p>`;
      
      if (formState.businessDescriptionScore.tips && formState.businessDescriptionScore.tips.length > 0) {
        html += `<p><strong>Improvement Tips:</strong></p>`;
        html += `<ul>`;
        formState.businessDescriptionScore.tips.forEach(tip => {
          html += `<li>${tip}</li>`;
        });
        html += `</ul>`;
      }
    }
  } else {
    html += `<h3>Original Copy</h3>`;
    html += `<div style="white-space: pre-wrap;">${formState.originalCopy || 'No original copy provided'}</div>`;
    
    // Add original copy score if available
    if (formState.originalCopyScore) {
      html += `<h4>Original Copy Score</h4>`;
      html += `<p><strong>Score:</strong> ${formState.originalCopyScore.score}/100</p>`;
      
      if (formState.originalCopyScore.tips && formState.originalCopyScore.tips.length > 0) {
        html += `<p><strong>Improvement Tips:</strong></p>`;
        html += `<ul>`;
        formState.originalCopyScore.tips.forEach(tip => {
          html += `<li>${tip}</li>`;
        });
        html += `</ul>`;
      }
    }
  }
  
  // Add key information from form state
  html += `<h3>Key Information</h3>`;
  html += `<ul>`;
  html += `<li><strong>Language:</strong> ${formState.language}</li>`;
  html += `<li><strong>Tone:</strong> ${formState.tone}</li>`;
  html += `<li><strong>Word Count:</strong> ${formState.wordCount}${formState.wordCount === 'Custom' ? ` (${formState.customWordCount})` : ''}</li>`;
  
  if (formState.targetAudience) {
    html += `<li><strong>Target Audience:</strong> ${formState.targetAudience}</li>`;
  }
  
  if (formState.keyMessage) {
    html += `<li><strong>Key Message:</strong> ${formState.keyMessage}</li>`;
  }
  
  if (formState.callToAction) {
    html += `<li><strong>Call to Action:</strong> ${formState.callToAction}</li>`;
  }
  
  if (formState.desiredEmotion) {
    html += `<li><strong>Desired Emotion:</strong> ${formState.desiredEmotion}</li>`;
  }
  
  if (formState.brandValues) {
    html += `<li><strong>Brand Values:</strong> ${formState.brandValues}</li>`;
  }
  
  if (formState.keywords) {
    html += `<li><strong>Keywords:</strong> ${formState.keywords}</li>`;
  }
  html += `</ul>`;
  
  // Add prompt evaluation if available
  if (promptEvaluation) {
    html += `<h2>Prompt Evaluation</h2>`;
    html += `<p><strong>Score:</strong> ${promptEvaluation.score}/100</p>`;
    
    if (promptEvaluation.tips && promptEvaluation.tips.length > 0) {
      html += `<p><strong>Improvement Tips:</strong></p>`;
      html += `<ul>`;
      promptEvaluation.tips.forEach(tip => {
        html += `<li>${tip}</li>`;
      });
      html += `</ul>`;
    }
  }
  
  // Helper function to format a score data object as HTML
  const formatScoreDataAsHTML = (score: ScoreData, title: string): string => {
    let scoreHtml = `<h3>${title}</h3>`;
    scoreHtml += `<p><strong>Overall:</strong> ${score.overall}/100</p>`;
    scoreHtml += `<p><strong>Clarity:</strong> ${score.clarity}</p>`;
    scoreHtml += `<p><strong>Persuasiveness:</strong> ${score.persuasiveness}</p>`;
    scoreHtml += `<p><strong>Tone Match:</strong> ${score.toneMatch}</p>`;
    scoreHtml += `<p><strong>Engagement:</strong> ${score.engagement}</p>`;
    
    if (score.improvementExplanation) {
      scoreHtml += `<p><strong>Why it's improved:</strong> ${score.improvementExplanation}</p>`;
    }
    
    return scoreHtml;
  };
  
  // Add improved copy
  if (copyResult.improvedCopy) {
    html += `<h2>Improved Copy</h2>`;
    const improvedCopyText = structuredToPlainText(copyResult.improvedCopy);
    html += `<div style="white-space: pre-wrap;">${improvedCopyText}</div>`;
    
    // Add score if available
    if (copyResult.improvedCopyScore) {
      html += formatScoreDataAsHTML(copyResult.improvedCopyScore, 'Improved Copy Score');
    }
  }
  
  // Add restyled improved copy if available
  if (copyResult.restyledImprovedVersions && copyResult.restyledImprovedVersions.length > 0) {
    // Display all restyled improved versions
    copyResult.restyledImprovedVersions.forEach((version, index) => {
      html += `<h2>Improved Copy (${version.persona}'s Voice)</h2>`;
      const restyledImprovedCopyText = structuredToPlainText(version.content);
      html += `<div style="white-space: pre-wrap;">${restyledImprovedCopyText}</div>`;
      
      // Add score if available and this is the first/primary version
      if (index === 0 && copyResult.restyledImprovedCopyScore) {
        html += formatScoreDataAsHTML(
          copyResult.restyledImprovedCopyScore, 
          `${version.persona}'s Voice Score`
        );
      }
    });
  } else if (copyResult.restyledImprovedCopy && (copyResult.restyledImprovedCopyPersona || selectedPersona)) {
    // Legacy single restyled improved copy
    html += `<h2>Improved Copy (${selectedPersona}'s Voice)</h2>`;
    const restyledImprovedCopyText = structuredToPlainText(copyResult.restyledImprovedCopy);
    html += `<div style="white-space: pre-wrap;">${restyledImprovedCopyText}</div>`;
    
    // Add score if available
    if (copyResult.restyledImprovedCopyScore) {
      html += formatScoreDataAsHTML(
        copyResult.restyledImprovedCopyScore, 
        `${selectedPersona}'s Voice Score`
      );
    }
  }
  
  // Handle multiple alternative versions if available
  if (copyResult.alternativeVersions && copyResult.alternativeVersions.length > 0) {
    copyResult.alternativeVersions.forEach((version, index) => {
      html += `<h2>${index + 1}.) Alternative Version</h2>`;
      const versionText = structuredToPlainText(version);
      html += `<div style="white-space: pre-wrap;">${versionText}</div>`;
      
      // Add score if available
      if (copyResult.alternativeVersionScores && copyResult.alternativeVersionScores[index]) {
        html += formatScoreDataAsHTML(
          copyResult.alternativeVersionScores[index], 
          `Alternative Version ${index + 1} Score`
        );
      }
      
      // Add restyled version if available
      if (copyResult.restyledAlternativeVersions && 
          copyResult.restyledAlternativeVersions[index] && 
          selectedPersona) {
        html += `<h3>${index + 1}.) Alternative Version (${selectedPersona}'s Voice)</h3>`;
        const restyledVersionText = structuredToPlainText(copyResult.restyledAlternativeVersions[index]);
        html += `<div style="white-space: pre-wrap;">${restyledVersionText}</div>`;
        
        // Add score for restyled version if available
        if (copyResult.restyledAlternativeVersionScores && 
            copyResult.restyledAlternativeVersionScores[index]) {
          html += formatScoreDataAsHTML(
            copyResult.restyledAlternativeVersionScores[index], 
            `${selectedPersona}'s Alternative Version ${index + 1} Score`
          );
        }
      }
    });
  } else if (copyResult.alternativeCopy) {
    // Legacy single alternative copy
    html += `<h2>Alternative Copy</h2>`;
    const alternativeCopyText = structuredToPlainText(copyResult.alternativeCopy);
    html += `<div style="white-space: pre-wrap;">${alternativeCopyText}</div>`;
    
    // Add score if available
    if (copyResult.alternativeCopyScore) {
      html += formatScoreDataAsHTML(copyResult.alternativeCopyScore, 'Alternative Copy Score');
    }
    
    // Legacy restyled alternative copy
    if (copyResult.restyledAlternativeCopy && selectedPersona) {
      html += `<h2>Alternative Copy (${selectedPersona}'s Voice)</h2>`;
      const restyledAlternativeCopyText = structuredToPlainText(copyResult.restyledAlternativeCopy);
      html += `<div style="white-space: pre-wrap;">${restyledAlternativeCopyText}</div>`;
      
      // Add score if available
      if (copyResult.restyledAlternativeCopyScore) {
        html += formatScoreDataAsHTML(
          copyResult.restyledAlternativeCopyScore,
          `${selectedPersona}'s Alternative Copy Score`
        );
      }
    }
  }
  
  // Add headlines if available
  if (copyResult.headlines && copyResult.headlines.length > 0) {
    html += `<h2>Headline Ideas</h2>`;
    html += `<ol>`;
    copyResult.headlines.forEach((headline) => {
      html += `<li>${headline}</li>`;
    });
    html += `</ol>`;
  }
  
  // Add restyled headlines if available
  if (copyResult.restyledHeadlinesVersions && copyResult.restyledHeadlinesVersions.length > 0) {
    // Display all restyled headline versions
    copyResult.restyledHeadlinesVersions.forEach(version => {
      html += `<h2>Headline Ideas (${version.persona}'s Voice)</h2>`;
      html += `<ol>`;
      version.headlines.forEach((headline) => {
        html += `<li>${headline}</li>`;
      });
      html += `</ol>`;
    });
  } else if (copyResult.restyledHeadlines && copyResult.restyledHeadlines.length > 0 && 
           (copyResult.restyledHeadlinesPersona || selectedPersona)) {
    // Legacy single restyled headlines
    html += `<h2>Headline Ideas (${selectedPersona}'s Voice)</h2>`;
    html += `<ol>`;
    copyResult.restyledHeadlines.forEach((headline) => {
      html += `<li>${headline}</li>`;
    });
    html += `</ol>`;
  }
  
  return html;
};

/**
 * Formats a single generated content item as HTML
 */
export const formatSingleGeneratedItemAsHTML = (
  item: GeneratedContentItem,
  targetWordCount?: number
): string => {
  let html = '';
  
  // Add SEO metadata as commented HTML at the top if available
  if (item.seoMetadata) {
    html += `<!-- SEO METADATA FOR ${item.sourceDisplayName || item.type}\n\n`;
    
    if (item.seoMetadata.urlSlugs && item.seoMetadata.urlSlugs.length > 0) {
      html += `URL SLUGS:\n`;
      item.seoMetadata.urlSlugs.forEach((slug, index) => {
        html += `${index + 1}. ${slug} (${slug.length}/60 chars)\n`;
      });
      html += `\n`;
    }
    
    if (item.seoMetadata.metaDescriptions && item.seoMetadata.metaDescriptions.length > 0) {
      html += `META DESCRIPTIONS:\n`;
      item.seoMetadata.metaDescriptions.forEach((desc, index) => {
        html += `${index + 1}. ${desc} (${desc.length}/160 chars)\n`;
      });
      html += `\n`;
    }
    
    if (item.seoMetadata.h1Variants && item.seoMetadata.h1Variants.length > 0) {
      html += `H1 PAGE TITLES:\n`;
      item.seoMetadata.h1Variants.forEach((h1, index) => {
        html += `${index + 1}. ${h1} (${h1.length}/60 chars)\n`;
      });
      html += `\n`;
    }
    
    if (item.seoMetadata.h2Headings && item.seoMetadata.h2Headings.length > 0) {
      html += `H2 HEADINGS:\n`;
      item.seoMetadata.h2Headings.forEach((h2, index) => {
        html += `${index + 1}. ${h2} (${h2.length}/70 chars)\n`;
      });
      html += `\n`;
    }
    
    if (item.seoMetadata.h3Headings && item.seoMetadata.h3Headings.length > 0) {
      html += `H3 HEADINGS:\n`;
      item.seoMetadata.h3Headings.forEach((h3, index) => {
        html += `${index + 1}. ${h3} (${h3.length}/70 chars)\n`;
      });
      html += `\n`;
    }
    
    if (item.seoMetadata.ogTitles && item.seoMetadata.ogTitles.length > 0) {
      html += `OPEN GRAPH TITLES:\n`;
      item.seoMetadata.ogTitles.forEach((ogTitle, index) => {
        html += `${index + 1}. ${ogTitle} (${ogTitle.length}/60 chars)\n`;
      });
      html += `\n`;
    }
    
    if (item.seoMetadata.ogDescriptions && item.seoMetadata.ogDescriptions.length > 0) {
      html += `OPEN GRAPH DESCRIPTIONS:\n`;
      item.seoMetadata.ogDescriptions.forEach((ogDesc, index) => {
        html += `${index + 1}. ${ogDesc} (${ogDesc.length}/110 chars)\n`;
      });
      html += `\n`;
    }
    
    html += `-->\n\n`;
  }
  
  // Check if this is FAQ JSON content
  if (typeof item.content === 'object' && item.content !== null && 
      item.content['@context'] === 'https://schema.org' && 
      item.content['@type'] === 'FAQPage') {
    // This is FAQ JSON - format it as a code block
    html += `<h2>FAQ Schema (JSON-LD)</h2>\n`;
    html += `<pre><code>${JSON.stringify(item.content, null, 2)}</code></pre>\n`;
    return html;
  }
  
  // Handle different content types
  if (item.type === GeneratedContentItemType.SeoMetadata && item.seoMetadata) {
    // For SEO metadata cards, only include the commented metadata (already added above)
    // Return immediately - no visible content should be generated
    return html;
  } else if (Array.isArray(item.content)) {
    // Handle headlines array - no title wrapper
    html += `<ol>\n`;
    item.content.forEach((headline: string) => {
      html += `  <li>${markdownToHtml(headline)}</li>\n`;
    });
    html += `</ol>`;
  } else if (typeof item.content === 'object' && item.content.headline && Array.isArray(item.content.sections)) {
    // Handle structured content
    const structuredContent = item.content as StructuredCopyOutput;
    
    html += `<h1>${markdownToHtml(structuredContent.headline)}</h1>\n\n`;
    
    structuredContent.sections.forEach(section => {
      if (section && section.title) {
        html += `<h2>${markdownToHtml(section.title)}</h2>\n`;
        
        if (section.content) {
          // Convert content to HTML and split into paragraphs
          const contentHtml = markdownToHtml(section.content);
          // If content already has paragraph tags, use as-is, otherwise wrap
          if (contentHtml.includes('<p>')) {
            html += `${contentHtml}\n`;
          } else {
            const paragraphs = contentHtml.split('\n\n').filter(p => p.trim());
            paragraphs.forEach(paragraph => {
              html += `<p>${paragraph.trim()}</p>\n`;
            });
          }
        }
        
        if (section.listItems && section.listItems.length > 0) {
          html += `<ul>\n`;
          section.listItems.forEach(item => {
            html += `  <li>${markdownToHtml(item)}</li>\n`;
          });
          html += `</ul>\n`;
        }
      }
    });
  } else {
    // Handle plain text content
    const textContent = structuredToPlainText(item.content);
    
    // Convert to HTML and handle paragraphs
    const contentHtml = markdownToHtml(textContent);
    
    // If content already has paragraph tags, use as-is, otherwise wrap
    if (contentHtml.includes('<p>')) {
      html += `${contentHtml}`;
    } else {
      const paragraphs = contentHtml.split('\n\n').filter(p => p.trim());
      paragraphs.forEach(paragraph => {
        html += `<p>${paragraph.trim()}</p>\n`;
      });
    }
  }
  
  // Add modification instruction if available
  if (item.modificationInstruction) {
    html += `\n\n<!-- MODIFICATION APPLIED: ${item.modificationInstruction} -->\n`;
  }
  
  // Add score information if available
  if (item.score) {
    html += `\n\n<!-- QUALITY SCORE: ${item.score.overall}/100\n\n`;
    
    if (item.score.improvementExplanation) {
      html += `WHY IT'S IMPROVED:\n`;
      html += `${item.score.improvementExplanation}\n\n`;
    }
    
    html += `SCORE DETAILS:\n`;
    html += `- Clarity: ${item.score.clarity}\n`;
    html += `- Persuasiveness: ${item.score.persuasiveness}\n`;
    html += `- Tone Match: ${item.score.toneMatch}\n`;
    html += `- Engagement: ${item.score.engagement}\n`;
    
    if (item.score.wordCountAccuracy !== undefined) {
      html += `- Word Count Accuracy: ${item.score.wordCountAccuracy}/100\n`;
    }
    
    html += `\n-->\n`;
  }
  
  // Add FAQ Schema if available
  if (item.faqSchema && Object.keys(item.faqSchema).length > 0) {
    html += `\n\n<!-- FAQ SCHEMA (JSON-LD) -->\n`;
    html += `<script type="application/ld+json">\n`;
    html += JSON.stringify(item.faqSchema, null, 2);
    html += `\n</script>\n`;
  }
  
  return html;
};