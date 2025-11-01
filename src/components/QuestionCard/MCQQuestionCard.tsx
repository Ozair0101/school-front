import React, { useState } from 'react';
import type { Question, Choice } from '../../services/api';

interface MCQQuestionCardProps {
  question: Question;
  selectedChoice?: string;
  onChoiceSelect: (choiceId: string) => void;
  isReviewMode?: boolean;
  showExplanation?: boolean;
}

const MCQQuestionCard: React.FC<MCQQuestionCardProps> = ({ 
  question, 
  selectedChoice, 
  onChoiceSelect,
  isReviewMode = false,
  showExplanation = false
}) => {
  const [selected, setSelected] = useState<string | undefined>(selectedChoice);

  const handleChoiceSelect = (choiceId: string) => {
    if (isReviewMode) return;
    
    setSelected(choiceId);
    onChoiceSelect(choiceId);
  };

  // Find the correct choice for review mode
  const correctChoice = question.choices?.find(choice => choice.is_correct);

  return (
    <div className="space-y-4">
      <div className="text-lg font-medium text-gray-900 dark:text-white">
        {question.prompt}
      </div>
      
      <div className="space-y-3">
        {question.choices?.map((choice) => {
          const isSelected = selected === choice.id;
          const isCorrect = choice.is_correct;
          const showCorrect = isReviewMode && isCorrect;
          const showIncorrect = isReviewMode && isSelected && !isCorrect;
          
          let choiceClasses = "flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ";
          
          if (isReviewMode) {
            if (showCorrect) {
              choiceClasses += "border-green-500 bg-green-50 dark:bg-green-900/20";
            } else if (showIncorrect) {
              choiceClasses += "border-red-500 bg-red-50 dark:bg-red-900/20";
            } else {
              choiceClasses += "border-gray-200 dark:border-gray-700";
            }
          } else {
            choiceClasses += isSelected 
              ? "border-primary bg-primary/10 dark:bg-primary/20" 
              : "border-gray-200 dark:border-gray-700 hover:border-primary dark:hover:border-primary";
          }
          
          return (
            <label 
              key={choice.id}
              className={choiceClasses}
            >
              <input 
                type="radio"
                name={`question-${question.id}`}
                checked={isSelected}
                onChange={() => handleChoiceSelect(choice.id)}
                disabled={isReviewMode}
                className="appearance-none size-6 rounded-full border-2 border-gray-300 dark:border-gray-600 checked:bg-primary checked:border-primary focus:ring-primary/50 focus:ring-2 focus:ring-offset-2 focus:ring-offset-background-light dark:focus:ring-offset-background-dark transition-all"
              />
              <span className="text-base font-medium text-gray-800 dark:text-gray-200">
                {choice.choice_text}
              </span>
              {showCorrect && (
                <span className="ml-auto text-green-500 font-bold">✓ Correct</span>
              )}
              {showIncorrect && (
                <span className="ml-auto text-red-500 font-bold">✗ Your answer</span>
              )}
            </label>
          );
        })}
      </div>
      
      {isReviewMode && showExplanation && question.metadata?.explanation && (
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <h4 className="font-bold text-blue-800 dark:text-blue-200 mb-2">Explanation:</h4>
          <p className="text-blue-700 dark:text-blue-300">{question.metadata.explanation}</p>
        </div>
      )}
      
      {isReviewMode && correctChoice && (
        <div className="mt-4 text-sm text-green-600 dark:text-green-400">
          <span className="font-bold">Correct answer:</span> {correctChoice.choice_text}
        </div>
      )}
    </div>
  );
};

export default MCQQuestionCard;