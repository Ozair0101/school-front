import React from 'react';
import { User } from '../types';

interface HeaderProps {
  user?: User;
  title?: string;
  showTimer?: boolean;
  timeRemaining?: number;
  onHelp?: () => void;
}

const Header: React.FC<HeaderProps> = ({
  user,
  title = "ExamPrep",
  showTimer = false,
  timeRemaining,
  onHelp
}) => {
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <header className="sticky top-0 z-10 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 text-primary">
              <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path d="M36.7273 44C33.9891 44 31.6043 39.8386 30.3636 33.69C29.123 39.8386 26.7382 44 24 44C21.2618 44 18.877 39.8386 17.6364 33.69C16.3957 39.8386 14.0109 44 11.2727 44C7.25611 44 4 35.0457 4 24C4 12.9543 7.25611 4 11.2727 4C14.0109 4 16.3957 8.16144 17.6364 14.31C18.877 8.16144 21.2618 4 24 4C26.7382 4 29.123 8.16144 30.3636 14.31C31.6043 8.16144 33.9891 4 36.7273 4C40.7439 4 44 12.9543 44 24C44 35.0457 40.7439 44 36.7273 44Z" fill="currentColor"></path>
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h1>
          </div>
          
          <div className="flex items-center gap-4">
            {showTimer && timeRemaining !== undefined && (
              <div className="flex items-center gap-2 text-primary">
                <span className="material-symbols-outlined">timer</span>
                <span className="font-bold text-lg">{formatTime(timeRemaining)}</span>
              </div>
            )}
            
            {onHelp && (
              <button 
                onClick={onHelp}
                className="flex items-center justify-center size-10 rounded-full bg-primary/10 dark:bg-primary/20 text-primary hover:bg-primary/20 dark:hover:bg-primary/30 transition-colors"
              >
                <span className="material-symbols-outlined">help_outline</span>
              </button>
            )}
            
            {user && (
              <div 
                className="size-10 rounded-full bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: user.avatar ? `url(${user.avatar})` : undefined }}
              >
                {!user.avatar && (
                  <div className="w-full h-full bg-primary rounded-full flex items-center justify-center text-white font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
