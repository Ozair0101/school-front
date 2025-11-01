import React, { useState } from 'react';
import type { Question } from '../../services/api';

interface TFQuestionCardProps {
  question: Question;
  selectedValue?: boolean;
  onValueChange: (value: boolean) => void;
  isReviewMode?: boolean;
  showExplanation?: boolean;
}

const TFQuestionCard: React.FC<TFQuestionCardProps> = ({ 
  question, 
  selectedValue, 
  onValueChange,
  isReviewMode = false,
  showExplanation = false
}) => {
  const [selected, setSelected] = useState<boolean | undefined>(selectedValue);

  const handleValueChange = (value: boolean) => {
    if (isReviewMode) return;
    
    setSelected(value);
    onValueChange(value);
  };

  // For review mode, we need to determine the correct answer
  // This would typically come from the backend
  const correctAnswer = question.metadata?.correct_answer ?? true; // Default to true if not specified
  const showCorrect = isReviewMode && selected === correctAnswer;
  const showIncorrect = isReviewMode && selected !== undefined && selected !== correctAnswer;

  return (
    <div className="space-y-6">
      <div className="text-lg font-medium text-gray-900 dark:text-white">
        {question.prompt}
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          type="button"
          onClick={() => handleValueChange(true)}
          disabled={isReviewMode}
          className={`
            flex-1 p-4 rounded-lg border-2 text-center font-medium transition-all duration-200
            ${isReviewMode ? (
              selected === true ? (
                selected === correctAnswer 
                  ? "border-green-500 bg-green-50 dark:bg-green-900/20" 
                  : "border-red-500 bg-red-50 dark:bg-red-900/20"
              ) : correctAnswer === true 
                ? "border-green-500 bg-green-50 dark:bg-green-900/20" 
                : "border-gray-200 dark:border-gray-700"
            ) : selected === true 
              ? "border-primary bg-primary/10 dark:bg-primary/20" 
              : "border-gray-200 dark:border-gray-700 hover:border-primary dark:hover:border-primary"
            }
          `}
        >
          <span className="text-2xl block mb-2">✓</span>
          True
          {isReviewMode && selected === true && selected === correctAnswer && (
            <span className="block mt-2 text-green-500 font-bold">✓ Correct</span>
          )}
          {isReviewMode && selected === true && selected !== correctAnswer && (
            <span className="block mt-2 text-red-500 font-bold">✗ Your answer</span>
          )}
          {isReviewMode && selected !== true && correctAnswer === true && (
            <span className="block mt-2 text-green-500 font-bold">✓ Correct answer</span>
          )}
        </button>
        
        <button
          type="button"
          onClick={() => handleValueChange(false)}
          disabled={isReviewMode}
          className={`
            flex-1 p-4 rounded-lg border-2 text-center font-medium transition-all duration-200
            ${isReviewMode ? (
              selected === false ? (
                selected === correctAnswer 
                  ? "border-green-500 bg-green-50 dark:bg-green-900/20" 
                  : "border-red-500 bg-red-50 dark:bg-red-900/20"
              ) : correctAnswer === false 
                ? "border-green-500 bg-green-50 dark:bg-green-900/20" 
                : "border-gray-200 dark:border-gray-700"
            ) : selected === false 
              ? "border-primary bg-primary/10 dark:bg-primary/20" 
              : "border-gray-200 dark:border-gray-700 hover:border-primary dark:hover:border-primary"
            }
          `}
        >
          <span className="text-2xl block mb-2">✗</span>
          False
          {isReviewMode && selected === false && selected === correctAnswer && (
            <span className="block mt-2 text-green-500 font-bold">✓ Correct</span>
          )}
          {isReviewMode && selected === false && selected !== correctAnswer && (
            <span className="block mt-2 text-red-500 font-bold">✗ Your answer</span>
          )}
          {isReviewMode && selected !== false && correctAnswer === false && (
            <span className="block mt-2 text-green-500 font-bold">✓ Correct answer</span>
          )}
        </button>
      </div>
      
      {isReviewMode && showExplanation && question.metadata?.explanation && (
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <h4 className="font-bold text-blue-800 dark:text-blue-200 mb-2">Explanation:</h4>
          <p className="text-blue-700 dark:text-blue-300">{question.metadata.explanation}</p>
        </div>
      )}
      
      {isReviewMode && (
        <div className="mt-4 text-sm">
          <span className="font-bold">Correct answer:</span> {correctAnswer ? 'True' : 'False'}
        </div>
      )}
    </div>
  );
};

export default TFQuestionCard;