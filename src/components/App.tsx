import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid'; // Import uuid
import {
  FormState,
  CopyResult,
  PromptEvaluation,
  User,
  GeneratedContentItem,
  GeneratedContentItemType,
  ScoreData,
  StructuredCopyOutput
} from '../types';
import {
  generateCopy,
  generateAlternativeCopy,
  generateSeoMetadata,
  evaluatePrompt,
  generateContentScores,
  restyleCopyWithPersona,
} from '../services/apiService';
import {
  saveCopySession,
  updateCopySessionField,
  saveTemplate,
  saveSavedOutput,
} from '../services/supabaseClient';
import { DEFAULT_FORM_STATE } from '../constants';
import Header from './Header';
import CopyForm from './CopyForm';
import ResultsSection from './results/ResultsSection';
import AppSpinner from './ui/AppSpinner';
import SaveTemplateModal from './SaveTemplateModal';
import { useAuth } from '../hooks/useAuth';
import useFormState from '../hooks/useFormState';
import { useMode } from '../context/ModeContext';
import CopyMakerTab from './CopyMakerTab';
import { calculateTargetWordCount } from '../services/api/utils';

interface AppProps {
  onViewPrompts: () => void;
}

const App: React.FC<AppProps> = ({ onViewPrompts }) => {
  const { currentUser, isInitialized, initError, fallbackToDemoMode } = useAuth();
  const { formState, setFormState, loadFormStateFromTemplate, loadFormStateFromSession, loadFormStateFromSavedOutput } = useFormState();
  const { isSmartMode } = useMode();

  const [loadedTemplateId, setLoadedTemplateId] = useState<string | null>(null);
  const [loadedTemplateName, setLoadedTemplateName] = useState<string>('');
  const [isSaveTemplateModalOpen, setIsSaveTemplateModalOpen] = useState(false);
  const addProgressMessage = useCallback((message: string) => {
    setFormState(prevState => ({
      ...prevState,
      generationProgress: [...prevState.generationProgress, message]
    }));
  }, [setFormState]);

  // Handle initial copy generation
  const handleGenerate = async () => {
    if (!currentUser) {
      toast.error('Please log in to generate copy.');
      return;
    }

    setFormState(prev => ({
      ...prev,
      isLoading: true,
      generationProgress: [],
      copyResult: {
        ...prev.copyResult,
        generatedVersions: [] // Clear previous results
      }
    }));
    addProgressMessage('Starting copy generation...');

    try {
      // Generate initial improved copy
      const result = await generateCopy(formState, currentUser, formState.sessionId, addProgressMessage);
      const improvedCopyItem: GeneratedContentItem = {
        id: uuidv4(),
        type: GeneratedContentItemType.Improved,
        content: result.improvedCopy,
        generatedAt: new Date().toISOString(),
        sourceDisplayName: 'Initial Generation'
      };

      // Add GEO score if it was generated
      if (result.geoScore) {
        improvedCopyItem.geoScore = result.geoScore;
      }

      // Generate score for improved copy if enabled
      if (formState.generateScores) {
        addProgressMessage('Generating score for improved copy...');
        const score = await generateContentScores(
          result.improvedCopy,
          'Improved Copy',
          formState.model,
          formState.tab === 'improve' ? formState.originalCopy : formState.businessDescription,
          calculateTargetWordCount(formState),
          addProgressMessage
        );
        improvedCopyItem.score = score;
        addProgressMessage('Score for improved copy generated.');
      }

      setFormState(prev => ({
        ...prev,
        copyResult: {
          ...prev.copyResult,
          improvedCopy: result.improvedCopy, // Keep for backward compatibility
          generatedVersions: [...prev.copyResult.generatedVersions, improvedCopyItem]
        }
      }));
      addProgressMessage('Improved copy generated.');

      // Generate alternative versions if enabled
      if (formState.generateAlternative && formState.numberOfAlternativeVersions && formState.numberOfAlternativeVersions > 0) {
        for (let i = 0; i < formState.numberOfAlternativeVersions; i++) {
          addProgressMessage(`Generating alternative version ${i + 1}...`);
          const alternativeContent = await generateAlternativeCopy(formState, result.improvedCopy, formState.sessionId, addProgressMessage);
          const alternativeItem: GeneratedContentItem = {
            id: uuidv4(),
            type: GeneratedContentItemType.Alternative,
            content: alternativeContent,
            generatedAt: new Date().toISOString(),
            sourceId: improvedCopyItem.id,
            sourceType: GeneratedContentItemType.Improved,
            sourceIndex: i, // Use index for alternative versions
            sourceDisplayName: `Alternative Version ${i + 1} from Standard Version`
          };

          if (formState.generateScores) {
            addProgressMessage(`Generating score for alternative version ${i + 1}...`);
            const score = await generateContentScores(
              alternativeContent,
              `Alternative Copy ${i + 1}`,
              formState.model,
              result.improvedCopy,
              calculateTargetWordCount(formState),
              addProgressMessage
            );
            alternativeItem.score = score;
            addProgressMessage(`Score for alternative version ${i + 1} generated.`);
          }

          setFormState(prev => ({
            ...prev,
            copyResult: {
              ...prev.copyResult,
              generatedVersions: [...prev.copyResult.generatedVersions, alternativeItem]
            }
          }));
          addProgressMessage(`Alternative version ${i + 1} generated.`);
        }
      }

      // Generate headlines if enabled
      if (formState.generateSeoMetadata) {
        addProgressMessage('Generating SEO metadata...');
        const seoMetadata = await generateSeoMetadata(result.improvedCopy, formState, addProgressMessage);
        const seoMetadataCard: GeneratedContentItem = {
          id: uuidv4(),
          type: GeneratedContentItemType.SeoMetadata,
          content: 'SEO Metadata Generated',
          seoMetadata: seoMetadata,
          generatedAt: new Date().toISOString(),
          sourceId: improvedCopyItem.id,
          sourceType: GeneratedContentItemType.Improved,
          sourceDisplayName: 'SEO Metadata for Generated Copy 1'
        };

        setFormState(prev => ({
          ...prev,
          copyResult: {
            ...prev.copyResult,
            generatedVersions: [...prev.copyResult.generatedVersions, seoMetadataCard]
          }
        }));
        addProgressMessage('SEO metadata generated.');
      }

      toast.success('Copy generated successfully!');
    } catch (error: any) {
      console.error('Error generating copy:', error);
      toast.error(`Failed to generate copy: ${error.message}`);
    } finally {
      setFormState(prev => ({ ...prev, isLoading: false }));
      addProgressMessage('Copy generation complete.');
    }
  };

  // Handle generating restyled content
  const handleGenerateRestyled = async (
    contentType: 'improved' | 'alternative' | 'humanized',
    sourceItem: GeneratedContentItem,
    selectedPersona: string
  ) => {
    // Use the unified on-demand generation function
    await handleOnDemandGeneration('restyle', sourceItem, selectedPersona);
  };

  // Handle generating restyled headlines
  const handleGenerateRestyledHeadlines = async (sourceItem: GeneratedContentItem, persona: string) => {
    if (!formState.copyResult || !Array.isArray(sourceItem.content) || sourceItem.content.length === 0) {
      toast.error('Please generate headlines first');
      return;
    }

    setFormState(prev => ({ ...prev, isGeneratingRestyledHeadlines: true }));

    try {
      const { content: restyledHeadlines, personaUsed } = await restyleCopyWithPersona(
        sourceItem.content,
        persona,
        formState.model,
        formState.language,
        formState,
        undefined,
        addProgressMessage,
        sourceItem.content.length // Pass original number of headlines
      );

      const restyledHeadlinesItem: GeneratedContentItem = {
        id: uuidv4(),
        type: GeneratedContentItemType.RestyledHeadlines,
        content: restyledHeadlines as string[],
        persona: personaUsed,
        generatedAt: new Date().toISOString(),
        sourceId: sourceItem.id,
        sourceType: GeneratedContentItemType.Headlines,
        sourceDisplayName: `${personaUsed}'s Voice from Headlines`
      };

      setFormState(prev => ({
        ...prev,
        copyResult: {
          ...prev.copyResult,
          generatedVersions: [...prev.copyResult.generatedVersions, restyledHeadlinesItem]
        }
      }));

      addProgressMessage(`Applied ${personaUsed}'s voice style to headlines`);
      toast.success(`Applied ${personaUsed}'s voice style to headlines`);
    } catch (error) {
      console.error('Error generating restyled headlines:', error);
      toast.error('Failed to apply voice style to headlines. Please try again.');
    } finally {
      setFormState(prev => ({ ...prev, isGeneratingRestyledHeadlines: false }));
    }
  };

  // New function to handle on-demand generation for any content item
  const handleOnDemandGeneration = async (
    actionType: 'alternative' | 'score' | 'restyle',
    sourceItem: GeneratedContentItem,
    selectedPersona?: string // Only for restyle action
  ) => {
    if (!currentUser) {
      toast.error('Please log in to generate copy.');
      return;
    }

    // Check user access before on-demand generation
    try {
      const accessResult = await checkUserAccess(currentUser.id, currentUser.email || '');
      
      if (!accessResult.hasAccess) {
        toast.error(accessResult.message);
        return;
      }
    } catch (error) {
      console.error('Error checking user access for on-demand generation:', error);
      toast.error("Unable to verify access. Please try again.");
      return;
    }

    setFormState(prev => ({ ...prev, isLoading: true, generationProgress: [] }));
    addProgressMessage(`Starting ${actionType} generation...`);

    try {
      const targetWordCount = calculateTargetWordCount(formState);
      let newItem: GeneratedContentItem | null = null;

      if (actionType === 'alternative') {
        addProgressMessage(`Generating alternative version of ${sourceItem.sourceDisplayName || sourceItem.type}...`);
        const alternativeContent = await generateAlternativeCopy(formState, sourceItem.content, currentUser, formState.sessionId, addProgressMessage);
        newItem = {
          id: uuidv4(),
          type: GeneratedContentItemType.Alternative,
          content: alternativeContent,
          generatedAt: new Date().toISOString(),
          sourceId: sourceItem.id,
          sourceType: sourceItem.type,
          sourceDisplayName: `Alternative from ${sourceItem.sourceDisplayName || sourceItem.type}`
        };
        addProgressMessage('Alternative version generated.');
      } else if (actionType === 'restyle' && selectedPersona) {
        // Special handling for "Humanize" persona
        if (selectedPersona === 'Humanize') {
          addProgressMessage(`Humanizing ${sourceItem.sourceDisplayName || sourceItem.type}...`);
          
          // Use the dedicated humanization function
          const { generateHumanizedCopy } = await import('../services/api/humanizedCopy');
          const humanizedContent = await generateHumanizedCopy(
            sourceItem.content,
            formState,
            currentUser,
            addProgressMessage
          );
          
          newItem = {
            id: uuidv4(),
            type: GeneratedContentItemType.Humanized,
            content: humanizedContent,
            persona: 'Humanize',
            generatedAt: new Date().toISOString(),
            sourceId: sourceItem.id,
            sourceType: sourceItem.type,
            sourceDisplayName: `Humanized from ${sourceItem.sourceDisplayName || sourceItem.type}`
          };
          
          addProgressMessage('Humanization complete.');
        } else {
          addProgressMessage(`Applying ${selectedPersona}'s voice to ${sourceItem.sourceDisplayName || sourceItem.type}...`);
          const { content: restyledContent, personaUsed } = await restyleCopyWithPersona(
            sourceItem.content,
            selectedPersona,
            formState.model,
            currentUser,
            formState.language,
            formState,
            targetWordCount,
            addProgressMessage,
            sourceItem.type === GeneratedContentItemType.Headlines ? (sourceItem.content as string[]).length : undefined
          );

          newItem = {
            id: uuidv4(),
            type: GeneratedContentItemType.RestyledImproved, // Default, will be updated
            content: restyledContent,
            persona: personaUsed,
            generatedAt: new Date().toISOString(),
            sourceId: sourceItem.id,
            sourceType: sourceItem.type,
            sourceDisplayName: `${personaUsed}'s Voice from ${sourceItem.sourceDisplayName || sourceItem.type}`
          };

          // Determine the correct type for the restyled item
          if (sourceItem.type === GeneratedContentItemType.Improved) {
            newItem.type = GeneratedContentItemType.RestyledImproved;
          } else if (sourceItem.type === GeneratedContentItemType.Alternative) {
            newItem.type = GeneratedContentItemType.RestyledAlternative;
          } else if (sourceItem.type === GeneratedContentItemType.Headlines) {
            newItem.type = GeneratedContentItemType.RestyledHeadlines;
          }
          
          addProgressMessage(`Applied ${personaUsed}'s voice style.`);
        }
      } else if (actionType === 'score') {
        addProgressMessage(`Generating score for ${sourceItem.sourceDisplayName || sourceItem.type}...`);
        
        // Check if the content exists before attempting to score it
        if (!sourceItem.content) {
          console.error('No content found to score:', sourceItem);
          toast.error('No content found to score. Please try regenerating the content first.');
          setFormState(prev => ({ ...prev, isLoading: false }));
          addProgressMessage('Error: No content found to score.');
          return;
        }
        
        const score = await generateContentScores(
          sourceItem.content,
          sourceItem.sourceDisplayName || sourceItem.type,
          formState.model,
          currentUser,
          sourceItem.sourceId ? formState.copyResult?.generatedVersions.find(v => v.id === sourceItem.sourceId)?.content : undefined,
          targetWordCount,
          addProgressMessage
        );
        // Update the existing item with the score
        setFormState(prev => ({
          ...prev,
          copyResult: {
            ...prev.copyResult,
            generatedVersions: prev.copyResult.generatedVersions.map(item =>
              item.id === sourceItem.id ? { ...item, score: score } : item
            )
          }
        }));
        addProgressMessage('Score generated.');
        toast.success('Score generated successfully!');
        return; // Exit early as we updated an existing item
      }

      if (newItem) {
        // Generate score for the new item if enabled
        if (formState.generateScores) {
          addProgressMessage(`Generating score for ${newItem.persona || 'new'} content...`);
          const score = await generateContentScores(
            newItem.content,
            newItem.sourceDisplayName || newItem.type,
            formState.model,
            currentUser,
            sourceItem.content,
            targetWordCount,
            addProgressMessage
          );
          newItem.score = score;
          addProgressMessage(`Score for ${newItem.persona || 'new'} content generated.`);
        }
        
        // Generate GEO score if enabled
        if (formState.generateGeoScore) {
          addProgressMessage(`Calculating GEO score for ${newItem.persona || 'new'} content...`);
          try {
            const { calculateGeoScore } = await import('../services/api/geoScoring');
            const geoScore = await calculateGeoScore(
              newItem.content,
              formState,
              currentUser,
              addProgressMessage
            );
            newItem.geoScore = geoScore;
            addProgressMessage(`GEO score for ${newItem.persona || 'new'} content calculated.`);
          } catch (geoError) {
            console.error('Error calculating GEO score for new content:', geoError);
            addProgressMessage('Error calculating GEO score for new content.');
          }
        }
        
        setFormState(prev => ({
          ...prev,
          copyResult: {
            ...prev.copyResult,
            generatedVersions: [...prev.copyResult.generatedVersions, newItem]
          }
        }));
        
        const successMessage = selectedPersona === 'Humanize' 
          ? 'Content humanized successfully!'
          : `${actionType} version generated successfully!`;
        toast.success(successMessage);
      }
    } catch (error: any) {
      console.error(`Error during on-demand ${actionType} generation:`, error);
      toast.error(`Failed to generate ${actionType} version: ${error.message}`);
    } finally {
      setFormState(prev => ({ ...prev, isLoading: false }));
      addProgressMessage('On-demand generation complete.');
    }
  };

  const handleClearAll = useCallback(() => {
    setFormState(DEFAULT_FORM_STATE);
    setLoadedTemplateId(null);
    setLoadedTemplateName('');
    toast.success('Form cleared!');
  }, [setFormState]);

  const handleEvaluateInputs = async () => {
    if (!currentUser) {
      toast.error('Please log in to evaluate inputs.');
      return;
    }
    setFormState(prev => ({ ...prev, isEvaluating: true, generationProgress: [] }));
    addProgressMessage('Evaluating inputs...');
    try {
      const evaluation = await evaluatePrompt(formState, currentUser, addProgressMessage);
      setFormState(prev => ({ ...prev, promptEvaluation: evaluation }));
      toast.success('Inputs evaluated successfully!');
    } catch (error: any) {
      console.error('Error evaluating inputs:', error);
      toast.error(`Failed to evaluate inputs: ${error.message}`);
    } finally {
      setFormState(prev => ({ ...prev, isEvaluating: false }));
      addProgressMessage('Input evaluation complete.');
    }
  };

  const handleSaveOutput = async () => {
    if (!currentUser || !currentUser.id) {
      toast.error('You must be logged in to save outputs.');
      return;
    }
    if (!formState.copyResult || formState.copyResult.generatedVersions.length === 0) {
      toast.error('No content to save.');
      return;
    }

    setFormState(prev => ({ ...prev, isLoading: true }));
    addProgressMessage('Saving output...');

    try {
      const savedOutput = {
        user_id: currentUser.id,
        customer_id: formState.customerId || null,
        brief_description: formState.briefDescription || 'Untitled Output',
        language: formState.language,
        tone: formState.tone,
        model: formState.model,
        selected_persona: formState.selectedPersona || null,
        input_snapshot: formState, // Save the entire form state as a snapshot
        output_content: formState.copyResult, // Save the entire copyResult
        saved_at: new Date().toISOString(),
      };

      const { data, error } = await saveSavedOutput(savedOutput);

      if (error) throw error;

      toast.success('Output saved successfully!');
      addProgressMessage('Output saved to dashboard.');
    } catch (error: any) {
      console.error('Error saving output:', error);
      toast.error(`Failed to save output: ${error.message}`);
    } finally {
      setFormState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleSaveTemplate = async (templateName: string, description: string, formStateToSave: FormState, forceSaveAsNew?: boolean) => {
    if (!currentUser || !currentUser.id) {
      toast.error('You must be logged in to save templates.');
      return;
    }

    setFormState(prev => ({ ...prev, isLoading: true }));
    addProgressMessage('Saving template...');

    try {
      const templateData = {
        user_id: currentUser.id,
        template_name: templateName,
        category: 'User Templates', // Default category
        description: description || `Template created from Copy Maker session`,
        form_state_snapshot: formStateToSave, // Save the entire form state
        template_type: formStateToSave.tab,
        language: formStateToSave.language,
        tone: formStateToSave.tone,
        word_count: formStateToSave.wordCount
        // Public template fields
        is_public: formStateToSave.is_public,
        public_name: formStateToSave.public_name,
        public_description: formStateToSave.public_description,
      };

      // If forceSaveAsNew is true, pass undefined to create a new template
      // Otherwise, use the loadedTemplateId to update existing template
      const templateIdToUse = forceSaveAsNew ? undefined : (loadedTemplateId || undefined);
      const { error, updated, id } = await saveTemplate(templateData, templateIdToUse);

      if (error) throw error;

      if (updated) {
        toast.success('Template updated successfully!');
        addProgressMessage('Template updated.');
      } else {
        toast.success('Template saved successfully!');
        addProgressMessage('Template saved.');
        setLoadedTemplateId(id || null); // Set the ID for the newly saved template
        setLoadedTemplateName(templateName);
      }
      setIsSaveTemplateModalOpen(false);
    } catch (error: any) {
      console.error('Error saving template:', error);
      toast.error(`Failed to save template: ${error.message}`);
    } finally {
      setFormState(prev => ({ ...prev, isLoading: false }));
    }
  };

  // Handle cancelling generation or evaluation
  const handleCancelOperation = () => {
    const isGenerating = formState.isLoading;
    const isEvaluating = formState.isEvaluating;
    
    const operationType = isGenerating ? 'copy generation' : 'input evaluation';
    
    // Show confirmation dialog
    if (window.confirm(`Are you sure you want to cancel the ${operationType}?`)) {
      setFormState(prev => ({
        ...prev,
        isLoading: false,
        isEvaluating: false,
        generationProgress: [...prev.generationProgress, `${operationType} cancelled by user.`]
      }));
      toast.success(`${operationType.charAt(0).toUpperCase() + operationType.slice(1)} cancelled`);
    }
  };

  const handleViewPrompts = () => {
    onViewPrompts();
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white flex flex-col overflow-x-hidden">
      <Header
        activeTab={formState.tab}
        setActiveTab={(tab) => setFormState(prev => ({ ...prev, tab }))}
      />
      <main className="flex-grow container mx-auto p-4 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {formState.tab === 'copyMaker' ? (
          // Copy Maker Tab - Full width layout
          <div className="lg:col-span-2">
            <CopyMakerTab
              currentUser={currentUser || undefined}
              formState={formState}
              setFormState={setFormState}
              onClearAll={handleClearAll}
              loadedTemplateId={loadedTemplateId}
              setLoadedTemplateId={setLoadedTemplateId}
              loadedTemplateName={loadedTemplateName}
              setLoadedTemplateName={setLoadedTemplateName}
              isSmartMode={isSmartMode}
              onEvaluateInputs={handleEvaluateInputs}
              onSaveTemplate={() => setIsSaveTemplateModalOpen(true)}
              onSaveOutput={handleSaveOutput}
              onViewPrompts={handleViewPrompts}
            />
          </div>
        ) : (
          // Original Copy Generator layout
          <>
            <div className="lg:col-span-1">
              <CopyForm
                currentUser={currentUser || undefined}
                formState={formState}
                setFormState={setFormState}
                onGenerate={handleGenerate}
                onClearAll={handleClearAll}
                loadedTemplateId={loadedTemplateId}
                setLoadedTemplateId={setLoadedTemplateId}
                loadedTemplateName={loadedTemplateName}
                setLoadedTemplateName={setLoadedTemplateName}
                isSmartMode={isSmartMode}
                onEvaluateInputs={handleEvaluateInputs}
                onSaveTemplate={() => setIsSaveTemplateModalOpen(true)}
              />
            </div>
            <div className="lg:col-span-1">
              <ResultsSection
                copyResult={formState.copyResult}
                promptEvaluation={formState.promptEvaluation}
                isLoading={formState.isLoading}
                isEvaluating={formState.isEvaluating}
                generationProgress={formState.generationProgress}
                onViewPrompts={onViewPrompts}
                onSaveOutput={handleSaveOutput}
                onGenerateAlternative={handleOnDemandGeneration}
                onGenerateRestyled={handleOnDemandGeneration}
                onGenerateScore={handleOnDemandGeneration}
                selectedPersona={formState.selectedPersona}
              />
            </div>
          </>
        )}
      </main>

      <AppSpinner
        isLoading={formState.isLoading || formState.isEvaluating}
        message={formState.isLoading ? "Generating copy..." : "Evaluating inputs..."}
        progressMessages={formState.generationProgress}
        onCancel={handleCancelOperation}
      />

      {isSaveTemplateModalOpen && (
        <SaveTemplateModal
          isOpen={isSaveTemplateModalOpen}
          onClose={() => setIsSaveTemplateModalOpen(false)}
          onSave={handleSaveTemplate}
          initialTemplateName={loadedTemplateName || formState.briefDescription || ''}
          initialDescription={formState.briefDescription || ''}
          formStateToSave={formState}
          onViewPrompts={onViewPrompts}
        />
      )}
    </div>
  );
};

export default App;