import React, { useState, useEffect } from 'react';
import type { Question } from '../../services/api';

interface ShortQuestionCardProps {
  question: Question;
  selectedValue?: string;
  onValueChange: (value: string) => void;
  isReviewMode?: boolean;
  showExplanation?: boolean;
}

const ShortQuestionCard: React.FC<ShortQuestionCardProps> = ({ 
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isReviewMode) return;
    
    const inputValue = e.target.value;
    setValue(inputValue);
    onValueChange(inputValue);
  };

  // For review mode, we need to determine the correct answer
  const correctAnswer = question.metadata?.correct_answer;
  const showCorrect = isReviewMode && correctAnswer && value.toLowerCase().trim() === correctAnswer.toLowerCase().trim();
  const showIncorrect = isReviewMode && correctAnswer && value.toLowerCase().trim() !== correctAnswer.toLowerCase().trim();

  return (
    <div className="space-y-6">
      <div className="text-lg font-medium text-gray-900 dark:text-white">
        {question.prompt}
      </div>
      
      <div>
        <label htmlFor={`short-${question.id}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Enter your answer:
        </label>
        <input
          type="text"
          id={`short-${question.id}`}
          value={value}
          onChange={handleChange}
          disabled={isReviewMode}
          className={`
            w-full px-4 py-3 text-lg border-2 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all
            ${isReviewMode ? (
              showCorrect 
                ? "border-green-500 bg-green-50 dark:bg-green-900/20" 
                : showIncorrect 
                  ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                  : "border-gray-200 dark:border-gray-700"
            ) : "border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white"}
          `}
          placeholder="Type your answer here"
        />
        
        {isReviewMode && showCorrect && (
          <div className="mt-2 text-green-500 font-bold">✓ Correct</div>
        )}
        
        {isReviewMode && showIncorrect && (
          <div className="mt-2 text-red-500 font-bold">✗ Your answer: {value}</div>
        )}
      </div>
      
      {isReviewMode && showExplanation && question.metadata?.explanation && (
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <h4 className="font-bold text-blue-800 dark:text-blue-200 mb-2">Explanation:</h4>
          <p className="text-blue-700 dark:text-blue-300">{question.metadata.explanation}</p>
        </div>
      )}
      
      {isReviewMode && correctAnswer && (
        <div className="mt-4 text-sm">
          <span className="font-bold">Correct answer:</span> {correctAnswer}
        </div>
      )}
    </div>
  );
};

export default ShortQuestionCard;