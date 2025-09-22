import { useState, useCallback } from 'react';
import { FormState, Template, CopySession, SavedOutput, ContentQualityScore, GeneratedContentItem, GeneratedContentItemType } from '../types';
import { DEFAULT_FORM_STATE } from '../constants';
import { Prefill } from '../services/supabaseClient';
import { v4 as uuidv4 } from 'uuid';

export function useFormState() {
  const [formState, setFormState] = useState<FormState>(DEFAULT_FORM_STATE);

  /**
   * Load form state from a template
   */
  const loadFormStateFromTemplate = useCallback((template: Template) => {
    setFormState(prevState => {
      // Create a new state object with the template data
      const newState: FormState = {
        ...DEFAULT_FORM_STATE,
        tab: template.template_type as 'create' | 'improve',
        language: template.language,
        tone: template.tone,
        wordCount: template.word_count,
        customWordCount: template.custom_word_count || undefined,
        targetAudience: template.target_audience || undefined,
        keyMessage: template.key_message || undefined,
        desiredEmotion: template.desired_emotion || undefined,
        callToAction: template.call_to_action || undefined,
        brandValues: template.brand_values || undefined,
        keywords: template.keywords || undefined,
        context: template.context || undefined,
        briefDescription: template.brief_description || undefined,
        pageType: template.page_type || undefined,
        businessDescription: template.business_description || undefined,
        originalCopy: template.original_copy || undefined,
        projectDescription: template.project_description || undefined,
        competitorUrls: template.competitor_urls || ['', '', ''],
        section: template.section || undefined,
        outputStructure: template.output_structure || [],
        
        // New fields
        productServiceName: template.product_service_name || undefined,
        industryNiche: template.industry_niche || undefined,
        toneLevel: template.tone_level || 50,
        readerFunnelStage: template.reader_funnel_stage || undefined,
        competitorCopyText: template.competitor_copy_text || undefined,
        targetAudiencePainPoints: template.target_audience_pain_points || undefined,
        preferredWritingStyle: template.preferred_writing_style || undefined,
        languageStyleConstraints: template.language_style_constraints || [],
        excludedTerms: template.excluded_terms || undefined,
        
        // Generation options
        generateHeadlines: template.generateHeadlines || false,
        generateScores: template.generateScores || false,
        generateSeoMetadata: template.generateSeoMetadata || false,
        generateGeoScore: template.generateGeoScore || false,
        selectedPersona: template.selectedPersona || undefined,
        numberOfHeadlines: template.numberOfHeadlines || 3,
        
        // Word count control features
        sectionBreakdown: template.sectionBreakdown || undefined,
        forceElaborationsExamples: template.forceElaborationsExamples || false,
        forceKeywordIntegration: template.forceKeywordIntegration || false,
        prioritizeWordCount: template.prioritizeWordCount || false,
        adhereToLittleWordCount: template.adhereToLittleWordCount || false,
        littleWordCountTolerancePercentage: template.littleWordCountTolerancePercentage || 20,
        wordCountTolerancePercentage: template.wordCountTolerancePercentage || 2,
        
        // GEO optimization features
        enhanceForGEO: template.enhanceForGEO || false,
        addTldrSummary: template.addTldrSummary || false,
        location: template.location || undefined,
        geoRegions: template.geoRegions || undefined,
        
        // SEO metadata counts
        numUrlSlugs: template.numUrlSlugs || 1,
        numMetaDescriptions: template.numMetaDescriptions || 1,
        numH1Variants: template.numH1Variants || 1,
        numH2Variants: template.numH2Variants || 2,
        numH3Variants: template.numH3Variants || 2,
        numOgTitles: template.numOgTitles || 1,
        numOgDescriptions: template.numOgDescriptions || 1,
        
        // Keep model and other fields from previous state
        model: prevState.model,
        
        // Reset loading states
        isLoading: false,
        isEvaluating: false,
        generationProgress: [],
        copyResult: DEFAULT_FORM_STATE.copyResult,
        promptEvaluation: undefined,
        sessionId: undefined // Reset session ID when loading template
      };
      
      return newState;
    });
  }, [setFormState]);

  /**
   * Load form state from a copy session
   */
  const loadFormStateFromSession = useCallback((session: CopySession) => {
    if (!session || !session.input_data) {
      return;
    }
    
    setFormState(prevState => {
      // Extract input data from the session
      const inputData = session.input_data;
      
      // Create a new state object with the session data
      const newState: FormState = {
        ...DEFAULT_FORM_STATE,
        ...inputData,
        sessionId: session.id,
        customerId: session.customer_id || undefined,
        customerName: session.customer?.name || undefined,
        
        // Keep model and other fields from previous state
        model: inputData.model || prevState.model,
        
        // Explicitly reset copyResult to ensure no outputs are shown
        copyResult: DEFAULT_FORM_STATE.copyResult,
        
        // Initialize loading states
        isLoading: false,
        isEvaluating: false,
        generationProgress: []
      };
      
      // Copy Sessions now only restore inputs, not outputs
      // The copyResult will remain undefined (empty) when loading from a copy session
      
      return newState;
    });
  }, [setFormState]);

  /**
   * Load form state from a saved output
   */
  const loadFormStateFromSavedOutput = useCallback((savedOutput: SavedOutput) => {
    if (!savedOutput || !savedOutput.input_snapshot || !savedOutput.output_content) {
      return;
    }
    
    setFormState(prevState => {
      // Extract input data and output content from the saved output
      const inputSnapshot = savedOutput.input_snapshot;
      
      // Create a new state object with the saved output data
      const newState: FormState = {
        ...DEFAULT_FORM_STATE,
        ...inputSnapshot,
        customerId: savedOutput.customer_id || undefined,
        customerName: savedOutput.customer?.name || undefined,
        
        // Keep model and other fields from previous state if not in snapshot
        model: inputSnapshot.model || prevState.model,
        
        // Set the copyResult directly from the saved output's output_content
        copyResult: savedOutput.output_content,
        
        // Initialize loading states
        isLoading: false,
        isEvaluating: false,
        generationProgress: []
      };
      
      // If the saved output has a session ID, set it
      if (savedOutput.input_snapshot.sessionId) {
        newState.sessionId = savedOutput.input_snapshot.sessionId;
      }
      
      return newState;
    });
  }, [setFormState]);

  /**
   * Load form state from a prefill
   */
  const loadFormStateFromPrefill = useCallback((prefill: Prefill) => {
    setFormState(prevState => {
      // Create a new state object with the prefill data
      const newState: FormState = {
        ...DEFAULT_FORM_STATE,
        // Apply all prefill data
        ...prefill.data,
        // Always preserve loading states and other runtime states
        isLoading: false,
        isEvaluating: false,
        generationProgress: [],
        copyResult: DEFAULT_FORM_STATE.copyResult,
        promptEvaluation: undefined
      };
      
      // Handle originalCopyGuidance from prefill
      if (prefill.data.originalCopyGuidance) {
        // Store the guidance in form state
        newState.originalCopyGuidance = prefill.data.originalCopyGuidance;
        
        // Populate the appropriate primary content field based on tab
        if (newState.tab === 'create') {
          newState.businessDescription = prefill.data.originalCopyGuidance;
        } else if (newState.tab === 'improve') {
          newState.originalCopy = prefill.data.originalCopyGuidance;
        }
      }
      
      return newState;
    });
  }, [setFormState]);

  // Function to update a quality score in the form state
  const handleScoreChange = useCallback((name: string, score: ContentQualityScore) => {
    setFormState(prevState => {
      // Create a copy of the previous state
      const newState = { ...prevState };
      
      // Update the score field based on the name
      switch (name) {
        case 'businessDescriptionScore':
          newState.businessDescriptionScore = score;
          break;
        case 'originalCopyScore':
          newState.originalCopyScore = score;
          break;
        default:
          console.warn(`Unknown score field: ${name}`);
      }
      
      return newState;
    });
  }, [setFormState]);

  return {
    formState,
    setFormState,
    loadFormStateFromTemplate,
    loadFormStateFromSession,
    loadFormStateFromSavedOutput,
    loadFormStateFromPrefill,
    handleScoreChange
  };
}