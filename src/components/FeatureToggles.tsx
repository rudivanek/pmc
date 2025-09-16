import React from 'react';
import { FormData } from '../types';
import { Tooltip } from './ui/Tooltip';
import { InfoIcon } from 'lucide-react';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { useMemo } from 'react';
import { useInputField } from '../hooks/useInputField';
import { toast } from 'react-hot-toast';

interface FeatureTogglesProps {
  formData: FormData;
  handleToggle: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleChange: (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement | HTMLTextAreaElement>) => void;
  isSmartMode: boolean; // Add prop for Smart Mode
  displayMode: 'all' | 'populated';
}

const FeatureToggles: React.FC<FeatureTogglesProps> = ({ 
  formData, 
  handleToggle, 
  handleChange,
  isSmartMode, // Add isSmartMode prop
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

  // We're removing this conditional return so the component is always displayed
  // regardless of Smart Mode or Pro Mode
  
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
  
  // Helper function to check if a field is populated
  const isFieldPopulated = (value: any): boolean => {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    if (typeof value === 'number') return value > 0;
    if (typeof value === 'boolean') return value === true;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object') return Object.keys(value).length > 0;
    return false;
  };
  
  return (
    <div className="space-y-3 py-4 border-t border-gray-300 dark:border-gray-800">
      <Tooltip content="Enhance your output with alternative versions, humanized styles, scoring, and voice emulation options." delayDuration={300}>
        <div className="flex items-center">
          <div className="w-1 h-5 bg-primary-500 mr-2"></div>
          <div className="font-medium text-base text-gray-700 dark:text-gray-300">Optional Features</div>
        </div>
      </Tooltip>
      
      <div className="flex items-start">
      {(displayMode === 'all' || isFieldPopulated(formData.generateSeoMetadata)) && (
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
      )}
        <div className="ml-2 flex-1">
          <Label htmlFor="generateSeoMetadata" className="cursor-pointer">
            <span className="text-sm">
            Generate SEO Metadata and Structural Elements Automatically
            </span>
            <Tooltip content="Generate URL slugs, meta descriptions, H1/H2/H3 headings, and Open Graph tags for your content">
              <span className="ml-1 text-gray-500 cursor-help">
                <InfoIcon size={14} />
              </span>
            </Tooltip>
          </Label>
          
          {formData.generateSeoMetadata && (
            <div className="mt-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center mb-3">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">📎 SEO & Metadata Outputs</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* URL Slug */}
                <div>
                  <label htmlFor="numUrlSlugs" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    URL Slug (max 60 chars)
                  </label>
                  <input
                    id="numUrlSlugs"
                    name="numUrlSlugs"
                    type="number"
                    min="1"
                    max="5"
                    className="w-16 bg-white dark:bg-black border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-xs rounded-lg focus:ring-primary-500 focus:border-primary-500 p-1.5"
                    value={formData.numUrlSlugs || 1}
                    onChange={handleChange}
                  />
                  <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">variants</span>
                </div>
                
                {/* Meta Description */}
                <div>
                  <label htmlFor="numMetaDescriptions" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Meta Description (155-160 chars)
                  </label>
                  <input
                    id="numMetaDescriptions"
                    name="numMetaDescriptions"
                    type="number"
                    min="1"
                    max="5"
                    className="w-16 bg-white dark:bg-black border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-xs rounded-lg focus:ring-primary-500 focus:border-primary-500 p-1.5"
                    value={formData.numMetaDescriptions || 1}
                    onChange={handleChange}
                  />
                  <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">variants</span>
                </div>
                
                {/* H1 Variants */}
                <div>
                  <label htmlFor="numH1Variants" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    H1 (Page Title, max 60 chars)
                  </label>
                  <input
                    id="numH1Variants"
                    name="numH1Variants"
                    type="number"
                    min="1"
                    max="5"
                    className="w-16 bg-white dark:bg-black border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-xs rounded-lg focus:ring-primary-500 focus:border-primary-500 p-1.5"
                    value={formData.numH1Variants || 1}
                    onChange={handleChange}
                  />
                  <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">variants</span>
                </div>
                
                {/* H2 Variants */}
                <div>
                  <label htmlFor="numH2Variants" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    H2 Headings (max 70 chars each)
                  </label>
                  <input
                    id="numH2Variants"
                    name="numH2Variants"
                    type="number"
                    min="1"
                    max="10"
                    className="w-16 bg-white dark:bg-black border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-xs rounded-lg focus:ring-primary-500 focus:border-primary-500 p-1.5"
                    value={formData.numH2Variants || 2}
                    onChange={handleChange}
                  />
                  <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">variants</span>
                </div>
                
                {/* H3 Variants */}
                <div>
                  <label htmlFor="numH3Variants" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    H3 Headings (max 70 chars each)
                  </label>
                  <input
                    id="numH3Variants"
                    name="numH3Variants"
                    type="number"
                    min="1"
                    max="10"
                    className="w-16 bg-white dark:bg-black border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-xs rounded-lg focus:ring-primary-500 focus:border-primary-500 p-1.5"
                    value={formData.numH3Variants || 2}
                    onChange={handleChange}
                  />
                  <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">variants</span>
                </div>
                
                {/* OG Title */}
                <div>
                  <label htmlFor="numOgTitles" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    OG Title (max 60 chars)
                  </label>
                  <input
                    id="numOgTitles"
                    name="numOgTitles"
                    type="number"
                    min="1"
                    max="5"
                    className="w-16 bg-white dark:bg-black border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-xs rounded-lg focus:ring-primary-500 focus:border-primary-500 p-1.5"
                    value={formData.numOgTitles || 1}
                    onChange={handleChange}
                  />
                  <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">variants</span>
                </div>
                
                {/* OG Description */}
                <div>
                  <label htmlFor="numOgDescriptions" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    OG Description (max 110 chars)
                  </label>
                  <input
                    id="numOgDescriptions"
                    name="numOgDescriptions"
                    type="number"
                    min="1"
                    max="5"
                    className="w-16 bg-white dark:bg-black border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-xs rounded-lg focus:ring-primary-500 focus:border-primary-500 p-1.5"
                    value={formData.numOgDescriptions || 1}
                    onChange={handleChange}
                  />
                  <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">variants</span>
                </div>
              </div>
              
              <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                All SEO elements will be generated for each content variation and voice style. Character counters will show live feedback in the output.
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Little Word Count Adherence Toggle - Only show for targets below 100 words */}
      {(displayMode === 'all' || isFieldPopulated(formData.generateScores)) && (
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
      )}
      
      {/* GEO Score Generation Toggle */}
      {(displayMode === 'all' || isFieldPopulated(formData.generateGeoScore)) && (
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
      )}
      
      {/* Strict Word Count Adherence Toggle */}
      {(displayMode === 'all' || isFieldPopulated(formData.prioritizeWordCount)) && (
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
      )}
      
      {/* Word Count Tolerance Percentage - Only show when prioritizeWordCount is enabled */}
      {formData.prioritizeWordCount && (
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
      {isLittleWordCount && (
      (displayMode === 'all' || isFieldPopulated(formData.adhereToLittleWordCount)) && (
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
      )
      )}
      
      {/* New option for SEO keyword integration */}
      {(displayMode === 'all' || isFieldPopulated(formData.forceKeywordIntegration)) && (
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
      )}

      {/* Force detailed elaborations and examples */}
      {(displayMode === 'all' || isFieldPopulated(formData.forceElaborationsExamples)) && (
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
      )}

      {/* New option for GEO enhancement */}
      {(displayMode === 'all' || isFieldPopulated(formData.enhanceForGEO)) && (
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
      )}

      {/* TL;DR Summary Toggle - Only show when GEO is enabled */}
      {formData.enhanceForGEO && (
      (displayMode === 'all' || isFieldPopulated(formData.addTldrSummary)) && (
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
      )
      )}
      
      {/* Target Countries or Regions - Only show when GEO is enabled */}
      {formData.enhanceForGEO && (
      (displayMode === 'all' || isFieldPopulated(formData.geoRegions)) && (
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
      )
      )}
    </div>
  );
};

export default FeatureToggles;