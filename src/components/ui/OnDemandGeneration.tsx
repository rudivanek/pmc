import React from 'react';
import { useState, useEffect } from 'react';
import { FormState } from '../../types';
import { Button } from './button';
import LoadingSpinner from './LoadingSpinner';
import { Wand2, Sparkles, BookCheck, MessageSquare } from 'lucide-react';
import { Tooltip } from './Tooltip';
import { CATEGORIZED_VOICE_STYLES } from '../../constants';

interface OnDemandGenerationProps {
  formState: FormState;
  contentType: 'improved' | 'alternative' | 'humanized';
  alternativeIndex?: number;
  onGenerateAlternative: (index?: number) => Promise<void>;
  onGenerateRestyled: (contentType: 'improved' | 'alternative' | 'humanized', alternativeIndex?: number, humanizedIndex?: number, selectedPersona?: string) => Promise<void>;
  onGenerateScore: (contentType: 'improved' | 'alternative' | 'humanized' | 'restyledImproved' | 'restyledAlternative' | 'restyledHumanized', 
                   alternativeIndex?: number, humanizedIndex?: number) => Promise<void>;
}

const OnDemandGeneration: React.FC<OnDemandGenerationProps> = ({
  formState,
  contentType,
  alternativeIndex,
  onGenerateAlternative,
  onGenerateRestyled,
  onGenerateScore
}) => {
  // Local state for the selected persona
  const [localSelectedPersona, setLocalSelectedPersona] = useState<string>(formState.selectedPersona || '');
  
  // Keep localSelectedPersona in sync with formState.selectedPersona
  useEffect(() => {
    if (formState.selectedPersona) {
      setLocalSelectedPersona(formState.selectedPersona);
    }
  }, [formState.selectedPersona]);
  
  // Determine if buttons should be shown based on form state
  const showAlternativeButton = contentType === 'improved' && 
    !formState.isGeneratingAlternative && // Don't show if already generating
    formState.alternativeGenerationIndex === undefined; // Make sure we're not in the middle of generating

  // Modified to allow multiple voice stylings by removing the hasRestyled() check
  const showRestyledButton = !!localSelectedPersona && 
    (contentType === 'improved' || contentType === 'alternative');

  // Never show score button if generate scores is enabled globally
  const showScoreButton = !formState.generateScores && !hasScore();

  // Check if the content already has a score
  function hasScore(): boolean {
    if (!formState.copyResult) return false;
    
    if (contentType === 'improved') {
      return !!formState.copyResult.improvedCopyScore;
    } else if (contentType === 'alternative' && alternativeIndex !== undefined) {
      // Check if there's a score for this specific alternative version
      return !!formState.copyResult.alternativeVersionScores?.[alternativeIndex];
    } else if (contentType === 'humanized') {
      // This would need more logic if we had humanizedIndex
      return !!formState.copyResult.humanizedCopyScore;
    }
    return false;
  }

  // Check if the content already has a restyled version
  function hasRestyled(): boolean {
    if (!formState.copyResult) return false;
    
    if (contentType === 'improved') {
      // Check if there's a restyled improved copy with the SAME persona
      if (formState.copyResult.restyledImprovedVersions && formState.copyResult.restyledImprovedVersions.length > 0) {
        return formState.copyResult.restyledImprovedVersions.some(v => v.persona === localSelectedPersona);
      }
      return formState.copyResult.restyledImprovedCopy && 
             formState.copyResult.restyledImprovedCopyPersona === localSelectedPersona;
    } else if (contentType === 'alternative' && alternativeIndex !== undefined) {
      // Check if there's a restyled version for this specific alternative
      if (formState.copyResult.restyledAlternativeVersionCollections) {
        const collection = formState.copyResult.restyledAlternativeVersionCollections.find(
          c => c.alternativeIndex === alternativeIndex
        );
        if (collection) {
          return collection.versions.some(v => v.persona === localSelectedPersona);
        }
      }
      return formState.copyResult.restyledAlternativeVersions?.[alternativeIndex] && 
             formState.copyResult.restyledAlternativeVersionsPersonas?.[alternativeIndex] === localSelectedPersona;
    } else if (contentType === 'humanized') {
      // This would need more logic if we had humanizedIndex
      if (formState.copyResult.restyledHumanizedVersionCollections) {
        const collection = formState.copyResult.restyledHumanizedVersionCollections.find(
          c => c.humanizedIndex === 0
        );
        if (collection) {
          return collection.versions.some(v => v.persona === localSelectedPersona);
        }
      }
      return formState.copyResult.restyledHumanizedCopy && 
             formState.copyResult.restyledHumanizedCopyPersona === localSelectedPersona;
    }
    return false;
  }

  // Get loading states
  const isGeneratingAlternative = formState.isGeneratingAlternative || 
                                 (alternativeIndex !== undefined && formState.alternativeGenerationIndex === alternativeIndex);
  
  // Determine which restyled loading state to use based on content type
  const isGeneratingRestyled = contentType === 'improved' 
    ? formState.isGeneratingRestyledImproved 
    : contentType === 'alternative' 
      ? formState.isGeneratingRestyledAlternative
      : false;
      
  const isGeneratingScore = formState.isGeneratingScores;

  // No buttons to show
  if (!showAlternativeButton && !showRestyledButton && !showScoreButton) {
    return null;
  }

  return (
    <div className="mt-2">
      <div className="flex flex-col space-y-3">
        {showAlternativeButton && (
          <div className="border-t border-gray-200 dark:border-gray-800 pt-3">
            <h4 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Generate New Variations</h4>
            <div className="flex flex-wrap gap-2">
              {showAlternativeButton && (
                <Tooltip content="Generate an alternative approach with a different angle. This will create a new content block below with a fresh perspective.">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onGenerateAlternative()}
                    disabled={isGeneratingAlternative}
                    className="text-xs"
                  >
                    {isGeneratingAlternative ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-1" />
                        Generating Alternative...
                      </>
                    ) : (
                      <>
                        <Wand2 size={14} className="mr-1" />
                        Generate Alternative Version
                      </>
                    )}
                  </Button>
                </Tooltip>
              )}
            </div>
          </div>
        )}

        {(showRestyledButton || showScoreButton) && (
          <div className="border-t border-gray-200 dark:border-gray-800 pt-3">
            <h4 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Refine/Analyze This Content</h4>
            <div className="flex flex-wrap gap-2">
              <div className="w-full mb-2">
                <select
                  value={localSelectedPersona}
                  onChange={(e) => setLocalSelectedPersona(e.target.value)}
                  className="w-full bg-white dark:bg-black border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 p-2"
                >
                  <option value="">Select a voice style...</option>
                  {Object.entries(CATEGORIZED_VOICE_STYLES).map(([category, voices]) => (
                    <optgroup key={category} label={category}>
                      {voices.options.map((voiceOption) => (
                        <option key={voiceOption.value} value={voiceOption.value}>
                          {voiceOption.label}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
              
              {showRestyledButton && (
                <Tooltip content={`Apply ${formState.selectedPersona}'s distinctive voice style to this content. This will transform the current content to sound as if it was written by ${formState.selectedPersona}.`}>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onGenerateRestyled(contentType, alternativeIndex, undefined, localSelectedPersona)}
                    disabled={isGeneratingRestyled}
                    className="text-xs"
                  >
                    {isGeneratingRestyled ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-1" />
                        Applying Style...
                      </>
                    ) : (
                      <>  
                        <Sparkles size={14} className="mr-1" />
                        Apply {localSelectedPersona}'s Voice
                      </>
                    )}
                  </Button>
                </Tooltip>
              )}

              {showScoreButton && (
                <Tooltip content="Evaluate the quality of this content with detailed scores for clarity, persuasiveness, tone match, and engagement. This will add a scoring section below this content.">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onGenerateScore(contentType, alternativeIndex)}
                    disabled={isGeneratingScore}
                    className="text-xs"
                  >
                    {isGeneratingScore ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-1" />
                        Scoring...
                      </>
                    ) : (
                      <>
                        <BookCheck size={14} className="mr-1" />
                        Generate Score
                      </>
                    )}
                  </Button>
                </Tooltip>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OnDemandGeneration;