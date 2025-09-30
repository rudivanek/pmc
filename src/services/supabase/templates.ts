import { supabase } from './client';

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
  generateHeadlines?: boolean;
  generateScores?: boolean;
  generateSeoMetadata?: boolean;
  generateGeoScore?: boolean;
  selectedPersona?: string;
  prioritizeWordCount?: boolean;
  adhereToLittleWordCount?: boolean;
  littleWordCountTolerancePercentage?: number;
  wordCountTolerancePercentage?: number;
  forceKeywordIntegration?: boolean;
  forceElaborationsExamples?: boolean;
  enhanceForGEO?: boolean;
  addTldrSummary?: boolean;
  location?: string;
  geoRegions?: string;
  sectionBreakdown?: string;
  numberOfHeadlines?: number;
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
  category?: string;
}

export async function saveTemplate(templateData: Omit<Template, 'created_at'>, templateId?: string) {
  try {
    if (templateId) {
      // Update existing template
      const { data, error } = await supabase
        .from('pmc_templates')
        .update(templateData)
        .eq('id', templateId)
        .select()
        .single();

      if (error) {
        console.error('Error updating template:', error);
        return { error, updated: false };
      }

      return { data, error: null, updated: true, id: data?.id };
    } else {
      // Create new template
      const { data, error } = await supabase
        .from('pmc_templates')
        .insert([templateData])
        .select()
        .single();

      if (error) {
        console.error('Error creating template:', error);
        return { error, updated: false };
      }

      return { data, error: null, updated: false, id: data?.id };
    }
  } catch (error: any) {
    console.error('Error in saveTemplate:', error);
    return { error, updated: false };
  }
}

export async function getUserTemplates(userId: string) {
  const { data, error } = await supabase
    .from('pmc_templates')
    .select('*')
    .or(`user_id.eq.${userId},is_public.eq.true`)
    .order('created_at', { ascending: false });

  return { data, error };
}

export async function getTemplate(templateId: string) {
  const { data, error } = await supabase
    .from('pmc_templates')
    .select('*')
    .eq('id', templateId)
    .single();

  return { data, error };
}

export async function deleteTemplate(templateId: string) {
  const { data, error } = await supabase
    .from('pmc_templates')
    .delete()
    .eq('id', templateId);

  return { data, error };
}

export async function getUniqueTemplateCategories() {
  const { data, error } = await supabase
    .from('pmc_templates')
    .select('category')
    .not('category', 'is', null)
    .neq('category', '');

  if (error) {
    return { data: [], error };
  }

  // Extract unique categories and format for dropdown
  const uniqueCategories = [...new Set(data.map(item => item.category))];
  const formattedCategories = uniqueCategories.map(category => ({
    value: category,
    label: category
  }));

  return { data: formattedCategories, error: null };
}