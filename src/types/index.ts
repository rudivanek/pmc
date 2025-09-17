export type TabType = 'create' | 'improve' | 'copyMaker';

export type Language = 'English' | 'Spanish' | 'French' | 'German' | 'Italian' | 'Portuguese';

export type Tone = 'Professional' | 'Friendly' | 'Bold' | 'Minimalist' | 'Creative' | 'Persuasive';

export type PageType = 'Homepage' | 'About' | 'Services' | 'Contact' | 'Other';

export type SectionType = 'Hero Section' | 'Benefits' | 'Features' | 'Services' | 'About' | 'Testimonials' | 'FAQ' | 'Full Copy' | 'Other';

export type WordCount = 'Short: 50-100' | 'Medium: 100-200' | 'Long: 200-400' | 'Custom';

export type Model = 'deepseek-chat' | 'gpt-4o' | 'gpt-4-turbo' | 'gpt-3.5-turbo' | 'grok-4-latest';

export type IndustryNiche = 'SaaS' | 'Health' | 'Real Estate' | 'E-commerce' | 'Education' | 'Hospitality' | 'Finance' | 'Nonprofit' | 'Other';

export type ReaderStage = 'Awareness' | 'Consideration' | 'Decision';

export type WritingStyle = 'Persuasive' | 'Conversational' | 'Informative' | 'Storytelling';

export type LanguageConstraint = 'Avoid passive voice' | 'No idioms' | 'Avoid jargon' | 'Short sentences';

export type CopyType = 'improved' | 'alternative' | 'humanized' | 'alternativeHumanized' | 'headlines';

// New enum for different types of generated content items
export enum GeneratedContentItemType {
  Improved = 'improved',
  Alternative = 'alternative',
  RestyledImproved = 'restyled_improved',
  RestyledAlternative = 'restyled_alternative',
  SeoMetadata = 'seo_metadata', // Existing SEO metadata type
  FaqSchema = 'faq_schema', // New FAQPage Schema type
}

// New interface for structured output elements with word counts
export interface StructuredOutputElement {
  value: string; // e.g., 'problem', 'solution', 'header1'
  label?: string; // For display purposes
  wordCount?: number | null; // e.g., 200, 500, or null if no specific count
}

export interface ContentQualityScore {
  score: number;
  tips: string[];
}

export interface FormData {
  tab: TabType;
  language: Language;
  tone: Tone;
  wordCount: WordCount;
  customWordCount?: number;
  competitorUrls: string[];
  businessDescription?: string;
  originalCopy?: string;
  pageType?: PageType;
  section?: SectionType; // Added section field
  targetAudience?: string;
  keyMessage?: string;
  desiredEmotion?: string;
  callToAction?: string;
  brandValues?: string;
  keywords?: string;
  context?: string;
  model: Model;
  customerId?: string; // Added customerId field
  customerName?: string; // For display purposes
  briefDescription?: string; // Added brief description field
  projectDescription?: string; // New required field for project organization (not used in prompts)
  controlExecuted?: string; // Added to track which UI control triggered the OpenAI token usage
  outputStructure?: StructuredOutputElement[]; // Changed from string[] to StructuredOutputElement[]
  businessDescriptionScore?: ContentQualityScore; // New field for business description score
  originalCopyScore?: ContentQualityScore; // New field for original copy score
  excludedTerms?: string; // New field for terms to exclude from output
  // New fields
  productServiceName?: string;
  industryNiche?: string;
  toneLevel?: number;
  readerFunnelStage?: string;
  competitorCopyText?: string;
  targetAudiencePainPoints?: string;
  preferredWritingStyle?: string;
  languageStyleConstraints?: string[];
  selectedPersona?: string; // Add selected persona to FormData
  sessionId?: string; // Session ID for tracking
  // Generation options
  generateScores?: boolean; // New field for generating scores
  generateSeoMetadata?: boolean; // New field for generating SEO metadata
  forceKeywordIntegration?: boolean; // New field for forcing SEO keyword integration
  generateGeoScore?: boolean; // New field for generating GEO scores
  // Multiple version controls
  // SEO metadata variant counts
  numUrlSlugs?: number; // Number of URL slug variants (1-5, default: 1)
  numMetaDescriptions?: number; // Number of meta description variants (1-5, default: 1)
  numH1Variants?: number; // Number of H1 variants (1-5, default: 1)
  numH2Variants?: number; // Number of H2 variants (1-10, default: 2)
  numH3Variants?: number; // Number of H3 variants (1-10, default: 2)
  numOgTitles?: number; // Number of OG title variants (1-5, default: 1)
  numOgDescriptions?: number; // Number of OG description variants (1-5, default: 1)
  // New fields for word count control
  sectionBreakdown?: string; // New field for section-by-section word count allocation
  forceElaborationsExamples?: boolean; // New field to force detailed explanations and examples
  // Strict word count control
  prioritizeWordCount?: boolean; // New field to prioritize exact word count adherence
  numberOfPrimaryOutputs?: number; // New field for number of primary outputs to generate
  wordCountTolerancePercentage?: number; // Percentage below target that triggers revision (default: 2%)
  // Little word count control
  faqSchemaEnabled?: boolean; // New field for FAQPage Schema generation
  adhereToLittleWordCount?: boolean; // New field for little word count adherence
  littleWordCountTolerancePercentage?: number; // Percentage tolerance for little word count (default: 20%)
  enhanceForGEO?: boolean; // New field for enhancing content for Generative Engine Optimization
  addTldrSummary?: boolean; // New field for adding TL;DR summary at the top (only when GEO is enabled)
  // Location field for GEO targeting
  location?: string; // New field for location targeting when GEO is enabled
  geoRegions?: string; // New field for targeting specific countries or regions when GEO is enabled
  // Public template fields
  is_public?: boolean;
  public_name?: string;
  public_description?: string;
  // Original copy guidance field for prefills
  originalCopyGuidance?: string; // Specific instructions for the "Original Copy" field based on prefill context
}

export interface PromptEvaluation {
  score: number;
  tips: string[];
}

export interface ScoreData {
  overall: number;
  clarity: string;
  persuasiveness: string;
  toneMatch: string;
  engagement: string;
  wordCountAccuracy?: number; // Added word count accuracy property
  improvementExplanation?: string; // Added prop for the improvement explanation
}

// New interface for GEO score data
export interface GeoScoreData {
  overall: number;
  breakdown: {
    criterion: string;
    score: number;
    detected: boolean;
    explanation: string;
  }[];
  suggestions: string[];
}

// New interfaces for structured copy output
export interface StructuredCopySection {
  title: string;
  content?: string;
  listItems?: string[];
}

export interface StructuredCopyOutput {
  headline: string;
  sections: StructuredCopySection[];
  wordCountAccuracy?: number; // Added to track word count accuracy
}

// New interface for a single generated content item
export interface GeneratedContentItem {
  id: string; // Unique ID for this specific generated item
  type: GeneratedContentItemType; // Type of content (e.g., 'improved', 'alternative', 'humanized', 'restyled_improved')
  content: string | StructuredCopyOutput | string[]; // The actual generated content (string, structured object, or string[] for headlines)
  persona?: string; // The persona applied, if any
  score?: ScoreData; // The score data for this content, if generated
  faqSchema?: any; // FAQ JSON-LD schema if generated from content
  
  // Fields to link to the source content item (for alternative, humanized, restyled versions)
  sourceId?: string; // ID of the content item this was generated from
  sourceType?: GeneratedContentItemType; // Type of the source content item
  sourceIndex?: number; // Index of the source content item if it was part of a collection (e.g., alternativeVersions[index])
  sourceDisplayName?: string; // A user-friendly name for the source (e.g., "Standard Version", "Alternative Version 2")
  
  generatedAt: string; // Timestamp of when this item was generated
  
  // SEO metadata for this content item
  seoMetadata?: SeoMetadata;
  
  // GEO score for this content item
  geoScore?: GeoScoreData;
}

// New interface for SEO metadata
export interface SeoMetadata {
  urlSlugs?: string[];
  metaDescriptions?: string[];
  h1Variants?: string[];
  h2Headings?: string[];
  h3Headings?: string[];
  ogTitles?: string[];
  ogDescriptions?: string[];
}

export interface CopyResult {
  // Retained for initial generation and backward compatibility
  improvedCopy: string | StructuredCopyOutput;
  alternativeCopy?: string | StructuredCopyOutput;
  headlines?: string[];

  // New unified array for all generated content items
  generatedVersions: GeneratedContentItem[];

  // Old properties (to be phased out or used for specific initial states)
  restyledImprovedCopy?: string | StructuredCopyOutput;
  restyledImprovedCopyPersona?: string;
  restyledImprovedVersions?: { content: string | StructuredCopyOutput; persona: string }[];
  
  restyledAlternativeCopy?: string | StructuredCopyOutput;
  restyledAlternativeCopyPersona?: string;
  restyledAlternativeVersionCollection?: { content: string | StructuredCopyOutput; persona: string }[];
  
  restyledHeadlines?: string[]; // Added property for restyled headlines
  restyledHeadlinesPersona?: string;
  restyledHeadlinesVersions?: { headlines: string[]; persona: string }[];
  
  improvedCopyScore?: ScoreData;
  alternativeCopyScore?: ScoreData; // Added score for alternative version
  restyledImprovedCopyScore?: ScoreData; // Added score for restyled content
  restyledAlternativeCopyScore?: ScoreData;
  promptUsed?: string; // Added to store the prompt used for token calculation
  wordCountAccuracy?: number; // Added for overall word count accuracy tracking
  
  // SEO metadata
  seoMetadata?: SeoMetadata;
  // Support for multiple alternative versions
  alternativeVersions?: (string | StructuredCopyOutput)[]; // Array of alternative versions
  alternativeVersionsPersonas?: string[]; // Array of personas used for each alternative version
  // Collection of restyled alternative versions, organized by alternative index
  restyledAlternativeVersionCollections?: { 
    alternativeIndex: number; 
    versions: { content: string | StructuredCopyOutput; persona: string }[] 
  }[];
  alternativeVersionScores?: ScoreData[]; // Array of scores for alternative versions
  restyledAlternativeVersions?: (string | StructuredCopyOutput)[]; // Array of restyled alternative versions
  restyledAlternativeVersionsPersonas?: string[]; // Array of personas used for each restyled alternative version
  restyledAlternativeVersionScores?: ScoreData[]; // Array of scores for restyled alternative versions
  
  // Track the session ID if created
  sessionId?: string;
  
  // GEO score for the main content
  geoScore?: GeoScoreData;
}

// Prefill interface for form prefills
export interface Prefill {
  id: string;
  user_id: string;
  label: string;
  category: string;
  is_public: boolean;
  data: Partial<FormState>;
  created_at?: string;
  updated_at?: string;
}

export interface FormState extends FormData {
  isLoading: boolean;
  isEvaluating?: boolean; // Make this optional to avoid type errors
  isGeneratingScores?: boolean; // New state for generating scores
  isGeneratingAlternative?: boolean; // New state for generating alternative copy
  isGeneratingHeadlines?: boolean; // New state for generating headlines
  
  // New granular loading states for on-demand generation
  isGeneratingRestyledImproved?: boolean; // New state for generating restyled improved copy
  isGeneratingRestyledAlternative?: boolean; // New state for generating restyled alternative copy
  
  // States for generating individual alternatives in sequence
  alternativeGenerationIndex?: number; // Track which alternative is being generated (0-based index)
  
  generationProgress: string[]; // Array to track generation progress messages
  promptEvaluation?: PromptEvaluation;
  copyResult?: CopyResult;
}

// Define Supabase-related types
export interface User {
  id: string;
  email: string;
  name?: string;
  created_at?: string;
}

export interface Customer {
  id: string;
  name: string;
  description?: string;
  user_id?: string;
  created_at?: string;
}

export interface CopySession {
  id: string;
  user_id: string;
  customer_id?: string;
  customer?: Customer;
  input_data: FormData;
  improved_copy: string | StructuredCopyOutput;
  alternative_copy?: string | StructuredCopyOutput;
  created_at: string;
  output_type?: string; // Added output_type field
  brief_description?: string; // Added brief description field
}

export interface TokenUsage {
  id?: string;
  user_email: string;
  token_usage: number;
  token_cost: number;
  usage_date?: string; // This will default to current date in the database
  created_at?: string; // This will be set by the database
  control_executed: string;
  brief_description: string; // Changed from optional to required
  model?: string; // Added model field
  copy_source?: string; // New field to track the source of the token usage
  session_id?: string; // New field to track the session ID for grouping token usage
}

// Template interface
export interface Template {
  id?: string;
  user_id: string;
  template_name: string;
  description?: string;
  language: string;
  tone: string;
  word_count: string;
  custom_word_count?: number | null;
  target_audience?: string;
  key_message?: string;
  desired_emotion?: string;
  call_to_action?: string;
  brand_values?: string;
  keywords?: string;
  context?: string;
  brief_description?: string;
  page_type?: string | null;
  section?: string | null;
  business_description?: string | null;
  original_copy?: string | null;
  template_type: 'create' | 'improve';
  created_at?: string;
  competitor_urls?: string[];
  output_structure?: string[];
  product_service_name?: string;
  industry_niche?: string;
  tone_level?: number;
  reader_funnel_stage?: string;
  competitor_copy_text?: string;
  target_audience_pain_points?: string;
  preferred_writing_style?: string;
  language_style_constraints?: string[];
  excluded_terms?: string;
  generateHumanized?: boolean;
  generateHeadlines?: boolean;
  generateScores?: boolean;
  selectedPersona?: string;
  generatehumanized?: boolean;
  generateSeoMetadata?: boolean;
  generatescores?: boolean;
  selectedpersona?: string;
  prioritizeWordCount?: boolean;
  adhere_to_little_word_count?: boolean;
  little_word_count_tolerance_percentage?: number;
  word_count_tolerance_percentage?: number;
  numUrlSlugs?: number;
  numMetaDescriptions?: number;
  numH1Variants?: number;
  numH2Variants?: number;
  numH3Variants?: number;
  numOgTitles?: number;
  numOgDescriptions?: number;
  is_public?: boolean;
  public_name?: string;
  public_description?: string;
  form_state_snapshot?: any;
  category: string; // Add this new line
}

// New SavedOutput interface for saved outputs
export interface SavedOutput {
  id?: string;
  user_id: string;
  customer_id?: string | null;
  brief_description: string;
  language: string;
  tone: string;
  model: string;
  selected_persona?: string | null;
  input_snapshot: FormData;
  output_content: CopyResult;
  saved_at?: string;
  customer?: Customer;
}

// Interface for admin user creation
export interface AdminUserData {
  email: string;
  password: string;
  name: string;
  startDate: string | null;
  untilDate: string | null;
  tokensAllowed: number;
}