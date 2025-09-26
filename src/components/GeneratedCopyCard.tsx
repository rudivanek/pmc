import React, { useState } from 'react';
import { Copy, Check, Wand2, Sparkles, BookCheck, Globe, Code, MapPin, CreditCard as Edit } from 'lucide-react';
import { GeneratedContentItem, GeneratedContentItemType, FormState, StructuredCopyOutput } from '../types';
import { stripMarkdown } from '../utils/markdownUtils';
import { formatSingleGeneratedItemAsHTML } from '../utils/copyFormatter';
import { CATEGORIZED_VOICE_STYLES } from '../constants';
import { User } from '../types';
import { Button } from './ui/button';
import { Tooltip } from './ui/Tooltip';
import LoadingSpinner from './ui/LoadingSpinner';
import CharacterCounter from './ui/CharacterCounter';
import { Edit } from 'lucide-react';

interface GeneratedCopyCardProps {
  card: GeneratedContentItem;
  indentationLevel?: number;
  isLastInThread?: boolean;
  formState: FormState;
  currentUser?: User;
  onCreateAlternative: () => void;
  onApplyVoiceStyle: (persona: string) => void;
  onGenerateScore: () => void;
  onGenerateFaqSchema: () => void;
  onModifyContent: (instruction: string) => void;
  targetWordCount?: number;
}

const GeneratedCopyCard: React.FC<GeneratedCopyCardProps> = ({
  card,
  indentationLevel = 0,
  isLastInThread = false,
  formState,
  currentUser,
  onCreateAlternative,
  onApplyVoiceStyle,
  onGenerateScore,
  onGenerateFaqSchema,
  onModifyContent,
  targetWordCount
}) => {
  const [copied, setCopied] = useState(false);
  const [copiedHtml, setCopiedHtml] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState<string>('');
  const [modificationInstruction, setModificationInstruction] = useState<string>('');

  // Process content based on type
  const contentDetails = React.useMemo(() => {
    // Handle empty content
    if (card.content === null || card.content === undefined) {
      return { text: '', wordCount: 0, isStructured: false, isHeadlines: false };
    }

    // CRITICAL: Unwrap nested content structure first
    // This handles cases where restyleCopyWithPersona returns { content: actualContent, faqSchema: {...} }
    let actualContent = card.content;
    if (typeof card.content === 'object' && card.content !== null && 'content' in card.content) {
      actualContent = (card.content as any).content;
      console.log('Unwrapped nested content structure:', actualContent);
    }

    // Check if this is SEO metadata
    if (card.type === GeneratedContentItemType.SeoMetadata && card.seoMetadata) {
      // This card type should no longer exist as SEO metadata is now embedded in content cards
      return { text: '', wordCount: 0, isStructured: false, isHeadlines: false };
    }

    // Check if content is structured
    if (typeof actualContent === 'object') {
      // Check if content is structured copy
      if (actualContent && typeof actualContent === 'object' && 'headline' in actualContent && 'sections' in actualContent) {
        const structuredContent = actualContent as StructuredCopyOutput;
        // Calculate word count from structured content
        let text = stripMarkdown(structuredContent.headline) + '\n\n';
        structuredContent.sections.forEach(section => {
          if (section && section.title) {
            text += stripMarkdown(section.title) + '\n';
            if (section.content) {
              text += stripMarkdown(section.content) + '\n\n';
            } else if (section.listItems && section.listItems.length > 0) {
              section.listItems.forEach(item => {
                text += '• ' + stripMarkdown(item) + '\n';
              });
              text += '\n';
            }
          }
        });
        
        const wordCount = text ? text.trim().split(/\s+/).length : 0;
        
        return { 
          text, 
          wordCount, 
          isStructured: true, 
          isHeadlines: false,
          structuredContent: structuredContent,
          wordCountAccuracy: structuredContent.wordCountAccuracy
        };
      } else {
        // Handle other object formats by checking common text-containing properties
        if (actualContent.text && typeof actualContent.text === 'string') {
          const text = stripMarkdown(actualContent.text);
          const wordCount = text ? text.trim().split(/\s+/).length : 0;
          return { text, wordCount, isStructured: false, isHeadlines: false, isFaqJson: false };
        } else if (actualContent.content && typeof actualContent.content === 'string') {
          const text = stripMarkdown(actualContent.content);
          const wordCount = text ? text.trim().split(/\s+/).length : 0;
          return { text, wordCount, isStructured: false, isHeadlines: false, isFaqJson: false };
        } else if (actualContent.output && typeof actualContent.output === 'string') {
          const text = stripMarkdown(actualContent.output);
          const wordCount = text ? text.trim().split(/\s+/).length : 0;
          return { text, wordCount, isStructured: false, isHeadlines: false, isFaqJson: false };
        } else if (actualContent.message && typeof actualContent.message === 'string') {
          const text = stripMarkdown(actualContent.message);
          const wordCount = text ? text.trim().split(/\s+/).length : 0;
          return { text, wordCount, isStructured: false, isHeadlines: false, isFaqJson: false };
        } else {
          // Fallback: Handle objects that don't match any known format
          try {
            const formattedText = JSON.stringify(actualContent, null, 2);
            const wordCount = formattedText ? formattedText.trim().split(/\s+/).length : 0;
            return { 
              text: formattedText, 
              wordCount, 
              isStructured: false,
              isHeadlines: false,
              isFaqJson: false
            };
          } catch (e) {
            return { 
              text: 'Invalid content format', 
              wordCount: 0, 
              isStructured: false,
              isHeadlines: false,
              isFaqJson: false
            };
          }
        }
      }
    }
    
    // Handle string content
    const stringContent = String(actualContent);
    const strippedContent = stripMarkdown(stringContent);
    const wordCount = strippedContent ? strippedContent.trim().split(/\s+/).length : 0;
    
    return { text: strippedContent, wordCount, isStructured: false, isHeadlines: false, isFaqJson: false };
  }, [card.content]);

  // Get word count accuracy text and color
  const getWordCountInfo = React.useMemo(() => {
    if (!targetWordCount || contentDetails.isHeadlines) return null;
    
    const difference = contentDetails.wordCount - targetWordCount;
    const percentDifference = Math.abs(difference) / targetWordCount * 100;
    
    let textColor = '';
    let message = '';
    
    if (Math.abs(difference) <= 10) {
      textColor = 'text-gray-600 dark:text-gray-400';
      message = 'Perfect';
    } else if (Math.abs(difference) <= 50) {
      textColor = 'text-gray-700 dark:text-gray-300';
      message = `${Math.abs(difference)} words ${difference > 0 ? 'over' : 'under'}`;
    } else if (percentDifference <= 20) {
      textColor = 'text-gray-500 dark:text-gray-400';
      message = `${Math.abs(difference)} words ${difference > 0 ? 'over' : 'under'}`;
    } else {
      textColor = 'text-gray-600 dark:text-gray-500';
      message = `${Math.abs(difference)} words ${difference > 0 ? 'over' : 'under'} (${percentDifference.toFixed(0)}%)`;
    }
    
    return { textColor, message };
  }, [contentDetails.wordCount, targetWordCount, contentDetails.isHeadlines]);

  const handleCopy = () => {
    let textToCopy = contentDetails.text;
    
    // Include score information if available
    if (card.score) {
      textToCopy += `\n\n---\n\nQuality Score: ${card.score.overall}/100\n`;
      
      if (card.score.improvementExplanation) {
        textToCopy += `\nWhy it's improved: ${card.score.improvementExplanation}\n`;
      }
      
      textToCopy += `\nScore Details:`;
      textToCopy += `\n- Clarity: ${card.score.clarity}`;
      textToCopy += `\n- Persuasiveness: ${card.score.persuasiveness}`;
      textToCopy += `\n- Tone Match: ${card.score.toneMatch}`;
      textToCopy += `\n- Engagement: ${card.score.engagement}`;
      
      if (card.score.wordCountAccuracy !== undefined) {
        textToCopy += `\n- Word Count Accuracy: ${card.score.wordCountAccuracy}/100`;
      }
    }
    
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyHtml = () => {
    const htmlContent = formatSingleGeneratedItemAsHTML(card, targetWordCount);
    navigator.clipboard.writeText(htmlContent);
    setCopiedHtml(true);
    setTimeout(() => setCopiedHtml(false), 2000);
  };

  const handleApplyVoice = () => {
    if (selectedPersona && selectedPersona.trim()) {
      onApplyVoiceStyle(selectedPersona);
    } else {
      toast.error('Please select a voice style first');
    }
  };

  // Determine if we should show action buttons
  const showAlternativeButton = card.type !== GeneratedContentItemType.SeoMetadata;
  const showVoiceButton = selectedPersona && !contentDetails.isHeadlines;
  const showFaqSchemaButton = currentUser?.email === 'rfv@datago.net' && 
                              card.type !== GeneratedContentItemType.SeoMetadata && 
                              (card.type === GeneratedContentItemType.Improved || 
                               card.type === GeneratedContentItemType.Alternative ||
                               card.type === GeneratedContentItemType.RestyledImproved ||
                               card.type === GeneratedContentItemType.RestyledAlternative);

  return (
    <div className={`relative ${indentationLevel > 0 ? `ml-8` : ''}`}>
      {/* Thread connector lines */}
      {indentationLevel > 0 && (
        <>
          {/* Vertical line connecting to parent */}
          <div className="absolute left-0 top-0 w-px bg-gray-300 dark:bg-gray-600 h-6 -ml-4"></div>
          
          {/* Horizontal line to card */}
          <div className="absolute left-0 top-6 w-4 h-px bg-gray-300 dark:bg-gray-600 -ml-4"></div>
          
          {/* Vertical line continuing down (if not last in thread) */}
          {!isLastInThread && (
            <div className="absolute left-0 top-6 w-px bg-gray-300 dark:bg-gray-600 h-full -ml-4"></div>
          )}
        </>
      )}
      
      <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center">
          <div className={`w-1 h-5 mr-2 ${indentationLevel > 0 ? 'bg-blue-500' : 'bg-primary-500'}`}></div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {card.sourceDisplayName || card.type}
              {card.persona && (
                <span className="ml-2 text-sm font-normal text-purple-600 dark:text-purple-400">
                  ({card.persona}'s Voice)
                </span>
              )}
              {indentationLevel > 0 && (
                <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                  ↳ derived from above
                </span>
              )}
            </h3>
            <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center space-x-2">
              {!contentDetails.isHeadlines && (
                <>
                  <span>{contentDetails.wordCount} words</span>
                  
                  {targetWordCount && (
                    <>
                      <span className="text-gray-400 dark:text-gray-600">|</span>
                      <span>Target: {targetWordCount}</span>
                    </>
                  )}
                  
                  {getWordCountInfo && (
                    <>
                      <span className="text-gray-400 dark:text-gray-600">|</span>
                      <span className={getWordCountInfo.textColor}>{getWordCountInfo.message}</span>
                    </>
                  )}
                  
                  {contentDetails.wordCountAccuracy !== undefined && (
                    <>
                      <span className="text-gray-400 dark:text-gray-600">|</span>
                      <span 
                        className={`${
                          contentDetails.wordCountAccuracy >= 90
                            ? 'text-gray-600 dark:text-gray-400'
                            : contentDetails.wordCountAccuracy >= 75
                              ? 'text-gray-700 dark:text-gray-300'
                              : contentDetails.wordCountAccuracy >= 60
                                ? 'text-gray-500 dark:text-gray-400'
                                : 'text-gray-600 dark:text-gray-500'
                        }`}
                      >
                        Accuracy: {contentDetails.wordCountAccuracy}/100
                      </span>
                    </>
                  )}
                </>
              )}
              
              {contentDetails.isSeoMetadata && (
                <span>SEO Elements Generated</span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors flex items-center text-sm bg-white dark:bg-gray-800 px-3 py-1.5 rounded-md border border-gray-200 dark:border-gray-700"
            onClick={handleCopy}
          >
            {copied ? (
              <>
                <Check size={16} className="mr-1.5 text-gray-600 dark:text-gray-400" />
                <span className="text-gray-600 dark:text-gray-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy size={16} className="mr-1.5" />
                <span>Copy</span>
              </>
            )}
          </button>
          
          <Tooltip content="Copy this content formatted as HTML with SEO metadata as comments">
            <button
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors flex items-center text-sm bg-white dark:bg-gray-800 px-3 py-1.5 rounded-md border border-gray-200 dark:border-gray-700"
              onClick={handleCopyHtml}
            >
              {copiedHtml ? (
                <>
                  <Check size={16} className="mr-1.5 text-gray-600 dark:text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">HTML Copied!</span>
                </>
              ) : (
                <>
                  <Code size={16} className="mr-1.5" />
                  <span>Copy HTML</span>
                </>
              )}
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Content Display */}
      <div className="mb-4">
        <div className="space-y-4">
          {/* Render structured content if available */}
          {contentDetails.isStructured && contentDetails.structuredContent && (
            <div className="bg-white dark:bg-gray-800 rounded-md p-4 border border-gray-200 dark:border-gray-700">
              <h1 className="text-xl font-bold mb-4 text-gray-900 dark:text-white border-b border-gray-300 dark:border-gray-700 pb-2">
                {stripMarkdown(contentDetails.structuredContent.headline)}
              </h1>
              
              {Array.isArray(contentDetails.structuredContent.sections) && contentDetails.structuredContent.sections.map((section, sectionIndex) => (
                section && section.title ? (
                  <div key={sectionIndex} className="mb-4">
                    <h2 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200">
                      {stripMarkdown(section.title)}
                    </h2>
                    
                    {section.content && (
                      <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                        {stripMarkdown(section.content)}
                      </div>
                    )}
                    
                    {section.listItems && section.listItems.length > 0 && (
                      <ul className="list-disc pl-5 space-y-1 text-gray-700 dark:text-gray-300 mt-2">
                        {section.listItems.map((item, itemIndex) => (
                          <li key={itemIndex}>{stripMarkdown(item)}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : null
              ))}
            </div>
          )}
          
          {/* Render plain text content if not structured and not SEO metadata */}
          {!contentDetails.isStructured && card.type !== GeneratedContentItemType.SeoMetadata && (
            <div className={`bg-white dark:bg-gray-800 rounded-md p-4 border border-gray-200 dark:border-gray-700 ${
              contentDetails.isFaqJson 
                ? 'text-gray-700 dark:text-gray-300 font-mono text-sm overflow-x-auto' 
                : 'text-gray-700 dark:text-gray-300 whitespace-pre-wrap'
            }`}>
              {contentDetails.isFaqJson ? (
                <pre className="whitespace-pre overflow-x-auto">
                  <code>{contentDetails.text}</code>
                </pre>
              ) : (
                contentDetails.text
              )}
            </div>
          )}
          
          {/* FAQ Schema Display - Show below content if available */}
          {card.faqSchema && Object.keys(card.faqSchema).length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-md p-4 border border-gray-200 dark:border-gray-700 mt-4">
              <div className="flex items-center mb-3">
                <Code size={16} className="text-primary-500 mr-2" />
                <h5 className="text-sm font-semibold text-gray-900 dark:text-white">FAQ Schema (JSON-LD)</h5>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900 rounded p-3 border border-gray-200 dark:border-gray-700">
                <pre className="text-xs text-gray-700 dark:text-gray-300 font-mono whitespace-pre overflow-x-auto">
                  <code>{JSON.stringify(card.faqSchema, null, 2)}</code>
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quality Score Display */}
      {card.score && (
        <div className="mb-4 p-4 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-md font-semibold text-gray-900 dark:text-white">Quality Score</h4>
            <div className="flex items-center">
              <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center ${
                card.score.overall >= 90
                  ? 'border-gray-600 text-gray-600 dark:text-gray-400'
                  : card.score.overall >= 75
                    ? 'border-gray-700 text-gray-700 dark:text-gray-300'
                    : card.score.overall >= 60
                      ? 'border-gray-500 text-gray-500 dark:text-gray-400'
                      : 'border-gray-600 text-gray-600 dark:text-gray-500'
              }`}>
                <span className="text-sm font-bold">{card.score.overall}</span>
              </div>
            </div>
          </div>
          
          {card.score.improvementExplanation && (
            <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700">
              <div className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Why it's improved</div>
              <p className="text-sm text-gray-700 dark:text-gray-300">{card.score.improvementExplanation}</p>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">Clarity:</span>
              <p className="text-gray-600 dark:text-gray-400">{card.score.clarity}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">Persuasiveness:</span>
              <p className="text-gray-600 dark:text-gray-400">{card.score.persuasiveness}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">Tone Match:</span>
              <p className="text-gray-600 dark:text-gray-400">{card.score.toneMatch}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">Engagement:</span>
              <p className="text-gray-600 dark:text-gray-400">{card.score.engagement}</p>
            </div>
          </div>
        </div>
      )}

      {/* GEO Score Display */}
      {card.geoScore && (
        <div className="mb-4 p-4 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 space-y-4">
          <div className="flex items-center mb-3">
            <Globe size={20} className="text-primary-500 mr-2" />
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">GEO Score</h4>
          </div>
          
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center ${
                card.geoScore.overall >= 80
                  ? 'border-gray-600 text-gray-600 dark:text-gray-400'
                  : card.geoScore.overall >= 50
                    ? 'border-gray-500 text-gray-500 dark:text-gray-400'
                    : 'border-gray-600 text-gray-600 dark:text-gray-500'
              }`}>
                <span className="text-sm font-bold">{card.geoScore.overall}</span>
              </div>
            </div>
          </div>
          
          {/* GEO Score Breakdown */}
          {card.geoScore.breakdown && card.geoScore.breakdown.length > 0 && (
            <div className="mb-3 space-y-2">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Score Breakdown:</div>
              {card.geoScore.breakdown.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <span className={`w-2 h-2 rounded-full mr-2 ${
                        item.detected ? 'bg-gray-600' : 'bg-gray-400'
                      }`}></span>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.criterion}</span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 ml-4">{item.explanation}</p>
                  </div>
                  <div className="ml-2">
                    <span className={`text-sm font-bold ${
                      item.score >= 15 ? 'text-gray-600 dark:text-gray-400' :
                      item.score >= 10 ? 'text-gray-500 dark:text-gray-400' :
                      'text-gray-600 dark:text-gray-500'
                    }`}>
                      {item.score}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* GEO Optimization Suggestions */}
          {card.geoScore.overall < 80 && card.geoScore.suggestions && card.geoScore.suggestions.length > 0 && (
            <div className="p-3 bg-gray-50 dark:bg-gray-900/20 rounded border border-gray-200 dark:border-gray-800">
              <div className="text-sm font-medium text-gray-800 dark:text-gray-300 mb-2">
                💡 GEO Optimization Suggestions:
              </div>
              <ul className="space-y-1">
                {card.geoScore.suggestions.map((suggestion, index) => (
                  <li key={index} className="flex">
                    <span className="text-gray-500 mr-1.5">•</span>
                    <span className="text-sm text-gray-800 dark:text-gray-300">{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}


      {/* SEO Metadata Display */}
      {card.seoMetadata && (
        <div className="mb-4 p-4 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 space-y-4">
          <div className="flex items-center mb-3">
            <Globe size={20} className="text-primary-500 mr-2" />
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">SEO Metadata</h4>
          </div>
          
          {/* URL Slugs */}
          {card.seoMetadata.urlSlugs && card.seoMetadata.urlSlugs.length > 0 && (
            <div>
              <h5 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">URL Slugs</h5>
              <div className="space-y-2">
                {card.seoMetadata.urlSlugs.map((slug, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-900 rounded p-2">
                    <code className="text-sm text-gray-700 dark:text-gray-300">{slug}</code>
                    <CharacterCounter text={slug} maxLength={60} className="ml-2" />
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Meta Descriptions */}
          {card.seoMetadata.metaDescriptions && card.seoMetadata.metaDescriptions.length > 0 && (
            <div>
              <h5 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">Meta Descriptions</h5>
              <div className="space-y-2">
                {card.seoMetadata.metaDescriptions.map((desc, index) => (
                  <div key={index} className="bg-gray-50 dark:bg-gray-900 rounded p-2">
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">{desc}</p>
                    <CharacterCounter text={desc} maxLength={160} targetMinLength={155} targetMaxLength={160} />
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* H1 Variants */}
          {card.seoMetadata.h1Variants && card.seoMetadata.h1Variants.length > 0 && (
            <div>
              <h5 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">H1 (Page Titles)</h5>
              <div className="space-y-2">
                {card.seoMetadata.h1Variants.map((h1, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-900 rounded p-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{h1}</span>
                    <CharacterCounter text={h1} maxLength={60} className="ml-2" />
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* H2 Headings */}
          {card.seoMetadata.h2Headings && card.seoMetadata.h2Headings.length > 0 && (
            <div>
              <h5 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">H2 Headings</h5>
              <div className="space-y-2">
                {card.seoMetadata.h2Headings.map((h2, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-900 rounded p-2">
                    <span className="text-sm text-gray-700 dark:text-gray-300">{h2}</span>
                    <CharacterCounter text={h2} maxLength={70} className="ml-2" />
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* H3 Headings */}
          {card.seoMetadata.h3Headings && card.seoMetadata.h3Headings.length > 0 && (
            <div>
              <h5 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">H3 Headings</h5>
              <div className="space-y-2">
                {card.seoMetadata.h3Headings.map((h3, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-900 rounded p-2">
                    <span className="text-sm text-gray-700 dark:text-gray-300">{h3}</span>
                    <CharacterCounter text={h3} maxLength={70} className="ml-2" />
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* OG Titles */}
          {card.seoMetadata.ogTitles && card.seoMetadata.ogTitles.length > 0 && (
            <div>
              <h5 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">Open Graph Titles</h5>
              <div className="space-y-2">
                {card.seoMetadata.ogTitles.map((ogTitle, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-900 rounded p-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{ogTitle}</span>
                    <CharacterCounter text={ogTitle} maxLength={60} className="ml-2" />
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* OG Descriptions */}
          {card.seoMetadata.ogDescriptions && card.seoMetadata.ogDescriptions.length > 0 && (
            <div>
              <h5 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">Open Graph Descriptions</h5>
              <div className="space-y-2">
                {card.seoMetadata.ogDescriptions.map((ogDesc, index) => (
                  <div key={index} className="bg-gray-50 dark:bg-gray-900 rounded p-2">
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">{ogDesc}</p>
                    <CharacterCounter text={ogDesc} maxLength={110} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      {(showAlternativeButton || showVoiceButton || showFaqSchemaButton) && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <div className="space-y-4">
            {/* Alternative Copy Button */}
            {showAlternativeButton && (
              <div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onCreateAlternative}
                  className="w-full"
                >
                  <Wand2 size={16} className="mr-2" />
                  Create Alternative Copy
                </Button>
              </div>
            )}

            {/* Voice Style Section */}
            {!contentDetails.isHeadlines && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Apply Voice Style
                </label>
                <div className="flex gap-2">
                  <select
                    value={selectedPersona}
                    onChange={(e) => setSelectedPersona(e.target.value)}
                    className="flex-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 p-2"
                  >
                    <option value="">Select a voice style...</option>
                    {CATEGORIZED_VOICE_STYLES.map(category => (
                      <optgroup key={category.category} label={category.category}>
                        {category.options.map((voiceOption) => (
                          <option key={voiceOption.value} value={voiceOption.value}>
                            {voiceOption.label}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  
                  <Tooltip content={`Apply ${selectedPersona || 'selected'} voice style to this content`}>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleApplyVoice}
                      disabled={!selectedPersona}
                    >
                      <Sparkles size={16} className="mr-1" />
                      Apply
                    </Button>
                  </Tooltip>
                </div>
              </div>
            )}

            {/* Content Modification Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Modify this content
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={modificationInstruction}
                  onChange={(e) => setModificationInstruction(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && modificationInstruction.trim()) {
                      onModifyContent(modificationInstruction);
                      setModificationInstruction('');
                    }
                  }}
                  className="flex-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 p-2"
                  placeholder="e.g., make shorter and more friendly, add more technical details..."
                />
                
                <Tooltip content="Modify this content with custom instructions">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (modificationInstruction.trim()) {
                        onModifyContent(modificationInstruction);
                        setModificationInstruction('');
                      }
                    }}
                    disabled={!modificationInstruction.trim()}
                  >
                    <Edit size={16} className="mr-1" />
                    Modify
                  </Button>
                </Tooltip>
              </div>
            </div>

            {/* FAQ Schema Button */}
            {showFaqSchemaButton && (
              <div>
                <Tooltip content="Generate FAQPage Schema (JSON-LD) from this content">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onGenerateFaqSchema(contentDetails.text)}
                    className="w-full"
                  >
                    <Code size={16} className="mr-2" />
                    Generate FAQPage Schema (JSON-LD)
                  </Button>
                </Tooltip>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
    </div>
  );
};

export default GeneratedCopyCard;