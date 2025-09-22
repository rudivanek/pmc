/**
 * NEW APPROACH: Centralized field population detection and display mode management
 */
import { DEFAULT_FORM_STATE } from '../constants';
import { FormState } from '../types';

/**
 * Creates a map of all populated fields in the form state
 * This is the single source of truth for field visibility
 */
export function getPopulatedFieldsMap(formState: FormState): Record<string, boolean> {
  const populatedFields: Record<string, boolean> = {};
  
  // Helper function to check if a value is truly populated
  const isValuePopulated = (value: any): boolean => {
    // Handle null, undefined
    if (value === null || value === undefined) return false;
    
    // Handle strings
    if (typeof value === 'string') return value.trim().length > 0;
    
    // Handle numbers - 0 is considered empty for most cases, but we need to be specific
    if (typeof value === 'number') return value !== 0;
    
    // Handle booleans - only true is considered populated
    if (typeof value === 'boolean') return value === true;
    
    // Handle arrays
    if (Array.isArray(value)) {
      // Empty array is not populated
      if (value.length === 0) return false;
      
      // For string arrays, check if any string is non-empty
      if (value.every(item => typeof item === 'string')) {
        return value.some(item => item.trim().length > 0);
      }
      
      // For other arrays (like StructuredOutputElement[]), any non-empty array is populated
      return true;
    }
    
    // Handle objects
    if (typeof value === 'object') {
      const keys = Object.keys(value);
      if (keys.length === 0) return false;
      
      // Recursively check if any property is populated
      return keys.some(key => isValuePopulated(value[key]));
    }
    
    return false;
  };

  // Check each field explicitly
  populatedFields.projectDescription = isValuePopulated(formState.projectDescription);
  populatedFields.customerId = isValuePopulated(formState.customerId);
  populatedFields.productServiceName = isValuePopulated(formState.productServiceName);
  populatedFields.briefDescription = isValuePopulated(formState.briefDescription);
  
  // Core content
  populatedFields.pageType = formState.pageType !== DEFAULT_FORM_STATE.pageType;
  populatedFields.section = isValuePopulated(formState.section);
  populatedFields.originalCopy = isValuePopulated(formState.originalCopy);
  populatedFields.businessDescription = isValuePopulated(formState.businessDescription);
  populatedFields.excludedTerms = isValuePopulated(formState.excludedTerms);
  
  // Copy targeting
  populatedFields.industryNiche = isValuePopulated(formState.industryNiche);
  populatedFields.targetAudience = isValuePopulated(formState.targetAudience);
  populatedFields.readerFunnelStage = isValuePopulated(formState.readerFunnelStage);
  populatedFields.competitorUrls = formState.competitorUrls?.some(url => url.trim().length > 0) || false;
  populatedFields.targetAudiencePainPoints = isValuePopulated(formState.targetAudiencePainPoints);
  populatedFields.competitorCopyText = isValuePopulated(formState.competitorCopyText);
  
  // Strategic messaging
  populatedFields.keyMessage = isValuePopulated(formState.keyMessage);
  populatedFields.desiredEmotion = isValuePopulated(formState.desiredEmotion);
  populatedFields.callToAction = isValuePopulated(formState.callToAction);
  populatedFields.brandValues = isValuePopulated(formState.brandValues);
  populatedFields.keywords = isValuePopulated(formState.keywords);
  populatedFields.context = isValuePopulated(formState.context);
  
  // Tone & style
  populatedFields.language = formState.language !== DEFAULT_FORM_STATE.language;
  populatedFields.tone = formState.tone !== DEFAULT_FORM_STATE.tone;
  populatedFields.wordCount = formState.wordCount !== DEFAULT_FORM_STATE.wordCount;
  populatedFields.customWordCount = isValuePopulated(formState.customWordCount);
  populatedFields.toneLevel = formState.toneLevel !== DEFAULT_FORM_STATE.toneLevel;
  populatedFields.preferredWritingStyle = isValuePopulated(formState.preferredWritingStyle);
  populatedFields.languageStyleConstraints = formState.languageStyleConstraints?.length > 0 || false;
  populatedFields.outputStructure = formState.outputStructure?.length > 0 || false;
  
  // Optional features
  populatedFields.generateSeoMetadata = formState.generateSeoMetadata !== DEFAULT_FORM_STATE.generateSeoMetadata;
  populatedFields.generateScores = formState.generateScores !== DEFAULT_FORM_STATE.generateScores;
  populatedFields.generateGeoScore = formState.generateGeoScore !== DEFAULT_FORM_STATE.generateGeoScore;
  populatedFields.prioritizeWordCount = formState.prioritizeWordCount !== DEFAULT_FORM_STATE.prioritizeWordCount;
  populatedFields.wordCountTolerancePercentage = formState.wordCountTolerancePercentage !== DEFAULT_FORM_STATE.wordCountTolerancePercentage;
  populatedFields.adhereToLittleWordCount = formState.adhereToLittleWordCount !== DEFAULT_FORM_STATE.adhereToLittleWordCount;
  populatedFields.littleWordCountTolerancePercentage = formState.littleWordCountTolerancePercentage !== DEFAULT_FORM_STATE.littleWordCountTolerancePercentage;
  populatedFields.forceKeywordIntegration = formState.forceKeywordIntegration !== DEFAULT_FORM_STATE.forceKeywordIntegration;
  populatedFields.forceElaborationsExamples = formState.forceElaborationsExamples !== DEFAULT_FORM_STATE.forceElaborationsExamples;
  populatedFields.enhanceForGEO = formState.enhanceForGEO !== DEFAULT_FORM_STATE.enhanceForGEO;
  populatedFields.addTldrSummary = formState.addTldrSummary !== DEFAULT_FORM_STATE.addTldrSummary;
  populatedFields.geoRegions = isValuePopulated(formState.geoRegions);
  
  // SEO metadata counts (only populated if different from defaults)
  populatedFields.numUrlSlugs = formState.numUrlSlugs !== DEFAULT_FORM_STATE.numUrlSlugs;
  populatedFields.numMetaDescriptions = formState.numMetaDescriptions !== DEFAULT_FORM_STATE.numMetaDescriptions;
  populatedFields.numH1Variants = formState.numH1Variants !== DEFAULT_FORM_STATE.numH1Variants;
  populatedFields.numH2Variants = formState.numH2Variants !== DEFAULT_FORM_STATE.numH2Variants;
  populatedFields.numH3Variants = formState.numH3Variants !== DEFAULT_FORM_STATE.numH3Variants;
  populatedFields.numOgTitles = formState.numOgTitles !== DEFAULT_FORM_STATE.numOgTitles;
  populatedFields.numOgDescriptions = formState.numOgDescriptions !== DEFAULT_FORM_STATE.numOgDescriptions;
  
  return populatedFields;
}

/**
 * Determines if any fields in a specific section are populated
 */
export function hasSectionPopulatedFields(formState: FormState, section: string): boolean {
  const populatedFields = getPopulatedFieldsMap(formState);
  
  switch (section) {
    case 'projectSetup':
      return populatedFields.projectDescription ||
             populatedFields.customerId ||
             populatedFields.productServiceName ||
             populatedFields.briefDescription;
             
    case 'coreContent':
      return populatedFields.pageType ||
             populatedFields.section ||
             populatedFields.originalCopy ||
             populatedFields.businessDescription ||
             populatedFields.excludedTerms;
             
    case 'copyTargeting':
      return populatedFields.industryNiche ||
             populatedFields.targetAudience ||
             populatedFields.readerFunnelStage ||
             populatedFields.competitorUrls ||
             populatedFields.targetAudiencePainPoints ||
             populatedFields.competitorCopyText;
             
    case 'strategicMessaging':
      return populatedFields.keyMessage ||
             populatedFields.desiredEmotion ||
             populatedFields.callToAction ||
             populatedFields.brandValues ||
             populatedFields.keywords ||
             populatedFields.context;
             
    case 'toneStyle':
      return populatedFields.language ||
             populatedFields.tone ||
             populatedFields.wordCount ||
             populatedFields.customWordCount ||
             populatedFields.toneLevel ||
             populatedFields.preferredWritingStyle ||
             populatedFields.languageStyleConstraints ||
             populatedFields.outputStructure;
             
    case 'optionalFeatures':
      return populatedFields.generateSeoMetadata ||
             populatedFields.generateScores ||
             populatedFields.generateGeoScore ||
             populatedFields.prioritizeWordCount ||
             populatedFields.wordCountTolerancePercentage ||
             populatedFields.adhereToLittleWordCount ||
             populatedFields.littleWordCountTolerancePercentage ||
             populatedFields.forceKeywordIntegration ||
             populatedFields.forceElaborationsExamples ||
             populatedFields.enhanceForGEO ||
             populatedFields.addTldrSummary ||
             populatedFields.geoRegions ||
             populatedFields.numUrlSlugs ||
             populatedFields.numMetaDescriptions ||
             populatedFields.numH1Variants ||
             populatedFields.numH2Variants ||
             populatedFields.numH3Variants ||
             populatedFields.numOgTitles ||
             populatedFields.numOgDescriptions;
             
    default:
      return false;
  }
}

/**
 * Determines if the form has any populated fields at all
 */
export function hasAnyPopulatedFields(formState: FormState): boolean {
  const populatedFields = getPopulatedFieldsMap(formState);
  return Object.values(populatedFields).some(isPopulated => isPopulated);
}

/**
 * Determines if a specific field should be visible based on display mode
 */
export function shouldShowField(fieldName: string, formState: FormState, displayMode: 'all' | 'populated'): boolean {
  if (displayMode === 'all') return true;
  
  const populatedFields = getPopulatedFieldsMap(formState);
  return populatedFields[fieldName] || false;
}

/**
 * Auto-determines the appropriate display mode based on form state
 * Returns 'populated' if any fields are populated, 'all' otherwise
 */
export function getAutoDisplayMode(formState: FormState): 'all' | 'populated' {
  return hasAnyPopulatedFields(formState) ? 'populated' : 'all';
}

// Legacy functions for backward compatibility (deprecated)
export function isFieldPopulated(value: any): boolean {
  console.warn('isFieldPopulated is deprecated. Use getPopulatedFieldsMap instead.');
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'boolean') return value === true;
  if (typeof value === 'number') return value !== 0;
  return false;
}

export function hasPopulatedCompetitorUrls(urls: string[]): boolean {
  console.warn('hasPopulatedCompetitorUrls is deprecated. Use getPopulatedFieldsMap instead.');
  if (!Array.isArray(urls)) return false;
  return urls.some(url => typeof url === 'string' && url.trim().length > 0);
}

export function isFieldUserModified(fieldName: keyof FormState, currentValue: any): boolean {
  console.warn('isFieldUserModified is deprecated. Use getPopulatedFieldsMap instead.');
  const defaultValue = DEFAULT_FORM_STATE[fieldName];
  return !deepEqual(currentValue, defaultValue);
}

function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (a == null || b == null) return a === b;
  if (typeof a !== typeof b) return false;
  
  if (typeof a === 'string' && typeof b === 'string') {
    return a.trim() === b.trim();
  }
  
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, index) => deepEqual(item, b[index]));
  }
  
  if (typeof a === 'object' && typeof b === 'object') {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    
    if (keysA.length !== keysB.length) return false;
    
    return keysA.every(key => 
      keysB.includes(key) && deepEqual(a[key], b[key])
    );
  }
  
  return false;
}