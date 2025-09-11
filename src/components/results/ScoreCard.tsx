import React from 'react';

interface ScoreCardProps {
  title?: string; // Add title prop to indicate which version this score is for
  overall: number;
  clarity: string;
  persuasiveness: string;
  toneMatch: string;
  engagement: string;
  wordCountAccuracy?: number; // Added word count accuracy property
  improvementExplanation?: string; // Added prop for the improvement explanation
  isLoading: boolean;
}

const ScoreCard: React.FC<ScoreCardProps> = ({
  title = "Improvement Score",
  overall,
  clarity,
  persuasiveness,
  toneMatch,
  engagement,
  wordCountAccuracy,
  improvementExplanation,
  isLoading
}) => {
  // Get color based on score
  const getScoreColor = (score: number) => {
    if (!score) return 'border-gray-300 text-gray-400 dark:text-gray-500';
    else if (score >= 90) return 'border-gray-600 text-gray-600 dark:text-gray-400'; // Changed from border-green-500, text-green-600
    if (score >= 75) return 'border-gray-700 text-gray-700 dark:text-gray-300'; // Changed from border-blue-500, text-blue-600
    if (score >= 60) return 'border-gray-500 text-gray-500 dark:text-gray-400'; // Changed from border-yellow-500, text-yellow-600
    return 'border-gray-600 text-gray-600 dark:text-gray-500'; // Changed from border-red-500, text-red-600
  };

  // Get background color based on score
  const getScoreBgColor = (score: number) => {
    if (!score) return 'bg-gray-300 dark:bg-gray-600';
    else if (score >= 90) return 'bg-gray-600'; // Changed from bg-green-500
    if (score >= 75) return 'bg-gray-700'; // Changed from bg-blue-500
    if (score >= 60) return 'bg-gray-500'; // Changed from bg-yellow-500
    return 'bg-gray-600'; // Changed from bg-red-500
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-900 p-6 animate-pulse">
        <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-3"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-3"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-3"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h3>
        <div className="flex items-center">
          <div className={`w-14 h-14 rounded-full border-4 ${getScoreColor(overall)} flex items-center justify-center`}>
            <span className="text-lg font-bold text-gray-900 dark:text-white">{isLoading ? "..." : overall || "?"}</span>
          </div>
          <span className={`ml-1 ${getScoreColor(overall)}`}>/100</span>
        </div>
      </div>
      
      <div className="space-y-4">
        {(improvementExplanation || isLoading) && (
          <div className="mb-6 border-b border-gray-300 dark:border-gray-700 pb-4">
            <div className="flex items-center mb-2">
              <span className="text-primary-500 mr-2">★</span>
              <span className="font-medium text-primary-600 dark:text-primary-300">Why it's improved</span>
            </div>
            <p className="text-gray-700 dark:text-gray-300 pl-4 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-md border border-gray-200 dark:border-gray-800">
              {isLoading ? "Analyzing content improvements..." : improvementExplanation || "Analysis in progress..."}
            </p>
          </div>
        )}
        
        {/* Score Breakdown */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-800 dark:text-gray-200 flex items-center">
            <div className="w-1 h-4 bg-gray-300 dark:bg-gray-700 mr-2"></div>
            Score Breakdown
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ScoreItem 
              label="Clarity" 
              description={isLoading ? "Evaluating clarity..." : clarity || "Waiting for analysis..."}
              isLoading={isLoading} 
            />
            <ScoreItem 
              label="Persuasiveness" 
              description={isLoading ? "Evaluating persuasiveness..." : persuasiveness || "Waiting for analysis..."}
              isLoading={isLoading} 
            />
            <ScoreItem 
              label="Tone Match" 
              description={isLoading ? "Evaluating tone match..." : toneMatch || "Waiting for analysis..."}
              isLoading={isLoading} 
            />
            <ScoreItem 
              label="Engagement" 
              description={isLoading ? "Evaluating engagement..." : engagement || "Waiting for analysis..."}
              isLoading={isLoading} 
            />
            
            {/* Add Word Count Accuracy if provided */}
            {(wordCountAccuracy !== undefined || isLoading) && (
              <ScoreItem 
                label="Word Count Accuracy" 
                description={isLoading ? "Evaluating word count match..." : `${wordCountAccuracy || "?"}/100 - ${
                  wordCountAccuracy >= 90 
                    ? 'Excellent match with target word count'
                    : wordCountAccuracy >= 75
                      ? 'Good match with target word count'
                      : wordCountAccuracy >= 60
                        ? 'Acceptable match with target word count'
                        : 'Significant deviation from target word count'
                }`}
                scoreColor={isLoading ? "text-gray-400" : getScoreColor(wordCountAccuracy)}
                isLoading={isLoading}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

interface ScoreItemProps {
  label: string;
  description: string;
  scoreColor?: string;
  isLoading?: boolean;
}

const ScoreItem: React.FC<ScoreItemProps> = ({ label, description, scoreColor, isLoading }) => {
  return (
    <div className={`bg-gray-50 dark:bg-gray-800 rounded-lg p-3 ${isLoading ? 'animate-pulse' : ''}`}>
      <div className="flex items-center mb-1">
        <span className={`${scoreColor || 'text-primary-500'} mr-2`}>•</span>
        <span className="font-medium text-gray-700 dark:text-white">{label}</span>
      </div>
      <p className="text-gray-600 dark:text-gray-400 text-sm pl-6">{description}</p>
    </div>
  );
};

export default React.memo(ScoreCard);