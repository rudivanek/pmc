import { useState, useCallback } from 'react';
import { FormState, Template, CopySession, SavedOutput, TabType, Language, Tone, WordCount, PageType } from '../types';
import { DEFAULT_FORM_STATE } from '../constants';

/**
 * Custom hook for managing form state with template/session loading capabilities
 */
function useFormState() {
  const [formState, setFormState] = useState<FormState>(DEFAULT_FORM_STATE);

  /**
   * Load form state from a template
   */
  const loadFormStateFromTemplate = useCallback((template: Template) => {
    console.log('🔍 Loading template data:', template);
    console.log('🔍 Template form_state_snapshot:', template.form_state_snapshot);
    
    if (!template) {
      console.error('❌ No template provided to loadFormStateFromTemplate');
      return;
    }
    
    setFormState(prevState => {
      // Use form_state_snapshot if available, otherwise construct from individual fields
      let templateData;
      
      if (template.form_state_snapshot && 
          typeof template.form_state_snapshot === 'object' && 
          Object.keys(template.form_state_snapshot).length > 0) {
        console.log('✅ Using form_state_snapshot for template data');
        templateData = template.form_state_snapshot;
      } else {
        console.log('⚠️ No form_state_snapshot found, constructing from individual fields');
        templateData = {
        tab: template.template_type as TabType || 'copyMaker',
        language: template.language as Language || 'English',
        tone: template.tone as Tone || 'Professional',
        wordCount: template.word_count as WordCount || 'Medium: 100-200',
        customWordCount: template.custom_word_count || undefined,
        competitorUrls: template.competitor_urls || ['', '', ''],
        businessDescription: template.business_description || '',
        originalCopy: template.original_copy || '',
        pageType: template.page_type as PageType || 'Homepage',
        section: template.section || '',
        targetAudience: template.target_audience || '',
        keyMessage: template.key_message || '',
        desiredEmotion: template.desired_emotion || '',
        callToAction: template.call_to_action || '',
        brandValues: template.brand_values || '',
        keywords: template.keywords || '',
        context: template.context || '',
        briefDescription: template.brief_description || '',
        projectDescription: template.project_description || '',
        productServiceName: template.product_service_name || '',
        industryNiche: template.industry_niche || '',
        toneLevel: template.tone_level || 50,
        readerFunnelStage: template.reader_funnel_stage || '',
        competitorCopyText: template.competitor_copy_text || '',
        targetAudiencePainPoints: template.target_audience_pain_points || '',
        preferredWritingStyle: template.preferred_writing_style || '',
        languageStyleConstraints: template.language_style_constraints || [],
        excludedTerms: template.excluded_terms || '',
        outputStructure: Array.isArray(template.output_structure) 
          ? template.output_structure.map(item => 
              typeof item === 'string' 
                ? { value: item, label: item, wordCount: null }
                : item
            ) 
          : [],
        generateScores: template.generateScores || template.generatescores || false,
        generateSeoMetadata: template.generateSeoMetadata || false,
        generateGeoScore: template.generateGeoScore || false,
        selectedPersona: template.selectedPersona || template.selectedpersona || '',
        forceKeywordIntegration: template.forceKeywordIntegration || false,
        forceElaborationsExamples: template.forceElaborationsExamples || false,
        prioritizeWordCount: template.prioritizeWordCount || false,
        adhereToLittleWordCount: template.adhere_to_little_word_count || false,
        littleWordCountTolerancePercentage: template.little_word_count_tolerance_percentage || 20,
        wordCountTolerancePercentage: template.word_count_tolerance_percentage || 2,
        enhanceForGEO: template.enhanceForGEO || false,
        addTldrSummary: template.addTldrSummary || true,
        geoRegions: template.geoRegions || '',
        location: template.location || '',
        numUrlSlugs: template.numUrlSlugs || 3,
        numMetaDescriptions: template.numMetaDescriptions || 3,
        numH1Variants: template.numH1Variants || 3,
        numH2Variants: template.numH2Variants || 3,
        numH3Variants: template.numH3Variants || 3,
        numOgTitles: template.numOgTitles || 3,
        numOgDescriptions: template.numOgDescriptions || 3,
        sectionBreakdown: template.sectionBreakdown || '',
        model: template.model || 'deepseek-chat'
        };
      }
      
      // Create a new state object with the template data
      const newState: FormState = {
        ...DEFAULT_FORM_STATE,
        ...templateData,
        
        // Reset copyResult to ensure clean state
        copyResult: DEFAULT_FORM_STATE.copyResult,
        
        // Initialize loading states
        isLoading: false,
        isEvaluating: false,
        generationProgress: []
      };
      
      console.log('✅ New form state created from template:', newState);
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
      const sessionData = session.input_data;
      
      const newState: FormState = {
        ...DEFAULT_FORM_STATE,
        ...sessionData,
        
        // Set the copy result from session
        copyResult: {
          improvedCopy: session.improved_copy,
          alternativeCopy: session.alternative_copy,
          generatedVersions: [] // Initialize as empty array
        },
        
        // Initialize loading states
        isLoading: false,
        isEvaluating: false,
        generationProgress: []
      };
      
      return newState;
    });
  }, []);

  /**
   * Load form state from a saved output
   */
  const loadFormStateFromSavedOutput = useCallback((savedOutput: SavedOutput) => {
    if (!savedOutput || !savedOutput.input_snapshot) {
      return;
    }

    setFormState(prevState => {
      const inputData = savedOutput.input_snapshot;
      
      const newState: FormState = {
        ...DEFAULT_FORM_STATE,
        ...inputData,
        
        // Set the copy result from saved output
        copyResult: savedOutput.output_content || DEFAULT_FORM_STATE.copyResult,
        
        // Initialize loading states
        isLoading: false,
        isEvaluating: false,
        generationProgress: []
      };
      
      return newState;
    });
  }, []);

  return {
    formState,
    setFormState,
    loadFormStateFromTemplate,
    loadFormStateFromSession,
    loadFormStateFromSavedOutput
  };
}

export default useFormState;