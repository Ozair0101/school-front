import React from 'react';

interface ProgressBarProps {
  progress: number; // 0-100
  className?: string;
  animated?: boolean;
  showPercentage?: boolean;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ 
  progress, 
  className = '', 
  animated = false,
  showPercentage = false
}) => {
  const clampedProgress = Math.min(100, Math.max(0, progress));
  
  return (
    <div className={`w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 ${className}`}>
      <div 
        className={`bg-primary h-2.5 rounded-full relative ${animated ? 'transition-all duration-1000 ease-out' : ''}`}
        style={{ width: `${clampedProgress}%` }}
      >
        {animated && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-progress-shine" />
        )}
      </div>
      {showPercentage && (
        <div className="text-right text-xs text-gray-500 dark:text-gray-400 mt-1">
          {Math.round(clampedProgress)}%
        </div>
      )}
    </div>
  );
};

export default ProgressBar;
