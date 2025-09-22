import React from 'react';
import { FormData } from '../types';
import { Tooltip } from './ui/Tooltip';
import { InfoIcon } from 'lucide-react';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { useMemo } from 'react';
import { useInputField } from '../hooks/useInputField';
import { toast } from 'react-hot-toast';
import { isFieldPopulated, isFieldUserModified } from '../utils/formUtils';

interface FeatureTogglesProps {
  formData: FormData;
  handleToggle: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleChange: (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement | HTMLTextAreaElement>) => void;
  isSmartMode: boolean;
  displayMode: 'all' | 'populated';
}

const FeatureToggles: React.FC<FeatureTogglesProps> = ({ 
  formData, 
  handleToggle, 
  handleChange,
  isSmartMode,
  displayMode
}) => {
  // Initialize locationField using useInputField hook
  const locationField = useInputField({
    value: formData.location || '',
    onChange: (value: string) => {
      // Create proper event structure for handleChange
      const syntheticEvent = {
        target: {
          name: 'location',
          value: value
        }
      } as React.ChangeEvent<HTMLInputElement>;
      handleChange(syntheticEvent);
    }
  });

  // Check if any field in this component is populated
  const hasPopulatedFeatureTogglesFields = () => {
    return formData.generateSeoMetadata ||
           formData.generateScores ||
           formData.generateGeoScore ||
           formData.prioritizeWordCount ||
           formData.adhereToLittleWordCount ||
           formData.forceKeywordIntegration ||
           formData.forceElaborationsExamples ||
           formData.enhanceForGEO ||
           formData.addTldrSummary ||
           isFieldPopulated(formData.geoRegions) ||
           (formData.numUrlSlugs && formData.numUrlSlugs !== 3) ||
           (formData.numMetaDescriptions && formData.numMetaDescriptions !== 3) ||
           (formData.numH1Variants && formData.numH1Variants !== 3) ||
           (formData.numH2Variants && formData.numH2Variants !== 3) ||
           (formData.numH3Variants && formData.numH3Variants !== 3) ||
           (formData.numOgTitles && formData.numOgTitles !== 3) ||
           (formData.numOgDescriptions && formData.numOgDescriptions !== 3);
  };

  // Don't render anything if display mode is 'populated' and no fields are populated
  if (displayMode === 'populated' && !hasPopulatedFeatureTogglesFields()) {
    return null;
  }
  
  // Calculate if the current word count target is "little" (below 100 words)
  const isLittleWordCount = useMemo(() => {
    if (formData.wordCount === 'Custom') {
      return (formData.customWordCount || 0) < 100;
    }
    
    // Check preset ranges
    if (formData.wordCount.includes('Short')) {
      return true; // Short: 50-100 is considered little
    }
    
    return false; // Medium and Long are not considered little
  }, [formData.wordCount, formData.customWordCount]);
  
  // Diagnostic logging to help debug visibility issues
  React.useEffect(() => {
    console.log('FeatureToggles Diagnostic:', {
      wordCount: formData.wordCount,
      customWordCount: formData.customWordCount,
      isLittleWordCount: isLittleWordCount,
      shouldShowLittleWordCountControl: isLittleWordCount
    });
  }, [formData.wordCount, formData.customWordCount, isLittleWordCount]);
  
  return (
    <div className="space-y-3 py-4 border-t border-gray-300 dark:border-gray-800">
      <Tooltip content="Enhance your output with alternative versions, humanized styles, scoring, and voice emulation options." delayDuration={300}>
        <div className="flex items-center">
          <div className="w-1 h-5 bg-primary-500 mr-2"></div>
          <div className="font-medium text-base text-gray-700 dark:text-gray-300">Optional Features</div>
        </div>
      </Tooltip>
      
      <div className="flex items-start">
        <div className={displayMode === 'populated' && !formData.generateSeoMetadata ? 'hidden' : ''}>
          <Checkbox
            id="generateSeoMetadata"
            checked={formData.generateSeoMetadata || false}
            onCheckedChange={(checked) => {
              handleToggle({ 
                target: { 
                  name: 'generateSeoMetadata', 
                  checked: checked === true 
                }
              } as React.ChangeEvent<HTMLInputElement>);
            }}
          />
          <div className="ml-2 flex-1">
            <Label htmlFor="generateSeoMetadata" className="cursor-pointer">
              <span className="text-sm">Generate SEO metadata</span>
              <Tooltip content="Generates URL slugs, meta descriptions, H1/H2/H3 variants, and Open Graph titles/descriptions">
                <span className="ml-1 text-gray-500 cursor-help">
                  <InfoIcon size={14} />
                </span>
              </Tooltip>
            </Label>
            
            {formData.generateSeoMetadata && (
              <div className="mt-2">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  All SEO elements will be generated for each content variation and voice style. Character counters will show live feedback in the output.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Little Word Count Adherence Toggle - Only show for targets below 100 words */}
      <div className={displayMode === 'populated' && !formData.generateScores ? 'hidden' : ''}>
        <div className="flex items-center">
          <Checkbox
            id="generateScores"
            checked={formData.generateScores || false}
            onCheckedChange={(checked) => {
              handleToggle({ 
                target: { 
                  name: 'generateScores', 
                  checked: checked === true 
                }
              } as React.ChangeEvent<HTMLInputElement>);
            }}
          />
          <Label htmlFor="generateScores" className="ml-2 cursor-pointer">
            <span className="text-sm">
            Generate content scores
            </span>
            <Tooltip content="Automatically evaluates the quality of each generated version and provides improvement explanations">
              <span className="ml-1 text-gray-500 cursor-help">
                <InfoIcon size={14} />
              </span>
            </Tooltip>
          </Label>
        </div>
      </div>
      
      {/* GEO Score Generation Toggle */}
      <div className={displayMode === 'populated' && !formData.generateGeoScore ? 'hidden' : ''}>
        <div className="flex items-center">
          <Checkbox
            id="generateGeoScore"
            checked={formData.generateGeoScore || false}
            onCheckedChange={(checked) => {
              handleToggle({ 
                target: { 
                  name: 'generateGeoScore', 
                  checked: checked === true 
                }
              } as React.ChangeEvent<HTMLInputElement>);
            }}
          />
          <Label htmlFor="generateGeoScore" className="ml-2 cursor-pointer">
            <span className="text-sm">
            Generate GEO scores
            </span>
            <Tooltip content="Evaluates how well content is optimized for AI assistants and geographical visibility (Generative Engine Optimization)">
              <span className="ml-1 text-gray-500 cursor-help">
                <InfoIcon size={14} />
              </span>
            </Tooltip>
          </Label>
        </div>
      </div>
      
      {/* Strict Word Count Adherence Toggle */}
      <div className={displayMode === 'populated' && !formData.prioritizeWordCount ? 'hidden' : ''}>
        <div className="flex items-center">
          <Checkbox
            id="prioritizeWordCount"
            checked={formData.prioritizeWordCount || false}
            onCheckedChange={(checked) => {
              handleToggle({ 
                target: { 
                  name: 'prioritizeWordCount', 
                  checked: checked === true 
                }
              } as React.ChangeEvent<HTMLInputElement>);
            }}
          />
          <Label 
            htmlFor="prioritizeWordCount"
            className="ml-2 cursor-pointer"
          >
            <span className="text-sm">Strictly adhere to target word count</span>
            <Tooltip content="When enabled, the AI will perform multiple passes if necessary to achieve the exact word count.">
              <span className="ml-1 inline-block text-gray-500">
                <InfoIcon size={14} />
              </span>
            </Tooltip>
          </Label>
        </div>
      </div>
      
      {/* Word Count Tolerance Percentage - Only show when prioritizeWordCount is enabled */}
      {formData.prioritizeWordCount && (displayMode === 'all' || formData.prioritizeWordCount) && (
        <div className="ml-6 mt-2">
          <div className="flex items-center space-x-2">
            <label htmlFor="wordCountTolerancePercentage" className="text-xs text-gray-600 dark:text-gray-400">
              Tolerance (% below target):
            </label>
            <input
              id="wordCountTolerancePercentage"
              name="wordCountTolerancePercentage"
              type="number"
              min="0"
              max="10"
              step="0.5"
              className="w-16 bg-white dark:bg-black border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-xs rounded-lg focus:ring-primary-500 focus:border-primary-500 p-1.5"
              value={formData.wordCountTolerancePercentage || 2}
              onChange={handleChange}
            />
            <span className="text-xs text-gray-500 dark:text-gray-400">%</span>
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            AI will revise content if it's more than this percentage below the target word count.
          </p>
        </div>
      )}
      
      {/* Little Word Count Adherence Toggle - Only show for targets below 100 words */}
      {isLittleWordCount && (displayMode === 'all' || formData.adhereToLittleWordCount) && (
        <div className="flex items-start">
          <Checkbox
            id="adhereToLittleWordCount"
            checked={formData.adhereToLittleWordCount || false}
            onCheckedChange={(checked) => {
              handleToggle({ 
                target: { 
                  name: 'adhereToLittleWordCount', 
                  checked: checked === true 
                }
              } as React.ChangeEvent<HTMLInputElement>);
            }}
          />
          <div className="ml-2 flex-1">
            <Label 
              htmlFor="adhereToLittleWordCount"
              className="cursor-pointer"
            >
              <span className="text-sm">Flexible word count for short content</span>
              <Tooltip content="Allows a small percentage tolerance for short content targets (below 100 words) to maintain natural phrasing.">
                <span className="ml-1 inline-block text-gray-500">
                  <InfoIcon size={14} />
                </span>
              </Tooltip>
            </Label>
            
            {formData.adhereToLittleWordCount && (
              <div className="mt-2">
                <div className="flex items-center space-x-2">
                  <label htmlFor="littleWordCountTolerancePercentage" className="text-xs text-gray-600 dark:text-gray-400">
                    Tolerance (+/-):
                  </label>
                  <input
                    id="littleWordCountTolerancePercentage"
                    name="littleWordCountTolerancePercentage"
                    type="number"
                    min="5"
                    max="50"
                    step="5"
                    className="w-16 bg-white dark:bg-black border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-xs rounded-lg focus:ring-primary-500 focus:border-primary-500 p-1.5"
                    value={formData.littleWordCountTolerancePercentage || 20}
                    onChange={handleChange}
                  />
                  <span className="text-xs text-gray-500 dark:text-gray-400">%</span>
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Example: 40 words ±20% = 32-48 words acceptable range. This allows more natural phrasing for short content while still maintaining word count targets.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* New option for SEO keyword integration */}
      <div className={displayMode === 'populated' && !formData.forceKeywordIntegration ? 'hidden' : ''}>
        <div className="flex items-center">
          <Checkbox
            id="forceKeywordIntegration"
            checked={formData.forceKeywordIntegration || false}
            onCheckedChange={(checked) => {
              handleToggle({ 
                target: { 
                  name: 'forceKeywordIntegration', 
                  checked: checked === true 
                }
              } as React.ChangeEvent<HTMLInputElement>);
            }}
          />
          <Label htmlFor="forceKeywordIntegration" className="ml-2 cursor-pointer">
            <span className="text-sm">
            Force SEO keyword integration
            </span>
            <Tooltip content="Ensures all keywords appear naturally throughout the copy for better SEO">
              <span className="ml-1 text-gray-500 cursor-help">
                <InfoIcon size={14} />
              </span>
            </Tooltip>
          </Label>
        </div>
      </div>

      {/* Force detailed elaborations and examples */}
      <div className={displayMode === 'populated' && !formData.forceElaborationsExamples ? 'hidden' : ''}>
        <div className="flex items-center">
          <Checkbox
            id="forceElaborationsExamples"
            checked={formData.forceElaborationsExamples || false}
            onCheckedChange={(checked) => {
              handleToggle({ 
                target: { 
                  name: 'forceElaborationsExamples', 
                  checked: checked === true 
                }
              } as React.ChangeEvent<HTMLInputElement>);
            }}
          />
          <Label htmlFor="forceElaborationsExamples" className="ml-2 cursor-pointer">
            <span className="text-sm">
            Force detailed elaborations and examples
            </span>
            <Tooltip content="Forces AI to provide detailed explanations, examples, and case studies to expand content">
              <span className="ml-1 text-gray-500 cursor-help">
                <InfoIcon size={14} />
              </span>
            </Tooltip>
          </Label>
        </div>
      </div>

      {/* New option for GEO enhancement */}
      <div className={displayMode === 'populated' && !formData.enhanceForGEO ? 'hidden' : ''}>
        <div className="flex items-center">
          <Checkbox
            id="enhanceForGEO"
            checked={formData.enhanceForGEO || false}
            onCheckedChange={(checked) => {
              handleToggle({ 
                target: { 
                  name: 'enhanceForGEO', 
                  checked: checked === true 
                }
              } as React.ChangeEvent<HTMLInputElement>);
            }}
          />
          <Label htmlFor="enhanceForGEO" className="ml-2 cursor-pointer">
            <span className="text-sm">
            Enhance for GEO
            </span>
            <Tooltip content="Optimizes content to be more quotable, summarizable, and recommendable by AI assistants like ChatGPT, Claude, and Gemini.">
              <span className="ml-1 text-gray-500 cursor-help">
                <InfoIcon size={14} />
              </span>
            </Tooltip>
          </Label>
        </div>
      </div>

      {/* TL;DR Summary Toggle - Only show when GEO is enabled */}
      {formData.enhanceForGEO && (displayMode === 'all' || formData.addTldrSummary) && (
        <div className="flex items-start">
          {/* Check if structured output is selected */}
          {(() => {
            const hasStructuredOutput = formData.outputStructure && formData.outputStructure.length > 0;
            return (
              <>
          <Checkbox
            id="addTldrSummary"
            checked={formData.addTldrSummary || false}
            disabled={hasStructuredOutput}
            onCheckedChange={(checked) => {
              // Don't allow enabling if structured output is selected
              if (checked === true && hasStructuredOutput) {
                toast('❌ TL;DR Summary is not compatible with structured output formats.\n\nTo use TL;DR:\n1. Clear all items from "Output Structure" field\n2. Then enable this option\n\nTL;DR works best with plain paragraph text, not with JSON/structured formats.', {
                  duration: 6000,
                  position: 'top-right',
                  style: {
                    background: '#374151',
                    color: '#f9fafb',
                    borderRadius: '8px',
                    maxWidth: '400px',
                    whiteSpace: 'pre-line'
                  }
                });
                return;
              }
              
              // Show toast notification when checkbox is checked
              if (checked === true) {
                toast('💡 TL;DR summaries work best for blogs, long-form pages, service pages, and FAQs.\n\nThey improve AI visibility, boost quotability, and help readers grasp the value instantly.\nAvoid using TL;DR for short ads, H1s, or slogans — those already serve as the summary.', {
                  duration: 6000,
                  position: 'top-right',
                  style: {
                    background: '#374151',
                    color: '#f9fafb',
                    borderRadius: '8px',
                    maxWidth: '400px',
                    whiteSpace: 'pre-line'
                  }
                });
              }
              
              handleToggle({ 
                target: { 
                  name: 'addTldrSummary', 
                  checked: checked === true 
                }
              } as React.ChangeEvent<HTMLInputElement>);
            }}
          />
          <div className="ml-2 flex-1">
            <Label htmlFor="addTldrSummary" className="cursor-pointer">
              <span className="text-sm">
              Add TL;DR Summary at the Top {hasStructuredOutput && (
                <span className="text-gray-400">(disabled for structured output)</span>
              )}
              </span>
              <Tooltip content="Adds a brief 1–2 sentence answer-style summary before the main content that AI assistants can easily quote">
                <span className="ml-1 text-gray-500 cursor-help">
                  <InfoIcon size={14} />
                </span>
              </Tooltip>
            </Label>
            {hasStructuredOutput ? (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                TL;DR summaries are not compatible with structured output formats. Clear the "Output Structure" field to use this feature.
              </p>
            ) : (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Prepends a concise summary that directly answers the main question or user intent
              </p>
            )}
          </div>
              </>
            );
          })()}
        </div>
      )}
      
      {/* Target Countries or Regions - Only show when GEO is enabled */}
      {formData.enhanceForGEO && (displayMode === 'all' || isFieldPopulated(formData.geoRegions)) && (
        <div className="ml-6 mt-2">
          <label htmlFor="geoRegions" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Target Countries or Regions
          </label>
          <input
            type="text"
            id="geoRegions"
            name="geoRegions"
            className="bg-white dark:bg-black border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5"
            placeholder="Ej. México, LATAM, Barcelona"
            value={formData.geoRegions || ''}
            onChange={handleChange}
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Enter countries, regions, or cities to help tailor the content for local AI search results (e.g., México, LATAM, CDMX, España).
          </p>
        </div>
      )}
    </div>
  );
};

export default FeatureToggles;