import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useRef } from 'react';
import { toast } from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';
import CopyMakerForm from './CopyMakerForm';
import AppSpinner from './ui/AppSpinner';
import LoadingSpinner from './ui/LoadingSpinner';
import FloatingActionBar from './FloatingActionBar';
import GeneratedCopyCard from './GeneratedCopyCard';
import SavePrefillModal from './SavePrefillModal';
import { JsonLdModal } from './JsonLdModal';
import { FormState, User, GeneratedContentItem, GeneratedContentItemType, CopyResult, Prefill, Template } from '../types';
import { generateCopy, generateContentScores, generateSeoMetadata, calculateGeoScore, generateAlternativeCopy, restyleCopyWithPersona } from '../services/apiService';
import { checkUserAccess, getPrefill, createPrefill, updatePrefill, getUserTemplates, getSupabaseClient } from '../services/supabaseClient';
import { calculateTargetWordCount } from '../services/api/utils';
import { RefreshCw, Search } from 'lucide-react';
import PrefillSelector from './PrefillSelector';

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
  loadFormStateFromPrefill: any;
  loadFormStateFromTemplate: any;
  displayMode: 'all' | 'populated';
  setDisplayMode: (mode: 'all' | 'populated') => void;
  isTemplateSuggestionModalOpen: boolean;
  setIsTemplateSuggestionModalOpen: (open: boolean) => void;
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
  displayMode,
  setDisplayMode,
  onEvaluateInputs,
  onSaveTemplate,
  onSaveOutput,
  onViewPrompts,
  onCancel,
  loadFormStateFromPrefill,
  loadFormStateFromTemplate,
  isTemplateSuggestionModalOpen,
  setIsTemplateSuggestionModalOpen
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [showJsonLdModal, setShowJsonLdModal] = useState(false);
  const [jsonLdContent, setJsonLdContent] = useState('');
  const [isPrefillEditingMode, setIsPrefillEditingMode] = useState(false);
  const [prefillEditingData, setPrefillEditingData] = useState<{
    mode: 'add' | 'edit' | 'clone';
    prefillId?: string;
    originalLabel?: string;
  } | null>(null);
  const [showSavePrefillModal, setShowSavePrefillModal] = useState(false);
  
  // State for template loading
  const [fetchedTemplates, setFetchedTemplates] = useState<Template[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [templateSearchQuery, setTemplateSearchQuery] = useState<string>('');
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [templateLoadError, setTemplateLoadError] = useState<string | null>(null);

  // Refs for focusing on required fields
  const projectDescriptionRef = useRef<HTMLInputElement>(null);
  const businessDescriptionRef = useRef<HTMLTextAreaElement>(null);
  const originalCopyRef = useRef<HTMLTextAreaElement>(null);

  // Handle prefill mode from URL parameters
  React.useEffect(() => {
    const prefillMode = searchParams.get('prefillMode') as 'add' | 'edit' | 'clone' | null;
    const prefillId = searchParams.get('prefillId');

    if (prefillMode && currentUser) {
      setIsPrefillEditingMode(true);
      setPrefillEditingData({ mode: prefillMode, prefillId });

      // If editing or cloning, load the prefill data
      if ((prefillMode === 'edit' || prefillMode === 'clone') && prefillId) {
        loadPrefillData(prefillId, prefillMode === 'clone');
      } else if (prefillMode === 'add') {
        // Clear form for new prefill
        setFormState(prev => ({
          ...prev,
          ...formState,
          copyResult: { generatedVersions: [] }
        }));
      }
    } else {
      setIsPrefillEditingMode(false);
      setPrefillEditingData(null);
    }
  }, [searchParams, currentUser]);

  // Function to load prefill data
  const loadPrefillData = async (prefillId: string, isClone: boolean = false) => {
    try {
      const { data: prefill, error } = await getPrefill(prefillId);
      if (error) throw error;
      
      if (prefill) {
        loadFormStateFromPrefill(prefill);
        setPrefillEditingData(prev => ({
          ...prev!,
          originalLabel: isClone ? `${prefill.label} (Clone)` : prefill.label
        }));
        
        if (isClone) {
          toast.success(`Cloned "${prefill.label}" - edit and save as new prefill`);
        } else {
          toast.success(`Loaded "${prefill.label}" for editing`);
        }
      }
    } catch (error: any) {
      console.error('Error loading prefill:', error);
      toast.error(`Failed to load prefill: ${error.message}`);
      // Reset prefill mode on error
      setSearchParams({});
      setIsPrefillEditingMode(false);
      setPrefillEditingData(null);
    }
  };

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
      if (template) {
        loadFormStateFromTemplate(template);
        setLoadedTemplateId(template.id || null);
        setLoadedTemplateName(template.template_name || '');
        toast.success(`Template "${template.template_name}" loaded successfully!`);
      }
    } else {
      // If "Select a template" is chosen, clear the form
      onClearAll();
    }
  };

  // Override onClearAll to also clear template selection
  const handleClearAllOverride = () => {
    onClearAll();
    setSelectedTemplateId('');
    setTemplateSearchQuery('');
    setLoadedTemplateId(null);
    setLoadedTemplateName('');
  };

  // Handle saving prefill
  const handleSavePrefill = async (label: string, category: string, isPublic: boolean) => {
    if (!currentUser?.id) {
      toast.error('You must be logged in to save prefills.');
      return;
    }

    try {
      const prefillData = {
        user_id: currentUser.id,
        label,
        category,
        is_public: isPublic,
        data: formState
      };

      if (prefillEditingData?.mode === 'edit' && prefillEditingData.prefillId) {
        // Update existing prefill
        const { error } = await updatePrefill({
          id: prefillEditingData.prefillId,
          ...prefillData
        });
        if (error) throw error;
        toast.success('Prefill updated successfully!');
      } else {
        // Create new prefill (add or clone)
        const { error } = await createPrefill(prefillData);
        if (error) throw error;
        toast.success(prefillEditingData?.mode === 'clone' ? 'Prefill cloned successfully!' : 'Prefill created successfully!');
      }

      // Navigate back to manage prefills
      navigate('/manage-prefills');
    } catch (error: any) {
      console.error('Error saving prefill:', error);
      toast.error(`Failed to save prefill: ${error.message}`);
    }
  };

  // Handle canceling prefill editing
  const handleCancelPrefillEditing = () => {
    if (window.confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
      navigate('/manage-prefills');
    }
  };

  // Add progress message callback
  const addProgressMessage = React.useCallback((message: string) => {
    setFormState(prevState => ({ // Ensure message is a string before adding to array
      ...prevState,
      generationProgress: [...prevState.generationProgress, typeof message === 'string' ? message : String(message)]
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
          targetWordCount.target,
          addProgressMessage
        );

        newItem = {
          id: uuidv4(),
          type: GeneratedContentItemType.RestyledImproved,
          content: restyledContent,
          persona: personaUsed || selectedPersona,
          generatedAt: new Date().toISOString(),
          sourceId: sourceItem.id,
          sourceType: sourceItem.type,
          sourceDisplayName: `${personaUsed || selectedPersona}'s Voice from ${sourceItem.sourceDisplayName || sourceItem.type}`
        };
        addProgressMessage(`Applied ${personaUsed}'s voice style.`);
        
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
      const faqSchema = await generateSeoMetadata(content, formState, currentUser, addProgressMessage);
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
        {/* Prefill and Template Loaders */}
        <div className="bg-white dark:bg-black border border-gray-300 dark:border-gray-800 rounded-lg p-6 mx-24">
          {/* Prefill Selector */}
          <div className="hidden">
            <PrefillSelector
              formState={formState}
              setFormState={setFormState}
              setDisplayMode={setDisplayMode}
            />
          </div>

          {/* Load Template Section */}
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800 rounded-lg">
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="templateSelection" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Load Template (optional)
                {templateLoadError && (
                  <span className="ml-2 text-xs text-red-600 dark:text-red-400">{templateLoadError}</span>
                )}
              </label>
              <button
                type="button"
                onClick={handleClearAllOverride}
                className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center"
                disabled={isLoadingTemplates}
              >
                <RefreshCw size={12} className={`mr-1 ${isLoadingTemplates ? 'animate-spin' : ''}`} />
                Clear
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              {/* Search Input */}
              <div className="lg:col-span-1">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search size={16} className="text-gray-500" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search templates..."
                    value={templateSearchQuery}
                    onChange={(e) => setTemplateSearchQuery(e.target.value)}
                    className="bg-white dark:bg-black border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-gray-500 focus:border-gray-500 block w-full pl-10 pr-4 py-2.5"
                  />
                </div>
              </div>
              
              {/* Template Dropdown */}
              <div className="lg:col-span-2">
                <select
                  id="templateSelection"
                  name="templateSelection"
                  className="bg-white dark:bg-black border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5"
                  value={selectedTemplateId}
                  onChange={(e) => handleTemplateSelection(e.target.value)}
                  disabled={isLoadingTemplates}
                >
                  <option value="">{isLoadingTemplates ? '— Loading Templates —' : '— Select a Template —'}</option>
                  {filteredAndGroupedTemplates.map((group) => (
                    <optgroup key={group.category} label={group.category}>
                      {group.templates.map((template) => (
                        <option key={template.id} value={template.id}>
                          {template.template_name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
            </div>
            
            {isLoadingTemplates && (
              <div className="flex items-center justify-center mt-3">
                <LoadingSpinner size="sm" />
                <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Loading templates...</span>
              </div>
            )}
            
            {templateSearchQuery && filteredAndGroupedTemplates.length === 0 && !isLoadingTemplates && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                No matching templates found.
              </div>
            )}
          </div>
        </div>

        {/* Form Section */}
        <div>
          <CopyMakerForm
            currentUser={currentUser}
            formState={formState}
            setFormState={setFormState}
            onGenerate={isPrefillEditingMode ? undefined : handleGenerate}
            onClearAll={handleClearAllOverride} // Use the override function
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
            isPrefillEditingMode={isPrefillEditingMode}
            displayMode={displayMode}
            setDisplayMode={setDisplayMode}
            displayMode={displayMode}
          />
          
          {/* Prefill Action Buttons */}
          {isPrefillEditingMode && (
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => setShowSavePrefillModal(true)}
                className="w-full bg-primary-600 hover:bg-primary-500 text-white font-medium text-base px-5 py-3.5 transition-colors flex items-center justify-center"
              >
                Save Prefill
              </button>
              <button
                onClick={handleCancelPrefillEditing}
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

      {/* Save Prefill Modal */}
      {showSavePrefillModal && prefillEditingData && (
        <SavePrefillModal
          isOpen={showSavePrefillModal}
          onClose={() => setShowSavePrefillModal(false)}
          onSave={handleSavePrefill}
          mode={prefillEditingData.mode}
          initialLabel={prefillEditingData.originalLabel || ''}
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