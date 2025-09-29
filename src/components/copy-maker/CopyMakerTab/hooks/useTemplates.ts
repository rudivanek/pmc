import { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { getUserTemplates } from '../../../../services/supabaseClient';
import { Template, User, FormState } from '../../../../types';

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
  onClearAll?: () => void
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