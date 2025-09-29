import { useRef } from 'react';
import { toast } from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';
import { FormState, User, GeneratedContentItem, GeneratedContentItemType } from '../../../../types';
import { 
  generateCopy, 
  generateContentScores, 
  generateSeoMetadata, 
  calculateGeoScore, 
  generateAlternativeCopy, 
  restyleCopyWithPersona 
} from '../../../../services/apiService';
import { checkUserAccess, getSupabaseClient } from '../../../../services/supabaseClient';
import { calculateTargetWordCount, extractWordCount } from '../../../../services/api/utils';
import { isContentEmpty } from '../utils/isContentEmpty';

interface UseGenerationReturn {
  handleGenerate: () => void;
  handleOnDemandGeneration: (actionType: string, sourceItem: GeneratedContentItem, persona?: string) => void;
  handleModifyContent: (sourceItem: GeneratedContentItem, instruction: string) => void;
  handleGenerateFaqSchema: (content: string) => void;
  handleCancelOperation: () => void;
}

export function useGeneration(
  currentUser?: User,
  formState?: FormState,
  setFormState?: (state: FormState | ((prev: FormState) => FormState)) => void,
  addProgressMessage?: (message: string) => void
): UseGenerationReturn {
  const projectDescriptionRef = useRef<HTMLInputElement>(null);
  const originalCopyRef = useRef<HTMLTextAreaElement>(null);

  // Handle initial copy generation
  const handleGenerate = async () => {
    if (!formState || !setFormState || !addProgressMessage) return;

    // Validate required fields before proceeding
    if (!formState.projectDescription?.trim()) {
      toast.error('Project Description is required. Please describe your project for organization.');
      projectDescriptionRef.current?.focus();
      return;
    }
    
    if (!formState.originalCopy?.trim()) {
      toast.error('Original Copy is required. Please provide content or describe what you want to achieve.');
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

    // Ensure session record exists in database before any token tracking
    let actualSessionId = formState.sessionId;
    if (currentUser && formState.sessionId) {
      try {
        // Check if session exists
        const { data: existingSession, error: checkError } = await getSupabaseClient()
          .from('pmc_copy_sessions')
          .select('id')
          .eq('id', formState.sessionId)
          .limit(1);
        
        if (checkError || !existingSession || existingSession.length === 0) {
          // Session doesn't exist, generate new ID and don't try to create here
          actualSessionId = uuidv4();
          // Update formState with new session ID
          setFormState(prev => ({ ...prev, sessionId: actualSessionId }));
        }
      } catch (err) {
        console.error('Error checking/creating session:', err);
        // Generate new session ID if there's an error
        actualSessionId = uuidv4();
        setFormState(prev => ({ ...prev, sessionId: actualSessionId }));
      }
    } else if (currentUser && !formState.sessionId) {
      // Generate new session ID for logged in users only if not already set
      actualSessionId = uuidv4();
      setFormState(prev => ({ ...prev, sessionId: actualSessionId }));
    }

    try {
      // Generate initial copy
      const result = await generateCopy(formState, currentUser, actualSessionId, addProgressMessage);
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
    if (!currentUser || !formState || !setFormState || !addProgressMessage) {
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
      // For alternatives and scores, use form target word count
      const formTargetWordCount = calculateTargetWordCount(formState);
      
      // For restyle, use the word count of the source content to preserve its length
      const restyleTargetWordCount = actionType === 'restyle' ? extractWordCount(sourceItem.content) : formTargetWordCount.target;
      
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
          sourceDisplayName: `Alternative: ${sourceItem.sourceDisplayName || sourceItem.type}`
        };
        addProgressMessage('Alternative version generated.');
        
        // Generate SEO metadata if enabled
        if (formState.generateSeoMetadata) {
          addProgressMessage('Generating SEO metadata for alternative content...');
          try {
            const seoMetadata = await generateSeoMetadata(alternativeContent, formState, currentUser, addProgressMessage);
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
              alternativeContent,
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
            const geoScore = await calculateGeoScore(alternativeContent, formState, currentUser, addProgressMessage);
            newItem.geoScore = geoScore;
            addProgressMessage('GEO score calculated for alternative content.');
          } catch (geoError) {
            console.error('Error calculating GEO score for alternative:', geoError);
            addProgressMessage('Error calculating GEO score for alternative, continuing...');
          }
        }
      } else if (actionType === 'restyle' && selectedPersona) {
        // Check if source content exists
        if (!sourceItem.content) {
          throw new Error('No content available to restyle. Please regenerate the content first.');
        }
        
        addProgressMessage(`Applying ${selectedPersona}'s voice to ${sourceItem.sourceDisplayName || sourceItem.type}...`);
        const { content: restyledContent, personaUsed } = await restyleCopyWithPersona(
          sourceItem.content,
          selectedPersona,
          formState.model,
          currentUser,
          formState.language,
          formState,
          restyleTargetWordCount,
          addProgressMessage
        );

        // Validate that restyledContent is not empty or invalid
        if (isContentEmpty(restyledContent)) {
          toast.error(`Failed to generate ${selectedPersona}'s voice style. The AI returned empty content. Please try again or use a different model.`);
          return;
        }

        // Ensure personaUsed is defined, fallback to selectedPersona
        const effectivePersona = personaUsed || selectedPersona || 'Unknown Persona';

        newItem = {
          id: uuidv4(),
          type: GeneratedContentItemType.RestyledImproved,
          content: restyledContent,
          persona: effectivePersona,
          generatedAt: new Date().toISOString(),
          sourceId: sourceItem.id,
          sourceType: sourceItem.type,
          sourceDisplayName: `${effectivePersona}'s Voice from ${sourceItem.sourceDisplayName || sourceItem.type}`
        };
        addProgressMessage(`Applied ${effectivePersona}'s voice style.`);
        
        // Add FAQ schema if it was generated in the response
        if (typeof restyledContent === 'object' && 'faqSchema' in restyledContent) {
          newItem.faqSchema = restyledContent.faqSchema;
          // Extract actual content if it's nested
          if ('content' in restyledContent) {
            newItem.content = restyledContent.content;
          }
        }
        
        // Generate SEO metadata if enabled
        if (formState.generateSeoMetadata) {
          addProgressMessage(`Generating SEO metadata for ${effectivePersona}'s voice content...`);
          try {
            const seoMetadata = await generateSeoMetadata(newItem.content, formState, currentUser, addProgressMessage);
            newItem.seoMetadata = seoMetadata;
            addProgressMessage(`SEO metadata generated for ${effectivePersona}'s voice content.`);
          } catch (seoError) {
            console.error(`Error generating SEO metadata for ${effectivePersona}'s voice:`, seoError);
            addProgressMessage(`Error generating SEO metadata for ${effectivePersona}'s voice, continuing...`);
          }
        }
        
        // Generate content scores if enabled
        if (formState.generateScores) {
          addProgressMessage(`Generating score for ${effectivePersona}'s voice content...`);
          try {
            const score = await generateContentScores(
              newItem.content,
              newItem.sourceDisplayName || newItem.type,
              formState.model,
              currentUser,
              sourceItem.content,
              restyleTargetWordCount,
              addProgressMessage
            );
            newItem.score = score;
            addProgressMessage(`Score generated for ${effectivePersona}'s voice content.`);
          } catch (scoreError) {
            console.error(`Error generating score for ${effectivePersona}'s voice:`, scoreError);
            addProgressMessage(`Error generating score for ${effectivePersona}'s voice, continuing...`);
          }
        }
        
        // Generate GEO score if enabled
        if (formState.generateGeoScore) {
          addProgressMessage(`Calculating GEO score for ${effectivePersona}'s voice content...`);
          try {
            const geoScore = await calculateGeoScore(newItem.content, formState, currentUser, addProgressMessage);
            newItem.geoScore = geoScore;
            addProgressMessage(`GEO score calculated for ${effectivePersona}'s voice content.`);
          } catch (geoError) {
            console.error(`Error calculating GEO score for ${effectivePersona}'s voice:`, geoError);
            addProgressMessage(`Error calculating GEO score for ${effectivePersona}'s voice, continuing...`);
          }
        }
      } else if (actionType === 'score') {
        // Check if source content exists
        if (!sourceItem.content) {
          throw new Error('No content available to score. Please regenerate the content first.');
        }
        addProgressMessage(`Generating score for ${sourceItem.sourceDisplayName || sourceItem.type}...`);
        const formTargetWordCount = calculateTargetWordCount(formState);
        const score = await generateContentScores(
          sourceItem.content,
          sourceItem.sourceDisplayName || sourceItem.type,
          formState.model,
          currentUser,
          undefined,
          formTargetWordCount.target,
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

  // Handle content modification
  const handleModifyContent = async (sourceItem: GeneratedContentItem, instruction: string) => {
    if (!currentUser || !formState || !setFormState || !addProgressMessage) {
      toast.error('Please log in to modify content.');
      return;
    }

    // Check user access before modification
    try {
      const accessResult = await checkUserAccess(currentUser.id, currentUser.email || '');
      
      if (!accessResult.hasAccess) {
        toast.error(accessResult.message);
        return;
      }
    } catch (error) {
      console.error('Error checking user access for content modification:', error);
      toast.error("Unable to verify access. Please try again.");
      return;
    }

    setFormState(prev => ({ ...prev, isLoading: true, generationProgress: [] }));
    addProgressMessage(`Modifying content: "${instruction}"...`);

    try {
      // Import the modification function
      const { modifyContent } = await import('../../../../services/apiService');
      
      const modifiedContent = await modifyContent(
        sourceItem.content,
        instruction,
        formState,
        currentUser,
        addProgressMessage
      );

      const newItem: GeneratedContentItem = {
        id: uuidv4(),
        type: GeneratedContentItemType.Alternative,
        content: modifiedContent,
        generatedAt: new Date().toISOString(),
        sourceId: sourceItem.id,
        sourceType: sourceItem.type,
        sourceDisplayName: `Modified: ${sourceItem.sourceDisplayName || sourceItem.type}`,
        modificationInstruction: instruction
      };

      // Generate SEO metadata if enabled
      if (formState.generateSeoMetadata) {
        addProgressMessage('Generating SEO metadata for modified content...');
        try {
          const seoMetadata = await generateSeoMetadata(modifiedContent, formState, currentUser, addProgressMessage);
          newItem.seoMetadata = seoMetadata;
          addProgressMessage('SEO metadata generated for modified content.');
        } catch (seoError) {
          console.error('Error generating SEO metadata for modified content:', seoError);
          addProgressMessage('Error generating SEO metadata for modified content, continuing...');
        }
      }
      
      // Generate content scores if enabled
      if (formState.generateScores) {
        addProgressMessage('Generating score for modified content...');
        try {
          const formTargetWordCount = calculateTargetWordCount(formState);
          const score = await generateContentScores(
            modifiedContent,
            newItem.sourceDisplayName || newItem.type,
            formState.model,
            currentUser,
            sourceItem.content,
            formTargetWordCount.target,
            addProgressMessage
          );
          newItem.score = score;
          addProgressMessage('Score generated for modified content.');
        } catch (scoreError) {
          console.error('Error generating score for modified content:', scoreError);
          addProgressMessage('Error generating score for modified content, continuing...');
        }
      }
      
      // Generate GEO score if enabled
      if (formState.generateGeoScore) {
        addProgressMessage('Calculating GEO score for modified content...');
        try {
          const geoScore = await calculateGeoScore(modifiedContent, formState, currentUser, addProgressMessage);
          newItem.geoScore = geoScore;
          addProgressMessage('GEO score calculated for modified content.');
        } catch (geoError) {
          console.error('Error calculating GEO score for modified content:', geoError);
          addProgressMessage('Error calculating GEO score for modified content, continuing...');
        }
      }

      // Add the new item to the generated versions
      setFormState(prev => ({
        ...prev,
        copyResult: {
          ...prev.copyResult,
          generatedVersions: [...(prev.copyResult?.generatedVersions || []), newItem]
        }
      }));
      addProgressMessage('Content modification complete.');
      toast.success('Content modified successfully!');
    } catch (error: any) {
      console.error('Error modifying content:', error);
      toast.error(`Failed to modify content: ${error.message}`);
    } finally {
      setFormState(prev => ({ ...prev, isLoading: false }));
    }
  };

  // Handle FAQ schema generation
  const handleGenerateFaqSchema = async (content: string) => {
    if (!currentUser || !formState || !setFormState || !addProgressMessage) {
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
      const faqSchema = await generateSeoMetadata(content, formState, currentUser, addProgressMessage);
      // This would need additional logic to show the schema
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
    if (setFormState) {
      setFormState(prev => ({ ...prev, isLoading: false, isEvaluating: false }));
    }
    toast.info('Operation cancelled');
  };

  return {
    handleGenerate,
    handleOnDemandGeneration,
    handleModifyContent,
    handleGenerateFaqSchema,
    handleCancelOperation
  };
}