import React from 'react';
import GeneratedCopyCard from '../../../GeneratedCopyCard';
import { GeneratedContentItem, FormState, User } from '../../../../types';

interface ResultsPanelProps {
  generatedVersions: GeneratedContentItem[];
  formState: FormState;
  currentUser?: User;
  onAlternative: (item: GeneratedContentItem) => void;
  onRestyle: (item: GeneratedContentItem, persona: string) => void;
  onScore: (item: GeneratedContentItem) => void;
  onGenerateFaqSchema: (content: string) => void;
  onModify: (item: GeneratedContentItem, instruction: string) => void;
  targetWordCount: number;
}

const ResultsPanel: React.FC<ResultsPanelProps> = ({
  generatedVersions,
  formState,
  currentUser,
  onAlternative,
  onRestyle,
  onScore,
  onGenerateFaqSchema,
  onModify,
  targetWordCount
}) => {
  return (
    <div className="bg-white dark:bg-black border border-gray-300 dark:border-gray-800 rounded-lg p-3 sm:p-6 mx-2 sm:mx-4 lg:mx-24">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Generated Copies</h2>
      
      <div className="space-y-6">
        {generatedVersions.map((card, index) => (
          <GeneratedCopyCard
            key={card.id}
            card={card}
            formState={formState}
            currentUser={currentUser}
            onCreateAlternative={() => onAlternative(card)}
            onApplyVoiceStyle={(persona) => onRestyle(card, persona)}
            onGenerateScore={() => onScore(card)}
            onGenerateFaqSchema={onGenerateFaqSchema}
            onModifyContent={(instruction) => onModify(card, instruction)}
            targetWordCount={targetWordCount}
          />
        ))}
      </div>
    </div>
  );
};

export default ResultsPanel;