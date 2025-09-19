import React, { useState } from 'react';
import { X, Lightbulb, Copy, Check, Zap } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { generateTemplateJsonSuggestion } from '../services/apiService';
import { User } from '../types';

interface TemplateSuggestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: User;
  onApplyToForm?: (templateData: Partial<FormState>) => void;
}

const TemplateSuggestionModal: React.FC<TemplateSuggestionModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onApplyToForm
}) => {
  const [instruction, setInstruction] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedJson, setGeneratedJson] = useState('');
  const [generatedData, setGeneratedData] = useState<Partial<FormState> | null>(null);
  const [copied, setCopied] = useState(false);

  // Reset state when modal opens/closes
  React.useEffect(() => {
    if (isOpen) {
      setInstruction('');
      setGeneratedJson('');
      setGeneratedData(null);
      setCopied(false);
    }
  }, [isOpen]);

  const handleGenerate = async () => {
    if (!instruction.trim()) {
      toast.error('Please enter an instruction');
      return;
    }

    if (!currentUser) {
      toast.error('User not authenticated');
      return;
    }

    setIsGenerating(true);
    try {
      const jsonSuggestion = await generateTemplateJsonSuggestion(
        instruction.trim(),
        currentUser
      );
      
      // Format the JSON with proper indentation
      const formattedJson = JSON.stringify(jsonSuggestion, null, 2);
      setGeneratedJson(formattedJson);
      setGeneratedData(jsonSuggestion);
      toast.success('Template JSON generated successfully!');
    } catch (error: any) {
      console.error('Error generating template JSON:', error);
      toast.error(`Failed to generate template JSON: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyJson = async () => {
    if (!generatedJson) return;
    
    try {
      await navigator.clipboard.writeText(generatedJson);
      setCopied(true);
      toast.success('JSON copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy JSON');
    }
  };

  const handleApplyToForm = () => {
    if (!generatedData || !onApplyToForm) return;
    
    try {
      onApplyToForm(generatedData);
      toast.success('Template applied to form fields!');
      onClose();
    } catch (error) {
      console.error('Error applying template to form:', error);
      toast.error('Failed to apply template to form');
    }
  };
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-300 dark:border-gray-700 max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="p-4 border-b border-gray-300 dark:border-gray-800 flex justify-between items-center">
          <h3 className="text-lg font-medium text-black dark:text-white flex items-center">
            <Lightbulb size={20} className="mr-2 text-primary-500" />
            Natural Language Prompt Generator
          </h3>
          <button
            onClick={onClose}
            className="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white"
            disabled={isGenerating}
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Instruction Input */}
          <div>
            <label htmlFor="instruction" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Natural Language Prompt
            </label>
            <textarea
              id="instruction"
              rows={4}
              className="bg-white dark:bg-black border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-3"
              placeholder="e.g., a blogpost for twitter marketing, make 400 words long, include SEO metadata, target social media managers..."
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              disabled={isGenerating}
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Describe what kind of prompt  you want to generate. Be specific about content type, word count, target audience, features, etc.
            </p>
          </div>

          {/* Generate Button */}
          <div className="flex justify-center">
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !instruction.trim()}
              className="bg-primary-600 hover:bg-primary-500 text-white px-6 py-3 rounded-lg text-sm flex items-center transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Generating Template JSON...
                </>
              ) : (
                <>
                  <Zap size={16} className="mr-2" />
                  Generate JSON Prompt
                </>
              )}
            </button>
          </div>

          {/* JSON Output */}
          {generatedJson && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Generated JSON Prompt
                </label>
                <button
                  onClick={handleCopyJson}
                  className="bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-800 dark:text-white px-3 py-2 rounded-md text-sm flex items-center"
                >
                  {copied ? (
                    <>
                      <Check size={16} className="mr-1.5 text-green-500 dark:text-green-400" />
                      <span className="text-green-500 dark:text-green-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={16} className="mr-1.5" />
                      Copy JSON
                    </>
                  )}
                </button>
              </div>
                  {onApplyToForm && generatedData && (
                    <button
                      onClick={handleApplyToForm}
                      className="bg-primary-600 hover:bg-primary-500 text-white px-3 py-2 rounded-md text-sm flex items-center"
                    >
                      <Zap size={16} className="mr-1.5" />
                      Apply to Form
                    </button>
                  )}
              <div className="bg-gray-100 dark:bg-gray-800 rounded-md p-4 border border-gray-200 dark:border-gray-700">
                <pre className="text-xs text-gray-700 dark:text-gray-300 font-mono whitespace-pre-wrap overflow-x-auto max-h-96 overflow-y-auto custom-scrollbar">
                  <code>{generatedJson}</code>
                </pre>
              </div>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                This JSON can be used as a template data structure for prefills or form state initialization.
              </p>
            </div>
          )}
        </div>
        
        <div className="flex-shrink-0 p-4 border-t border-gray-300 dark:border-gray-800 flex justify-end">
          <button
            onClick={onClose}
            className="bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white px-4 py-2 rounded-md text-sm hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
            disabled={isGenerating}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TemplateSuggestionModal;