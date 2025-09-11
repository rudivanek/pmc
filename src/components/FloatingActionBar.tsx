import React, { useState } from 'react';
import { Save, FileText, Download, Code, FileJson } from 'lucide-react';
import { FormState, GeneratedContentItem, User } from '../types';
import { formatCopyResultAsMarkdown } from '../utils/copyFormatter';
import { stripMarkdown } from '../utils/markdownUtils';
import { toast } from 'react-hot-toast';

interface FloatingActionBarProps {
  formState: FormState;
  generatedOutputCards: GeneratedContentItem[];
  originalInputScore?: any;
  currentUser?: User;
  onSaveOutput: () => void;
  onViewPrompts: () => void;
  onGenerateFaqSchema: () => void;
}

const FloatingActionBar: React.FC<FloatingActionBarProps> = ({
  formState,
  generatedOutputCards,
  originalInputScore,
  currentUser,
  onSaveOutput,
  onViewPrompts,
  onGenerateFaqSchema // Destructure new prop
}) => {
  const [isVisible, setIsVisible] = useState(true);
  
  // Check if current user is admin
  const isAdmin = currentUser?.email === 'rfv@datago.net';

  // Check if we have any content to work with
  const hasContent = (generatedOutputCards && generatedOutputCards.length > 0) || 
                    originalInputScore;

  // Don't render if no content is available
  if (!hasContent) {
    return null;
  }

  // Handle copying all content as markdown
  const handleCopyAllMarkdown = () => {
    try {
      const markdown = formatCopyResultAsMarkdown(
        formState,
        generatedOutputCards,
        originalInputScore,
        formState.promptEvaluation,
        true // includeInputs
      );
      
      navigator.clipboard.writeText(markdown);
      toast.success('Content copied as Markdown!');
    } catch (error) {
      console.error('Error copying markdown:', error);
      toast.error('Failed to copy content as Markdown');
    }
  };

  // Handle exporting to text file
  const handleExportToText = () => {
    try {
      // Convert to markdown first, then strip markdown formatting
      const markdown = formatCopyResultAsMarkdown(
        formState,
        generatedOutputCards,
        originalInputScore,
        formState.promptEvaluation,
        true // includeInputs
      );
      
      const plainText = stripMarkdown(markdown);
      
      // Create and download the file
      const blob = new Blob([plainText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `copy-output-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('Content exported to text file!');
    } catch (error) {
      console.error('Error exporting to text:', error);
      toast.error('Failed to export content to text file');
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed top-1/2 right-4 transform -translate-y-1/2 z-40">
      <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg p-2 space-y-2">
        {/* Save Output */}
        <button
          onClick={onSaveOutput}
          className="w-10 h-10 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
          title="Save Output"
          disabled={!generatedOutputCards || generatedOutputCards.length === 0}
        >
          <Save size={18} />
        </button>

        {/* Copy as Markdown */}
        <button
          onClick={handleCopyAllMarkdown}
          className="w-10 h-10 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
          title="Copy as Markdown"
        >
          <FileText size={18} />
        </button>

        {/* Export to Text */}
        <button
          onClick={handleExportToText}
          className="w-10 h-10 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
          title="Export to Text"
        >
          <Download size={18} />
        </button>

        {/* View Prompts */}
        {isAdmin && (
          <button
            onClick={onViewPrompts}
            className="w-10 h-10 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
            title="View Prompts"
          >
            <Code size={18} />
          </button>
        )}
      </div>
    </div>
  );
};

export default FloatingActionBar;