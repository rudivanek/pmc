import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useRef } from 'react';
import { toast } from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';
import CopyMakerForm from './CopyMakerForm';
import AppSpinner from './ui/AppSpinner';
import FloatingActionBar from './FloatingActionBar';
import GeneratedCopyCard from './GeneratedCopyCard';
import SaveTemplateModal from './SaveTemplateModal';
import { JsonLdModal } from './JsonLdModal';
import { FormState, User, GeneratedContentItem, GeneratedContentItemType, CopyResult, Template } from '../types';
import { generateCopy, generateContentScores, generateSeoMetadata, calculateGeoScore, generateAlternativeCopy, restyleCopyWithPersona } from '../services/apiService';
import { checkUserAccess, getTemplate, createTemplate, updateTemplate } from '../services/supabaseClient';
import { calculateTargetWordCount } from '../services/api/utils';

interface CopyMakerTabProps {
  currentUser?: User;
  formState: FormState;
  setFormState: (state: FormState) => void;
  onClearAll: () => void;
  loadedTemplateId: string | null;
  setLoadedTemplateId: (id: string | null) => void;
  loadedTemplateName: string;
  setLoadedTemplateName: (name: string) => void;
  isSmartMode: boolean;
  onEvaluateInputs?: () => void;
  onSaveTemplate?: () => void;
  onSaveOutput?: () => void;
  onViewPrompts?: () => void;
  onCancel?: () => void;
  loadFormStateFromTemplate: (template: Template) => void;
}

const CopyMakerTab: React.FC<CopyMakerTabProps> = ({
  currentUser,
  formState,
  setFormState,
  onClearAll,
  loadedTemplateId,
  setLoadedTemplateId,
  loadedTemplateName,
  setLoadedTemplateName,
  isSmartMode,
  onEvaluateInputs,
  onSaveTemplate,
  onSaveOutput,
  onViewPrompts,
  onCancel,
  loadFormStateFromTemplate
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [showJsonLdModal, setShowJsonLdModal] = useState(false);
  const [jsonLdContent, setJsonLdContent] = useState('');
  const [isTemplateEditingMode, setIsTemplateEditingMode] = useState(false);
  const [templateEditingData, setTemplateEditingData] = useState<{
    mode: 'add' | 'edit' | 'clone';
    templateId?: string;
    originalLabel?: string;
  } | null>(null);
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  
  // Refs for focusing on required fields
  const projectDescriptionRef = useRef<HTMLInputElement>(null);
  const businessDescriptionRef = useRef<HTMLTextAreaElement>(null);
  const originalCopyRef = useRef<HTMLTextAreaElement>(null);

  // Handle template mode from URL parameters
  React.useEffect(() => {
    const templateMode = searchParams.get('templateMode') as 'add' | 'edit' | 'clone' | null;
    const templateId = searchParams.get('templateId');

    if (templateMode && currentUser) {
      setIsTemplateEditingMode(true);
      setTemplateEditingData({ mode: templateMode, templateId });

      // If editing or cloning, load the template data
      if ((templateMode === 'edit' || templateMode === 'clone') && templateId) {
        loadTemplateData(templateId, templateMode === 'clone');
      } else if (templateMode === 'add') {
        // Clear form for new template
        setFormState(prev => ({
          ...prev,
          ...formState,
          copyResult: { generatedVersions: [] }
        }));
      }
    } else {
      setIsTemplateEditingMode(false);
      setTemplateEditingData(null);
    }
  }, [searchParams, currentUser]);

  // Function to load template data
  const loadTemplateData = async (templateId: string, isClone: boolean = false) => {
    try {
      const { data: template, error } = await getTemplate(templateId);
      if (error) throw error;
      
      if (template) {
        loadFormStateFromTemplate(template);
        setTemplateEditingData(prev => ({
          ...prev!,
          originalLabel: isClone ? `${template.template_name} (Clone)` : template.template_name
        }));
        
        if (isClone) {
          toast.success(`Cloned "${template.template_name}" - edit and save as new template`);
        } else {
          toast.success(`Loaded "${template.template_name}" for editing`);
        }
      }
    } catch (error: any) {
      console.error('Error loading template:', error);
      toast.error(`Failed to load template: ${error.message}`);
      // Reset template mode on error
      setSearchParams({});
      setIsTemplateEditingMode(false);
      setTemplateEditingData(null);
    }
  };

  // Handle saving template
  const handleSaveTemplate = async (templateName: string, category: string, isPublic: boolean, description?: string) => {
    if (!currentUser?.id) {
      toast.error('You must be logged in to save templates.');
      return;
    }

    try {
      const templateData = {
        user_id: currentUser.id,
        template_name: templateName,
        category,
        is_public: isPublic,
        form_state_snapshot: formState,
        description: description || `Template created from Copy Maker session`
      };

      if (templateEditingData?.mode === 'edit' && templateEditingData.templateId) {
        // Update existing template
        const { error } = await updateTemplate({
          id: templateEditingData.templateId,
          ...templateData
        });
        if (error) throw error;
        toast.success('Template updated successfully!');
      } else {
        // Create new template (add or clone)
        const { error } = await createTemplate(templateData);
        if (error) throw error;
        toast.success(templateEditingData?.mode === 'clone' ? 'Template cloned successfully!' : 'Template created successfully!');
      }

      // Navigate back to manage templates
      navigate('/manage-templates');
    } catch (error: any) {
      console.error('Error saving template:', error);
      toast.error(`Failed to save template: ${error.message}`);
    }
  };

  // Handle canceling template editing
  const handleCancelTemplateEditing = () => {
    if (window.confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
      navigate('/manage-templates');
    }
  };

  // Add progress message callback
  const addProgressMessage = React.useCallback((message: string) => {
    setFormState(prevState => ({
      ...prevState,
      generationProgress: [...prevState.generationProgress, message]
    }));
  }, [setFormState]);

  // Handle initial copy generation
  const handleGenerate = async () => {
    // Validate required fields before proceeding
    if (!formState.projectDescription?.trim()) {
      toast.error('Project Description is required. Please describe your project for organization.');
      projectDescriptionRef.current?.focus();
      return;
    }
    
    if (formState.tab === 'create' && !formState.businessDescription?.trim()) {
      toast.error('Business Description is required. Please describe your business or product.');
      businessDescriptionRef.current?.focus();
      return;
    }
    
    if (formState.tab === 'improve' && !formState.originalCopy?.trim()) {
      toast.error('Original Copy is required. Please provide the copy you want to improve.');
      originalCopyRef.current?.focus();
      return;
    }
    
    if (!currentUser) {
      toast.error('Please log in to generate copy.');
      return;
    }

    // Check user access before generation
    try {
      const accessResult = await checkUserAccess(currentUser.id, currentUser.email || '');
      
      if (!accessResult.hasAccess) {
        toast.error(accessResult.message);
        return;
      }
    } catch (error) {
      console.error('Error checking user access for generation:', error);
      toast.error("Unable to verify access. Please try again.");
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
      // Generate initial copy
      const result = await generateCopy(formState, currentUser, formState.sessionId, addProgressMessage);
      const improvedCopyItem: GeneratedContentItem = {
        id: uuidv4(),
        type: GeneratedContentItemType.Improved,
        content: result.improvedCopy,
        generatedAt: new Date().toISOString(),
        sourceDisplayName: 'Generated Copy 1'
      };

      // Add GEO score if it was generated
      if (result.geoScore) {
        improvedCopyItem.geoScore = result.geoScore;
      }

      // Add SEO metadata if it was generated
      if (result.seoMetadata) {
        improvedCopyItem.seoMetadata = result.seoMetadata;
      }

      // Generate score for improved copy if enabled
      if (formState.generateScores) {
        addProgressMessage('Generating score for copy...');
        const score = await generateContentScores(
          result.improvedCopy,
          'Generated Copy',
          formState.model,
          currentUser,
          formState.tab === 'improve' ? formState.originalCopy : formState.businessDescription,
          calculateTargetWordCount(formState).target,
          addProgressMessage
        );
        improvedCopyItem.score = score;
        addProgressMessage('Score generated.');
      }

      // Add FAQ schema if it was generated
      if (result.faqSchema) {
        improvedCopyItem.faqSchema = result.faqSchema;
      }

      setFormState(prev => ({
        ...prev,
        copyResult: {
          improvedCopy: result.improvedCopy, // Keep for backward compatibility
          generatedVersions: [improvedCopyItem]
        }
      }));
      addProgressMessage('Copy generation complete.');
      toast.success('Copy generated successfully!');
    } catch (error: any) {
      console.error('Error generating copy:', error);
      toast.error(`Failed to generate copy: ${error.message}`);
    } finally {
      setFormState(prev => ({ ...prev, isLoading: false }));
    }
  };

  // Handle on-demand generation for content cards
  const handleOnDemandGeneration = async (
    actionType: 'alternative' | 'score' | 'restyle',
    sourceItem: GeneratedContentItem,
    selectedPersona?: string
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
        
        // Generate SEO metadata if enabled
        if (formState.generateSeoMetadata) {
          addProgressMessage('Generating SEO metadata for alternative content...');
          try {
            const seoMetadata = await generateSeoMetadata(newItem.content, formState, currentUser, addProgressMessage);
            newItem.seoMetadata = seoMetadata;
            addProgressMessage('SEO metadata generated for alternative content.');
          } catch (seoError) {
            console.error('Error generating SEO metadata for alternative:', seoError);
            addProgressMessage('Error generating SEO metadata for alternative, continuing...');
          }
        }
        
        // Generate content scores if enabled
        if (formState.generateScores) {
          addProgressMessage('Generating score for alternative content...');
          try {
            const score = await generateContentScores(
              newItem.content,
              newItem.sourceDisplayName || newItem.type,
              formState.model,
              currentUser,
              sourceItem.content,
              calculateTargetWordCount(formState).target,
              addProgressMessage
            );
            newItem.score = score;
            addProgressMessage('Score generated for alternative content.');
          } catch (scoreError) {
            console.error('Error generating score for alternative:', scoreError);
            addProgressMessage('Error generating score for alternative, continuing...');
          }
        }
        
        // Generate GEO score if enabled
        if (formState.generateGeoScore) {
          addProgressMessage('Calculating GEO score for alternative content...');
          try {
            const geoScore = await calculateGeoScore(newItem.content, formState, currentUser, addProgressMessage);
            newItem.geoScore = geoScore;
            addProgressMessage('GEO score calculated for alternative content.');
          } catch (geoError) {
            console.error('Error calculating GEO score for alternative:', geoError);
            addProgressMessage('Error calculating GEO score for alternative, continuing...');
          }
        }
      } else if (actionType === 'restyle' && selectedPersona) {
        addProgressMessage(`Applying ${selectedPersona}'s voice to ${sourceItem.sourceDisplayName || sourceItem.type}...`);
        const { content: restyledContent, personaUsed } = await restyleCopyWithPersona(
          sourceItem.content,
          selectedPersona,
          formState.model,
          currentUser,
          formState.language,
          formState,
          targetWordCount.target,
          addProgressMessage
        );

        newItem = {
          id: uuidv4(),
          type: GeneratedContentItemType.RestyledImproved,
          content: restyledContent,
          persona: personaUsed,
          generatedAt: new Date().toISOString(),
          sourceId: sourceItem.id,
          sourceType: sourceItem.type,
          sourceDisplayName: `${personaUsed}'s Voice from ${sourceItem.sourceDisplayName || sourceItem.type}`
        };
        addProgressMessage(`Applied ${personaUsed}'s voice style.`);
        
        // Generate SEO metadata if enabled
        if (formState.generateSeoMetadata) {
          addProgressMessage(`Generating SEO metadata for ${personaUsed}'s voice content...`);
          try {
            const seoMetadata = await generateSeoMetadata(newItem.content, formState, currentUser, addProgressMessage);
            newItem.seoMetadata = seoMetadata;
            addProgressMessage(`SEO metadata generated for ${personaUsed}'s voice content.`);
          } catch (seoError) {
            console.error(`Error generating SEO metadata for ${personaUsed}'s voice:`, seoError);
            addProgressMessage(`Error generating SEO metadata for ${personaUsed}'s voice, continuing...`);
          }
        }
        
        // Generate content scores if enabled
        if (formState.generateScores) {
          addProgressMessage(`Generating score for ${personaUsed}'s voice content...`);
          try {
            const score = await generateContentScores(
              newItem.content,
              newItem.sourceDisplayName || newItem.type,
              formState.model,
              currentUser,
              sourceItem.content,
              targetWordCount.target,
              addProgressMessage
            );
            newItem.score = score;
            addProgressMessage(`Score generated for ${personaUsed}'s voice content.`);
          } catch (scoreError) {
            console.error(`Error generating score for ${personaUsed}'s voice:`, scoreError);
            addProgressMessage(`Error generating score for ${personaUsed}'s voice, continuing...`);
          }
        }
        
        // Generate GEO score if enabled
        if (formState.generateGeoScore) {
          addProgressMessage(`Calculating GEO score for ${personaUsed}'s voice content...`);
          try {
            const geoScore = await calculateGeoScore(newItem.content, formState, currentUser, addProgressMessage);
            newItem.geoScore = geoScore;
            addProgressMessage(`GEO score calculated for ${personaUsed}'s voice content.`);
          } catch (geoError) {
            console.error(`Error calculating GEO score for ${personaUsed}'s voice:`, geoError);
            addProgressMessage(`Error calculating GEO score for ${personaUsed}'s voice, continuing...`);
          }
        }
      } else if (actionType === 'score') {
        addProgressMessage(`Generating score for ${sourceItem.sourceDisplayName || sourceItem.type}...`);
        const score = await generateContentScores(
          sourceItem.content,
          sourceItem.sourceDisplayName || sourceItem.type,
          formState.model,
          currentUser,
          undefined,
          targetWordCount.target,
          addProgressMessage
        );
        // Update the existing item with the score
        setFormState(prev => ({
          ...prev,
          copyResult: {
            ...prev.copyResult,
            generatedVersions: prev.copyResult?.generatedVersions?.map(item =>
              item.id === sourceItem.id ? { ...item, score: score } : item
            ) || []
          }
        }));
        addProgressMessage('Score generated.');
        toast.success('Score generated successfully!');
        return; // Exit early as we updated an existing item
      }

      // Add the new item to the generated versions
      if (newItem) {
        setFormState(prev => ({
          ...prev,
          copyResult: {
            ...prev.copyResult,
            generatedVersions: [...(prev.copyResult?.generatedVersions || []), newItem]
          }
        }));
        addProgressMessage(`${actionType} generation complete.`);
        toast.success(`${actionType} generated successfully!`);
      }
    } catch (error: any) {
      console.error(`Error generating ${actionType}:`, error);
      toast.error(`Failed to generate ${actionType}: ${error.message}`);
    } finally {
      setFormState(prev => ({ ...prev, isLoading: false }));
    }
  };

  // Handle FAQ schema generation
  const handleGenerateFaqSchema = async (content: string) => {
    if (!currentUser) {
      toast.error('Please log in to generate FAQ schema.');
      return;
    }

    try {
      const accessResult = await checkUserAccess(currentUser.id, currentUser.email || '');
      
      if (!accessResult.hasAccess) {
        toast.error(accessResult.message);
        return;
      }
    } catch (error) {
      console.error('Error checking user access for FAQ schema generation:', error);
      toast.error("Unable to verify access. Please try again.");
      return;
    }

    setFormState(prev => ({ ...prev, isLoading: true, generationProgress: [] }));
    addProgressMessage('Generating FAQ schema...');

    try {
      // Generate FAQ schema (you'll need to implement this function)
      const faqSchema = await generateSeoMetadata(content, formState.model, currentUser, addProgressMessage);
      setJsonLdContent(JSON.stringify(faqSchema, null, 2));
      setShowJsonLdModal(true);
      addProgressMessage('FAQ schema generated.');
      toast.success('FAQ schema generated successfully!');
    } catch (error: any) {
      console.error('Error generating FAQ schema:', error);
      toast.error(`Failed to generate FAQ schema: ${error.message}`);
    } finally {
      setFormState(prev => ({ ...prev, isLoading: false }));
    }
  };

  // Handle cancel operation
  const handleCancelOperation = () => {
    setFormState(prev => ({ 
      ...prev, 
      isLoading: false, 
      isEvaluating: false,
      generationProgress: []
    }));
    toast.info('Operation cancelled.');
  };

  return (
    <div className="relative min-h-screen">
      {/* Main Content Layout */}
      <div className="space-y-8">
        {/* Form Section */}
        <div>
          <CopyMakerForm
            currentUser={currentUser}
            formState={formState}
            setFormState={setFormState}
            onGenerate={isPrefillEditingMode ? undefined : handleGenerate}
            onClearAll={onClearAll}
            loadedTemplateId={loadedTemplateId}
            setLoadedTemplateId={setLoadedTemplateId}
            loadedTemplateName={loadedTemplateName}
            setLoadedTemplateName={setLoadedTemplateName}
            isSmartMode={isSmartMode}
            onEvaluateInputs={onEvaluateInputs}
            onSaveTemplate={onSaveTemplate}
            projectDescriptionRef={projectDescriptionRef}
            businessDescriptionRef={businessDescriptionRef}
            originalCopyRef={originalCopyRef}
            isTemplateEditingMode={isTemplateEditingMode}
          />
          
          {/* Template Action Buttons */}
          {isTemplateEditingMode && (
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => setShowSaveTemplateModal(true)}
                className="w-full bg-primary-600 hover:bg-primary-500 text-white font-medium text-base px-5 py-3.5 transition-colors flex items-center justify-center"
              >
                Save Template
              </button>
              <button
                onClick={handleCancelTemplateEditing}
                className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 font-medium text-base px-5 py-3 transition-colors flex items-center justify-center"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Results Section */}
        <div>
          {formState.copyResult?.generatedVersions && formState.copyResult.generatedVersions.length > 0 ? (
            <div className="bg-white dark:bg-black border border-gray-300 dark:border-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Generated Copies</h2>
              
              <div className="space-y-6">
                {formState.copyResult.generatedVersions.map((card, index) => (
                  <GeneratedCopyCard
                    key={card.id}
                    card={card}
                    formState={formState}
                    currentUser={currentUser}
                    onCreateAlternative={() => handleOnDemandGeneration('alternative', card)}
                    onApplyVoiceStyle={(persona) => handleOnDemandGeneration('restyle', card, persona)}
                    onGenerateScore={() => handleOnDemandGeneration('score', card)}
                    onGenerateFaqSchema={handleGenerateFaqSchema}
                    targetWordCount={calculateTargetWordCount(formState).target}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-black border border-gray-300 dark:border-gray-800 rounded-lg p-6 text-center text-gray-500 dark:text-gray-400">
              <div className="text-lg font-medium mb-2">No content generated yet</div>
              <p className="text-sm">Fill out the form and click "Make Copy" to get started</p>
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Bar - Right Side */}
      {formState.copyResult?.generatedVersions && formState.copyResult.generatedVersions.length > 0 && (
        <FloatingActionBar
          formState={formState}
          generatedOutputCards={formState.copyResult.generatedVersions}
          currentUser={currentUser}
          onSaveOutput={onSaveOutput || (() => toast.info('Save output not available'))}
          onViewPrompts={onViewPrompts || (() => toast.info('View prompts not available'))}
          onGenerateFaqSchema={handleGenerateFaqSchema}
        />
      )}

      {/* Progress Modal */}
      <AppSpinner
        isLoading={formState.isLoading || formState.isEvaluating}
        message={formState.isLoading ? "Generating copy..." : "Evaluating inputs..."}
        progressMessages={formState.generationProgress}
        onCancel={onCancel || handleCancelOperation}
      />

      {/* Save Template Modal */}
      {showSaveTemplateModal && templateEditingData && (
        <SaveTemplateModal
          isOpen={showSaveTemplateModal}
          onClose={() => setShowSaveTemplateModal(false)}
          onSave={handleSaveTemplate}
          mode={templateEditingData.mode}
          initialLabel={templateEditingData.originalLabel || ''}
          currentUser={currentUser}
        />
      )}

      {/* JSON-LD Modal */}
      {showJsonLdModal && (
        <JsonLdModal
          isOpen={showJsonLdModal}
          onClose={() => setShowJsonLdModal(false)}
          jsonLd={jsonLdContent}
        />
      )}
    </div>
  );
};

export default CopyMakerTab;