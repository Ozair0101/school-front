import React from 'react';

interface ScoreBadgeProps {
  score: number;
  maxScore: number;
  size?: 'sm' | 'md' | 'lg';
  showPercentage?: boolean;
  animated?: boolean;
}

const ScoreBadge: React.FC<ScoreBadgeProps> = ({
  score,
  maxScore,
  size = 'md',
  showPercentage = true,
  animated = false
}) => {
  const percentage = Math.round((score / maxScore) * 100);
  
  const getScoreColor = () => {
    if (percentage >= 90) return 'text-green-600 dark:text-green-400';
    if (percentage >= 80) return 'text-blue-600 dark:text-blue-400';
    if (percentage >= 70) return 'text-yellow-600 dark:text-yellow-400';
    if (percentage >= 60) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };
  
  const getScoreEmoji = () => {
    if (percentage >= 90) return '🏆';
    if (percentage >= 80) return '🥇';
    if (percentage >= 70) return '🥈';
    if (percentage >= 60) return '🥉';
    return '📚';
  };
  
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl'
  };
  
  const containerClasses = `inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white dark:bg-card-dark border border-gray-200 dark:border-gray-700 ${animated ? 'animate-pulse-soft' : ''}`;
  
  return (
    <div className={containerClasses}>
      <span className="text-lg">{getScoreEmoji()}</span>
      <div className={`flex flex-col ${sizeClasses[size]}`}>
        <span className={`font-bold ${getScoreColor()}`}>
          {score}/{maxScore}
        </span>
        {showPercentage && (
          <span className={`text-xs ${getScoreColor()}`}>
            {percentage}%
          </span>
        )}
      </div>
    </div>
  );
};

export default ScoreBadge;
