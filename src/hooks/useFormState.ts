@@ .. @@
  /**
   * Load form state from a template
   */
  const loadFormStateFromTemplate = useCallback((template: Template) => {
    if (!template) {
      return;
    }
    
    setFormState(prevState => {
      // Use form_state_snapshot if available, otherwise construct from individual fields
      const templateData = template.form_state_snapshot ? template.form_state_snapshot : {
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
        productServiceName: template.product_service_name || '',
        industryNiche: template.industry_niche || '',
        toneLevel: template.tone_level || 50,
        readerFunnelStage: template.reader_funnel_stage || '',
        competitorCopyText: template.competitor_copy_text || '',
        targetAudiencePainPoints: template.target_audience_pain_points || '',
        preferredWritingStyle: template.preferred_writing_style || '',
        languageStyleConstraints: template.language_style_constraints || [],
        excludedTerms: template.excluded_terms || '',
        outputStructure: template.output_structure?.map(value => ({ value, label: value, wordCount: null })) || [],
        generateScores: template.generateScores || template.generatescores || false,
        generateSeoMetadata: template.generateSeoMetadata || false,
        selectedPersona: template.selectedPersona || template.selectedpersona || '',
        forceKeywordIntegration: template.forceKeywordIntegration || false,
        forceElaborationsExamples: template.forceElaborationsExamples || false,
        prioritizeWordCount: template.prioritizeWordCount || false,
        adhereToLittleWordCount: template.adhere_to_little_word_count || false,
        littleWordCountTolerancePercentage: template.little_word_count_tolerance_percentage || 20,
        wordCountTolerancePercentage: template.word_count_tolerance_percentage || 2,
        numUrlSlugs: template.numUrlSlugs || 3,
        numMetaDescriptions: template.numMetaDescriptions || 3,
        numH1Variants: template.numH1Variants || 3,
        numH2Variants: template.numH2Variants || 3,
        numH3Variants: template.numH3Variants || 3,
        numOgTitles: template.numOgTitles || 3,
        numOgDescriptions: template.numOgDescriptions || 3,
        model: template.model || 'deepseek-chat'
      };
      
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
      
      return newState;
    });
  }, [setFormState]);