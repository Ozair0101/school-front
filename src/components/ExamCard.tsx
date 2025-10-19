import React from 'react';
import { Exam } from '../types';
import Button from './Button';

interface ExamCardProps {
  exam: Exam;
  onStartExam: (examId: string) => void;
  onViewResults?: (examId: string) => void;
}

const ExamCard: React.FC<ExamCardProps> = ({ exam, onStartExam, onViewResults }) => {
  const getStatusColor = () => {
    switch (exam.status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
    }
  };

  const getStatusText = () => {
    switch (exam.status) {
      case 'completed':
        return 'Completed';
      case 'in-progress':
        return 'In Progress';
      default:
        return 'Upcoming';
    }
  };

  return (
    <div className="exam-card">
      {exam.image && (
        <div 
          className="w-full sm:w-1/3 h-48 sm:h-auto bg-cover bg-center"
          style={{ backgroundImage: `url(${exam.image})` }}
        />
      )}
      <div className="p-6 flex flex-col justify-between flex-1">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-primary">{exam.subject}</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}>
              {getStatusText()}
            </span>
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">
            {exam.title}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
            {exam.description}
          </p>
          <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
            <span>📅 Due: {new Date(exam.dueDate).toLocaleDateString()}</span>
            <span>⏱️ {exam.duration} min</span>
            <span>❓ {exam.totalQuestions} questions</span>
          </div>
          {exam.score !== undefined && (
            <div className="mt-3 p-2 bg-primary/10 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-primary">Your Score</span>
                <span className="text-lg font-bold text-primary">
                  {exam.score}/{exam.maxScore} ({Math.round((exam.score / exam.maxScore) * 100)}%)
                </span>
              </div>
            </div>
          )}
        </div>
        <div className="mt-4 flex gap-2">
          {exam.status === 'upcoming' && (
            <Button
              onClick={() => onStartExam(exam.id)}
              className="flex-1 sm:flex-none"
              icon={<span>🚀</span>}
            >
              Start Exam
            </Button>
          )}
          {exam.status === 'in-progress' && (
            <Button
              onClick={() => onStartExam(exam.id)}
              className="flex-1 sm:flex-none"
              icon={<span>▶️</span>}
            >
              Continue
            </Button>
          )}
          {exam.status === 'completed' && onViewResults && (
            <Button
              onClick={() => onViewResults(exam.id)}
              variant="secondary"
              className="flex-1 sm:flex-none"
              icon={<span>📊</span>}
            >
              View Results
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExamCard;
