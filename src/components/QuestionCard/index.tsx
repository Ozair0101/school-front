import React from 'react';
import type { Question, Choice } from '../../services/api';
import MCQQuestionCard from './MCQQuestionCard';
import TFQuestionCard from './TFQuestionCard';
import NumericQuestionCard from './NumericQuestionCard';
import ShortQuestionCard from './ShortQuestionCard';
import EssayQuestionCard from './EssayQuestionCard';
import FileQuestionCard from './FileQuestionCard';

interface QuestionCardProps {
  question: Question;
  selectedAnswer?: any;
  onAnswerChange: (answer: any) => void;
  isReviewMode?: boolean;
  showExplanation?: boolean;
}

const QuestionCard: React.FC<QuestionCardProps> = ({ 
  question, 
  selectedAnswer, 
  onAnswerChange,
  isReviewMode = false,
  showExplanation = false
}) => {
  switch (question.type) {
    case 'mcq':
      return (
        <MCQQuestionCard
          question={question}
          selectedChoice={selectedAnswer}
          onChoiceSelect={onAnswerChange}
          isReviewMode={isReviewMode}
          showExplanation={showExplanation}
        />
      );
      
    case 'tf':
      return (
        <TFQuestionCard
          question={question}
          selectedValue={selectedAnswer}
          onValueChange={onAnswerChange}
          isReviewMode={isReviewMode}
          showExplanation={showExplanation}
        />
      );
      
    case 'numeric':
      return (
        <NumericQuestionCard
          question={question}
          selectedValue={selectedAnswer}
          onValueChange={onAnswerChange}
          isReviewMode={isReviewMode}
          showExplanation={showExplanation}
        />
      );
      
    case 'short':
      return (
        <ShortQuestionCard
          question={question}
          selectedValue={selectedAnswer}
          onValueChange={onAnswerChange}
          isReviewMode={isReviewMode}
          showExplanation={showExplanation}
        />
      );
      
    case 'essay':
      return (
        <EssayQuestionCard
          question={question}
          selectedValue={selectedAnswer}
          onValueChange={onAnswerChange}
          isReviewMode={isReviewMode}
          showExplanation={showExplanation}
        />
      );
      
    case 'file':
      return (
        <FileQuestionCard
          question={question}
          selectedValue={selectedAnswer}
          onValueChange={onAnswerChange}
          isReviewMode={isReviewMode}
          showExplanation={showExplanation}
        />
      );
      
    default:
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 font-medium">Unsupported question type: {question.type}</p>
        </div>
      );
  }
};

export default QuestionCard;