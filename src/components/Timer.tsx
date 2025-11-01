import React, { useState, useEffect, useCallback } from 'react';
import { useServerTimeSync } from '../hooks/useServerTimeSync';

interface TimerProps {
  initialTime: number; // in seconds
  onTimeUp?: () => void;
  onWarning?: (timeLeft: number) => void;
  warningTimes?: number[]; // in seconds (e.g., [300, 60] for 5min and 1min warnings)
}

const Timer: React.FC<TimerProps> = ({ 
  initialTime, 
  onTimeUp, 
  onWarning,
  warningTimes = [300, 60] // 5 minutes and 1 minute warnings
}) => {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(true);
  const { getAdjustedTime, offset } = useServerTimeSync();

  // Format time for display
  const formatTime = useCallback((seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Timer effect
  useEffect(() => {
    if (!isRunning || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        const newTime = prev - 1;
        
        // Check for warnings
        if (warningTimes.includes(newTime)) {
          onWarning?.(newTime);
        }
        
        // Time's up
        if (newTime <= 0) {
          setIsRunning(false);
          onTimeUp?.();
          return 0;
        }
        
        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, warningTimes, onTimeUp, onWarning]);

  // Sync with server time periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const serverTime = getAdjustedTime();
      const expectedTimeLeft = initialTime - Math.floor((serverTime.getTime() - new Date().getTime() + offset) / 1000);
      
      // Only adjust if difference is significant (more than 5 seconds)
      if (Math.abs(timeLeft - expectedTimeLeft) > 5) {
        setTimeLeft(Math.max(0, expectedTimeLeft));
      }
    }, 30000); // Sync every 30 seconds

    return () => clearInterval(interval);
  }, [initialTime, offset, getAdjustedTime, timeLeft]);

  // Calculate progress percentage
  const progress = (timeLeft / initialTime) * 100;

  // Determine color based on time left
  const getColorClass = () => {
    if (timeLeft <= 60) return 'text-red-500';
    if (timeLeft <= 300) return 'text-orange-500';
    return 'text-green-500';
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-32">
        {/* Progress circle */}
        <svg className="w-full h-full" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="8"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 45}`}
            strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
            className={getColorClass()}
            transform="rotate(-90 50 50)"
          />
        </svg>
        
        {/* Time display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-2xl font-bold ${getColorClass()}`}>
            {formatTime(timeLeft)}
          </span>
          <span className="text-xs text-gray-500 mt-1">TIME LEFT</span>
        </div>
      </div>
      
      {/* Warning messages */}
      {timeLeft <= 60 && (
        <div className="mt-2 text-red-500 font-bold animate-pulse">
          ⏰ Hurry up! Time is running out!
        </div>
      )}
      {timeLeft <= 300 && timeLeft > 60 && (
        <div className="mt-2 text-orange-500 font-medium">
          ⏱️ {Math.ceil(timeLeft / 60)} minutes remaining
        </div>
      )}
    </div>
  );
};

export default Timer;