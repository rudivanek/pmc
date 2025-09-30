import { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { getUserTemplates } from '../../../../services/supabaseClient';
import { Template, User, FormState } from '../../../../types';
import { getAutoDisplayMode } from '../../../../utils/formUtils';

interface UseTemplatesReturn {
  fetchedTemplates: Template[];
  isLoadingTemplates: boolean;
  templateLoadError: string | null;
  templateSearchQuery: string;
  setTemplateSearchQuery: (query: string) => void;
  filteredAndGroupedTemplates: Array<{ category: string; templates: Template[] }>;
  selectedTemplateId: string;
  setSelectedTemplateId: (id: string) => void;
  handleTemplateSelection: (templateId: string) => void;
}

export function useTemplates(
  currentUser?: User,
  loadFormStateFromTemplate?: (template: Template) => void,
  setLoadedTemplateId?: (id: string | null) => void,
  setLoadedTemplateName?: (name: string) => void,
  onClearAll?: () => void,
  setDisplayMode?: (mode: 'all' | 'populated') => void
): UseTemplatesReturn {
  const [fetchedTemplates, setFetchedTemplates] = useState<Template[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [templateSearchQuery, setTemplateSearchQuery] = useState<string>('');
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [templateLoadError, setTemplateLoadError] = useState<string | null>(null);

  // Fetch templates from database
  useEffect(() => {
    const fetchTemplates = async () => {
      if (!currentUser?.id) {
        setFetchedTemplates([]);
        return;
      }

      setIsLoadingTemplates(true);
      setTemplateLoadError(null);

      try {
        const { data, error } = await getUserTemplates(currentUser.id);
        if (error) {
          throw error;
        }
        setFetchedTemplates(data || []);
      } catch (error: any) {
        console.error('Error fetching templates:', error);
        setTemplateLoadError(`Failed to load templates: ${error.message}`);
      } finally {
        setIsLoadingTemplates(false);
      }
    };

    fetchTemplates();
  }, [currentUser?.id]);

  // Filter and group templates for the dropdown
  const filteredAndGroupedTemplates = useMemo(() => {
    const query = templateSearchQuery.toLowerCase();
    const filtered = fetchedTemplates.filter(template =>
      template.template_name.toLowerCase().includes(query) ||
      template.category.toLowerCase().includes(query) ||
      template.description?.toLowerCase().includes(query)
    );

    const grouped: { [key: string]: Template[] } = {};
    filtered.forEach(template => {
      const category = template.category || 'Uncategorized';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(template);
    });

    return Object.keys(grouped).sort().map(category => ({
      category,
      templates: grouped[category].sort((a, b) => a.template_name.localeCompare(b.template_name))
    }));
  }, [fetchedTemplates, templateSearchQuery]);

  // Handle template selection from dropdown
  const handleTemplateSelection = (templateId: string) => {
    setSelectedTemplateId(templateId);
    if (templateId) {
      const template = fetchedTemplates.find(t => t.id === templateId);
      if (template && loadFormStateFromTemplate) {
        loadFormStateFromTemplate(template);
        if (setLoadedTemplateId) setLoadedTemplateId(template.id || null);
        if (setLoadedTemplateName) setLoadedTemplateName(template.template_name || '');
        
        // Auto-determine display mode based on populated fields (same as quick start templates)
        if (setDisplayMode) {
          // We need to simulate the loaded form state to determine display mode
          // Create a temporary form state with the template data to check populated fields
          const tempFormState = {
            ...template,
            // Convert template fields back to FormState structure
            businessDescription: template.business_description,
            originalCopy: template.original_copy,
            targetAudience: template.target_audience,
            keyMessage: template.key_message,
            callToAction: template.call_to_action,
            desiredEmotion: template.desired_emotion,
            brandValues: template.brand_values,
            keywords: template.keywords,
            context: template.context,
            briefDescription: template.brief_description,
            productServiceName: template.product_service_name,
            industryNiche: template.industry_niche,
            readerFunnelStage: template.reader_funnel_stage,
            targetAudiencePainPoints: template.target_audience_pain_points,
            competitorCopyText: template.competitor_copy_text,
            preferredWritingStyle: template.preferred_writing_style,
            languageStyleConstraints: template.language_style_constraints,
            excludedTerms: template.excluded_terms,
            geoRegions: template.geoRegions,
            generateSeoMetadata: template.generateSeoMetadata,
            generateScores: template.generateScores,
            generateGeoScore: template.generateGeoScore,
            prioritizeWordCount: template.prioritizeWordCount,
            forceKeywordIntegration: template.forceKeywordIntegration,
            forceElaborationsExamples: template.forceElaborationsExamples,
            enhanceForGEO: template.enhanceForGEO,
            addTldrSummary: template.addTldrSummary
          } as any;
          
          const autoMode = getAutoDisplayMode(tempFormState);
          setDisplayMode(autoMode);
        }
        
        toast.success(`Template "${template.template_name}" loaded successfully!`);
      }
    } else {
      // If "Select a template" is chosen, clear the form
      if (onClearAll) onClearAll();
    }
  };

  return {
    fetchedTemplates,
    isLoadingTemplates,
    templateLoadError,
    templateSearchQuery,
    setTemplateSearchQuery,
    filteredAndGroupedTemplates,
    selectedTemplateId,
    setSelectedTemplateId,
    handleTemplateSelection
  };
}