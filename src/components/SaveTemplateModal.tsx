import React, { useState, useEffect } from 'react';
import { X, Check, Globe, Lock } from 'lucide-react';
import { useInputField } from '../hooks/useInputField';
import { FormState } from '../types';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { Tooltip } from './ui/Tooltip';
import { useAuth } from '../hooks/useAuth';
import { getUniqueTemplateCategories } from '../services/supabaseClient';
import CategoryTagsInput from './ui/CategoryTagsInput';

interface SaveTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Update onSave signature to include category
  onSave: (templateName: string, description: string, formStateToSave: FormState, forceSaveAsNew?: boolean, category?: string) => Promise<void>;
  initialTemplateName?: string;
  initialDescription?: string;
  formStateToSave: FormState;
}

const SaveTemplateModal: React.FC<SaveTemplateModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialTemplateName = '',
  initialDescription = '',
  formStateToSave
}) => {
  const { currentUser } = useAuth();
  
  const templateNameField = useInputField({
    value: initialTemplateName,
    onChange: (value) => {}
  });

  const descriptionField = useInputField({
    value: initialDescription,
    onChange: (value) => {}
  });

  const [category, setCategory] = useState(''); // New state for category
  
  const categoryField = useInputField({
    value: category,
    onChange: (value) => setCategory(value)
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isNewTemplate, setIsNewTemplate] = useState(true);
  
  const [isPublic, setIsPublic] = useState(false);
  const [publicName, setPublicName] = useState('');
  const [publicDescription, setPublicDescription] = useState('');
  const [forceSaveAsNew, setForceSaveAsNew] = useState(false);
  const [availableCategories, setAvailableCategories] = useState<{ value: string; label: string }[]>([]);
  
  // Check if user can create public templates
  const canCreatePublicTemplates = currentUser?.email === 'rfv@datago.net';
  
  // Update the template name field when initialTemplateName changes
  useEffect(() => {
    templateNameField.setInputValue(initialTemplateName);
    setIsNewTemplate(!initialTemplateName); // This line is unchanged
  }, [initialTemplateName]);
  
  // Update description field when initialDescription changes
  useEffect(() => {
    descriptionField.setInputValue(initialDescription);
  }, [initialDescription]);
  
  // Reset public fields and category when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setIsPublic(false);
      setPublicName('');
      setPublicDescription('');
      setCategory('');
      categoryField.setInputValue('');
      
      // Fetch unique categories when modal opens
      const fetchCategories = async () => {
        const { data, error } = await getUniqueTemplateCategories();
        if (error) {
          console.error('Error fetching template categories:', error);
        } else {
          setAvailableCategories(data || []);
        }
      };
      fetchCategories();
    }
  }, [isOpen]);
  
  // Track if the name has changed from the original
  useEffect(() => {
    if (initialTemplateName && templateNameField.inputValue !== initialTemplateName) {
      setIsNewTemplate(true);
    } else if (initialTemplateName && templateNameField.inputValue === initialTemplateName) {
      setIsNewTemplate(false);
    } else {
      setIsNewTemplate(true);
    }
  }, [templateNameField.inputValue, initialTemplateName]);

  const handleSave = async () => {
    console.log('🔘 SAVE BUTTON CLICKED');
    console.log('Template name:', templateNameField.inputValue);
    console.log('Is public:', isPublic);
    console.log('Public name:', publicName);
    
    if (!templateNameField.inputValue.trim()) {
      console.log('❌ Validation failed: empty template name');
      alert('Please provide a template name.');
      return;
    }
    
    // Validate public template fields if making public
    if (isPublic && !publicName.trim()) {
      console.log('❌ Validation failed: empty public name');
      alert('Please provide a public display name for this template.');
      return;
    }

    // Validate category field
    if (!categoryField.inputValue.trim()) {
      alert('Please provide a category for the template.');
      return;
    }
    
    console.log('✅ Validation passed, calling onSave...');

    setIsSaving(true);
    try {
      console.log('📤 About to call onSave with public fields:', {
        is_public: isPublic,
        public_name: isPublic ? publicName.trim() : undefined,
        public_description: isPublic ? publicDescription.trim() : undefined
      });
      
      await onSave(
        templateNameField.inputValue, 
        descriptionField.inputValue,
        {
          ...formStateToSave,
          is_public: isPublic,
          public_name: isPublic ? publicName.trim() : undefined,
          public_description: isPublic ? publicDescription.trim() : undefined
        },
        forceSaveAsNew,
        categoryField.inputValue // Pass the category state
      );
      console.log('✅ Template save completed successfully');
      console.log('🔄 Closing modal...');
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const getModalTitle = () => {
    switch (mode) {
      case 'add': return 'Save New Prefill'; // This modal is for templates, not prefills. This title should be adjusted.
      case 'edit': return 'Update Prefill'; // This modal is for templates, not prefills. This title should be adjusted.
      case 'clone': return 'Save Cloned Prefill'; // This modal is for templates, not prefills. This title should be adjusted.
      default: return 'Save Template'; // Default title for template saving
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 dark:bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-black rounded-lg border border-gray-300 dark:border-gray-700 max-w-md w-full max-h-[90vh] flex flex-col">
        <div className="p-4 border-b border-gray-300 dark:border-gray-800 flex justify-between items-center">
          <h3 className="text-lg font-medium text-black dark:text-white">Save as Template</h3>
          <button
            onClick={onClose}
            className="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white"
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          <div className="mb-4">
            <label htmlFor="templateName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Template Name
            </label>
            <input
              type="text"
              id="templateName"
              required
              className="bg-white dark:bg-black border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5"
              placeholder="Enter a name for this template"
              value={templateNameField.inputValue}
              onChange={templateNameField.handleChange}
              onBlur={templateNameField.handleBlur}
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description (Optional)
            </label>
            <textarea
              id="description"
              rows={3}
              className="bg-white dark:bg-black border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5"
              placeholder="Briefly describe this template"
              value={descriptionField.inputValue}
              onChange={descriptionField.handleChange}
              onBlur={descriptionField.handleBlur}
            />
          </div>

          {/* NEW CATEGORY FIELD */}
          <div className="mb-4">
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Category *
            </label>
            <CategoryTagsInput
              id="category"
              name="category"
              placeholder="Select or type a category..."
              value={categoryField.inputValue}
              onChange={(value) => {
                // Allow multiple categories separated by commas
                categoryField.setInputValue(value);
              }}
              categories={[{ category: 'Existing Categories', options: availableCategories }]}
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Organize your templates by categories (e.g., "Email, Marketing", "Social Media, Content"). You can add multiple categories separated by commas.
            </p>
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            This will save your current settings as a template that you can reuse later.
          </p>
          
          {/* Save as New Template Option - Only show when editing an existing template */}
          {initialTemplateName && (
            <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="forceSaveAsNew"
                  checked={forceSaveAsNew}
                  onCheckedChange={(checked) => setForceSaveAsNew(checked === true)}
                />
                <Label htmlFor="forceSaveAsNew" className="cursor-pointer">
                  <span className="text-sm font-medium">
                    Save as a new template (don't update existing)
                  </span>
                </Label>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 ml-6">
                Check this to create a new template instead of updating "{initialTemplateName}"
              </p>
            </div>
          )}
          
          {initialTemplateName && (
            <div className={`mb-4 p-3 rounded-md ${isNewTemplate || forceSaveAsNew ? 'bg-gray-50 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300' : 'bg-gray-50 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300'}`}>
              {isNewTemplate || forceSaveAsNew ? (
                <p className="text-sm">Creating a new template with a different name.</p>
              ) : (
                <p className="text-sm">Updating the existing template <strong>"{initialTemplateName}"</strong>.</p>
              )}
            </div>
          )}
          
          {/* Public Template Section - Only show to authorized users */}
          {canCreatePublicTemplates && (
            <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2 mb-3">
                <Checkbox
                  id="isPublic"
                  checked={isPublic}
                  onCheckedChange={(checked) => {
                    setIsPublic(checked === true);
                    if (checked === true) {
                      // Pre-fill public name with template name when making public
                      setPublicName(templateNameField.inputValue);
                    } else {
                      // Clear public name when making private
                      setPublicName('');
                    }
                  }}
                />
                <Label htmlFor="isPublic" className="cursor-pointer flex items-center">
                  {isPublic ? (
                    <Globe size={16} className="mr-1.5 text-gray-500" />
                  ) : (
                    <Lock size={16} className="mr-1.5 text-gray-500" />
                  )}
                  <span className="text-sm font-medium">
                    Make this template public for all users
                  </span>
                  <Tooltip content="Public templates can be used by all users on the platform. They will appear in everyone's template list.">
                    <span className="ml-1 text-gray-400 cursor-help">ⓘ</span>
                  </Tooltip>
                </Label>
              </div>
              
              {isPublic && (
                <div className="space-y-3 pl-6">
                  <div>
                    <label htmlFor="publicName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Public Display Name *
                    </label>
                    <input
                      type="text"
                      id="publicName"
                      required={isPublic}
                      className="bg-white dark:bg-black border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5"
                      placeholder="e.g., Professional Homepage Template"
                      value={publicName}
                      onChange={(e) => setPublicName(e.target.value)}
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      This name will be displayed to all users
                    </p>
                  </div>
                  
                  <div>
                    <label htmlFor="publicDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Public Description
                    </label>
                    <textarea
                      id="publicDescription"
                      rows={2}
                      className="bg-white dark:bg-black border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5"
                      placeholder="Describe what this template is for and when to use it..."
                      value={publicDescription}
                      onChange={(e) => setPublicDescription(e.target.value)}
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Help other users understand when to use this template
                    </p>
                  </div>
                  
                  <div className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20 p-2 rounded border border-gray-200 dark:border-gray-800">
                    <strong>Note:</strong> Public templates will be visible to all users. Make sure you don't include any sensitive or proprietary information.
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="flex-shrink-0 p-4 border-t border-gray-300 dark:border-gray-800 flex justify-end">
          <button
            onClick={onClose}
            className="bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white px-4 py-2 rounded-md text-sm mr-2"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 text-sm flex items-center"
            disabled={!templateNameField.inputValue.trim() || isSaving || (isPublic && !publicName.trim()) || !categoryField.inputValue.trim()}
          >
            {isSaving ? (
              "Saving..."
            ) : (
              <>
                <Check size={16} className="mr-1.5" />
                {isNewTemplate || forceSaveAsNew ? 'Save as New Template' : 'Update Template'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SaveTemplateModal;