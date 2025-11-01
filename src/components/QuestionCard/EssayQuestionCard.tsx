import React, { useState, useEffect } from 'react';
import type { Question } from '../../services/api';

interface EssayQuestionCardProps {
  question: Question;
  selectedValue?: string;
  onValueChange: (value: string) => void;
  isReviewMode?: boolean;
  showExplanation?: boolean;
}

const EssayQuestionCard: React.FC<EssayQuestionCardProps> = ({ 
  question, 
  selectedValue, 
  onValueChange,
  isReviewMode = false,
  showExplanation = false
}) => {
  const [value, setValue] = useState<string>(selectedValue || '');

  useEffect(() => {
    if (selectedValue !== undefined) {
      setValue(selectedValue);
    }
  }, [selectedValue]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (isReviewMode) return;
    
    const inputValue = e.target.value;
    setValue(inputValue);
    onValueChange(inputValue);
  };

  // For review mode, we show the submitted answer
  // Essay questions typically require manual grading

  return (
    <div className="space-y-6">
      <div className="text-lg font-medium text-gray-900 dark:text-white">
        {question.prompt}
      </div>
      
      <div>
        <label htmlFor={`essay-${question.id}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Your response:
        </label>
        <textarea
          id={`essay-${question.id}`}
          value={value}
          onChange={handleChange}
          disabled={isReviewMode}
          rows={8}
          className={`
            w-full px-4 py-3 text-lg border-2 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all
            ${isReviewMode 
              ? "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800" 
              : "border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white"}
          `}
          placeholder="Write your detailed answer here..."
        />
        
        {isReviewMode && (
          <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            This question requires manual grading by your instructor.
          </div>
        )}
      </div>
      
      {isReviewMode && showExplanation && question.metadata?.explanation && (
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <h4 className="font-bold text-blue-800 dark:text-blue-200 mb-2">Grading criteria:</h4>
          <p className="text-blue-700 dark:text-blue-300">{question.metadata.explanation}</p>
        </div>
      )}
      
      {isReviewMode && value && (
        <div className="mt-4">
          <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-2">Your response:</h4>
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{value}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default EssayQuestionCard;