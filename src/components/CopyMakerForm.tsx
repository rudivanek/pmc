import React, { useState } from 'react';
import { FormState, User } from '../types';
import { MODELS, LANGUAGES, TONES, WORD_COUNTS, PAGE_TYPES, OUTPUT_STRUCTURE_OPTIONS, INDUSTRY_NICHE_CATEGORIES, READER_FUNNEL_STAGES, PREFERRED_WRITING_STYLES, LANGUAGE_STYLE_CONSTRAINTS } from '../constants';
import { DEFAULT_FORM_STATE } from '../constants';
import { toast } from 'react-hot-toast';
import { checkUserAccess, getCustomers } from '../services/supabaseClient';
import { getSuggestions, evaluateContentQuality } from '../services/apiService';
import { useInputField } from '../hooks/useInputField';
import PrefillSelector from './PrefillSelector';
import GenerateButton from './GenerateButton';
import ClearButton from './ClearButton';
import SuggestionModal from './SuggestionModal';
import LoadingSpinner from './ui/LoadingSpinner';
import ContentQualityIndicator from './ui/ContentQualityIndicator';
import DraggableStructuredInput from './ui/DraggableStructuredInput';
import TagInput from './ui/TagInput';
import CategoryTagsInput from './ui/CategoryTagsInput';
import SuggestionButton from './ui/SuggestionButton';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { Tooltip } from './ui/Tooltip';
import { Download, Upload, User as UserIcon, Plus, Zap, Save, Lightbulb, List, Filter, InfoIcon } from 'lucide-react';
import { calculateTargetWordCount } from '../services/api/utils';

interface CopyMakerFormProps {
  currentUser?: User;
  formState: FormState;
  setFormState: (state: FormState) => void;
  onGenerate?: () => void;
  onClearAll: () => void;
  loadedTemplateId: string | null;
  setLoadedTemplateId: (id: string | null) => void;
  loadedTemplateName: string;
  isSmartMode: boolean;
  onEvaluateInputs?: () => void;
  onSaveTemplate?: () => void;
  isPrefillEditingMode?: boolean;
  projectDescriptionRef?: React.RefObject<HTMLInputElement>;
  businessDescriptionRef?: React.RefObject<HTMLTextAreaElement>;
  originalCopyRef?: React.RefObject<HTMLTextAreaElement>;
  onOpenTemplateSuggestion?: () => void;
}

const CopyMakerForm: React.FC<CopyMakerFormProps> = ({
  currentUser,
  formState,
  setFormState,
  onGenerate,
  onClearAll,
  loadedTemplateId,
  setLoadedTemplateId,
  loadedTemplateName,
  setLoadedTemplateName,
  onEvaluateInputs,
  onSaveTemplate,
  isPrefillEditingMode = false,
  projectDescriptionRef,
  businessDescriptionRef,
  originalCopyRef,
  onOpenTemplateSuggestion
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [activeSuggestionField, setActiveSuggestionField] = useState<string | null>(null);
  const [showSuggestionModal, setShowSuggestionModal] = useState(false);
  const [currentSuggestions, setCurrentSuggestions] = useState<string[]>([]);
  const [currentSuggestionField, setCurrentSuggestionField] = useState<string>('');
  const [displayMode, setDisplayMode] = useState<'all' | 'populated'>('all');
  const [isEvaluatingOriginalCopy, setIsEvaluatingOriginalCopy] = useState(false);
  // Check if current user is admin
  const isAdmin = currentUser?.email === 'rfv@datago.net';


  // Input field hooks
  const projectDescriptionField = useInputField({
    value: formState.projectDescription || '',
    onChange: (value) => handleChange({ target: { name: 'projectDescription', value } } as any)
  });

  const briefDescriptionField = useInputField({
    value: formState.briefDescription || '',
    onChange: (value) => handleChange({ target: { name: 'briefDescription', value } } as any)
  });

  const productServiceNameField = useInputField({
    value: formState.productServiceName || '',
    onChange: (value) => handleChange({ target: { name: 'productServiceName', value } } as any)
  });

  const originalCopyField = useInputField({
    value: formState.originalCopy || '',
    onChange: (value) => handleChange({ target: { name: 'originalCopy', value } } as any)
  });

  const customWordCountField = useInputField({
    value: formState.customWordCount?.toString() || '',
    onChange: (value) => handleChange({ 
      target: { 
        name: 'customWordCount', 
        value: value ? parseInt(value) : 150 
      } 
    } as any)
  });

  // Input field hooks for targeting section
  const targetAudienceField = useInputField({
    value: formState.targetAudience || '',
    onChange: (value) => handleChange({ target: { name: 'targetAudience', value } } as any)
  });

  const targetAudiencePainPointsField = useInputField({
    value: formState.targetAudiencePainPoints || '',
    onChange: (value) => handleChange({ target: { name: 'targetAudiencePainPoints', value } } as any)
  });

  // Input field hooks for competitor URLs
  const competitorUrl1Field = useInputField({
    value: formState.competitorUrls[0] || '',
    onChange: (value) => {
      const newUrls = [...formState.competitorUrls];
      newUrls[0] = value;
      handleChange({
        target: { name: 'competitorUrls', value: newUrls }
      } as unknown as React.ChangeEvent<HTMLInputElement>);
    }
  });
  
  const competitorUrl2Field = useInputField({
    value: formState.competitorUrls[1] || '',
    onChange: (value) => {
      const newUrls = [...formState.competitorUrls];
      newUrls[1] = value;
      handleChange({
        target: { name: 'competitorUrls', value: newUrls }
      } as unknown as React.ChangeEvent<HTMLInputElement>);
    }
  });
  
  const competitorUrl3Field = useInputField({
    value: formState.competitorUrls[2] || '',
    onChange: (value) => {
      const newUrls = [...formState.competitorUrls];
      newUrls[2] = value;
      handleChange({
        target: { name: 'competitorUrls', value: newUrls }
      } as unknown as React.ChangeEvent<HTMLInputElement>);
    }
  });

  // Strategic messaging input hooks
  const keyMessageField = useInputField({
    value: formState.keyMessage || '',
    onChange: (value) => handleChange({ target: { name: 'keyMessage', value } } as any)
  });
  
  const desiredEmotionField = useInputField({
    value: formState.desiredEmotion || '',
    onChange: (value) => handleChange({ target: { name: 'desiredEmotion', value } } as any)
  });
  
  const callToActionField = useInputField({
    value: formState.callToAction || '',
    onChange: (value) => handleChange({ target: { name: 'callToAction', value } } as any)
  });
  
  const brandValuesField = useInputField({
    value: formState.brandValues || '',
    onChange: (value) => handleChange({ target: { name: 'brandValues', value } } as any)
  });
  
  const keywordsField = useInputField({
    value: formState.keywords || '',
    onChange: (value) => handleChange({ target: { name: 'keywords', value } } as any)
  });
  
  const contextField = useInputField({
    value: formState.context || '',
    onChange: (value) => handleChange({ target: { name: 'context', value } } as any)
  });

  const competitorCopyTextField = useInputField({
    value: formState.competitorCopyText || '',
    onChange: (value) => handleChange({ 
      target: { name: 'competitorCopyText', value } 
    } as any)
  });

  // Load customers on component mount
  React.useEffect(() => {
    const loadCustomers = async () => {
      if (!currentUser) return;
      
      setLoadingCustomers(true);
      try {
        const { data, error } = await getCustomers();
        if (error) throw error;
        setCustomers(data || []);
      } catch (error) {
        console.error('Error loading customers:', error);
      } finally {
        setLoadingCustomers(false);
      }
    };

    loadCustomers();
  }, [currentUser]);

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'customerId') {
      const selectedCustomer = customers.find(c => c.id === value);
      setFormState(prev => ({
        ...prev,
        customerId: value,
        customerName: selectedCustomer?.name || ''
      }));
    } else {
      setFormState(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Handle checkbox toggles
  const handleToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormState(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  // Handle getting suggestions
  const onGetSuggestion = async (fieldType: string) => {
    if (!currentUser) {
      toast.error('Please log in to get suggestions.');
      return;
    }

    try {
      const accessResult = await checkUserAccess(currentUser.id, currentUser.email || '');
      if (!accessResult.hasAccess) {
        toast.error(accessResult.message);
        return;
      }
    } catch (error) {
      console.error('Error checking user access for suggestions:', error);
      toast.error("Unable to verify access. Please try again.");
      return;
    }

    const textToAnalyze = formState.originalCopy || '';

    if (!textToAnalyze.trim()) {
      toast.error('Please enter content in the main field first.');
      return;
    }

    setIsLoadingSuggestions(true);
    setActiveSuggestionField(fieldType);

    try {
      const suggestions = await getSuggestions(
        textToAnalyze,
        fieldType,
        formState.model,
        formState.language,
        currentUser,
        undefined,
        formState.sessionId,
        formState.projectDescription
      );

      if (suggestions && suggestions.length > 0) {
        setCurrentSuggestions(suggestions);
        setCurrentSuggestionField(fieldType);
        setShowSuggestionModal(true);
      } else {
        toast.info('No suggestions available for this field.');
      }
    } catch (error: any) {
      console.error('Error getting suggestions:', error);
      toast.error(`Failed to get suggestions: ${error.message}`);
    } finally {
      setIsLoadingSuggestions(false);
      setActiveSuggestionField(null);
    }
  };

  // Handle suggestion insertion
  const handleInsertSuggestions = (suggestions: string[]) => {
    if (suggestions.length === 0) return;

    const fieldValue = suggestions.join(', ');
    handleChange({
      target: { name: currentSuggestionField, value: fieldValue }
    } as React.ChangeEvent<HTMLInputElement>);

    setShowSuggestionModal(false);
    toast.success(`${suggestions.length} suggestion(s) added to ${currentSuggestionField}`);
  };

  // Function to evaluate the original copy
  const evaluateOriginalCopy = async () => {
    if (!originalCopyField.inputValue) {
      return;
    }
    
    setIsEvaluatingOriginalCopy(true);
    
    try {
      const result = await evaluateContentQuality(
        originalCopyField.inputValue,
        'Original Copy',
        formState.model,
        currentUser
      );
      
      setFormState(prev => ({ ...prev, originalCopyScore: result }));
    } catch (error) {
      console.error('Error evaluating original copy:', error);
    } finally {
      setIsEvaluatingOriginalCopy(false);
    }
  };

  // Handle exporting form as JSON
  const handleExportForm = () => {
    setIsExporting(true);
    
    try {
      const exportData = {
        projectDescription: formState.projectDescription,
        originalCopy: formState.originalCopy,
        language: formState.language,
        tone: formState.tone,
        wordCount: formState.wordCount,
        customWordCount: formState.customWordCount,
        pageType: formState.pageType,
        section: formState.section,
        productServiceName: formState.productServiceName,
        briefDescription: formState.briefDescription,
        excludedTerms: formState.excludedTerms,
        industryNiche: formState.industryNiche,
        targetAudience: formState.targetAudience,
        readerFunnelStage: formState.readerFunnelStage,
        competitorUrls: formState.competitorUrls,
        targetAudiencePainPoints: formState.targetAudiencePainPoints,
        toneLevel: formState.toneLevel,
        preferredWritingStyle: formState.preferredWritingStyle,
        languageStyleConstraints: formState.languageStyleConstraints,
        outputStructure: formState.outputStructure,
        keyMessage: formState.keyMessage,
        desiredEmotion: formState.desiredEmotion,
        callToAction: formState.callToAction,
        brandValues: formState.brandValues,
        keywords: formState.keywords,
        context: formState.context,
        competitorCopyText: formState.competitorCopyText