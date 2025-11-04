import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  loading?: boolean;
  icon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  loading = false,
  icon,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses = 'font-bold rounded-lg transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-primary/30 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'bg-primary text-black hover:bg-primary/90 transform hover:scale-105',
    secondary: 'bg-white dark:bg-card-dark text-black dark:text-black border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-primary',
    outline: 'border-2 border-gray-300 dark:border-gray-600 text-black dark:text-black hover:border-primary hover:text-black dark:hover:text-black',
    ghost: 'text-black dark:text-black hover:text-black dark:hover:text-black hover:bg-gray-100 dark:hover:bg-gray-800'
  };
  
  const sizeClasses = {
    sm: 'py-2 px-4 text-sm',
    md: 'py-3 px-6 text-base',
    lg: 'py-4 px-8 text-lg'
  };
  
  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;
  
  return (
    <button
      className={classes}
      disabled={disabled || loading}
      {...props}
    >
      <div className="flex items-center justify-center gap-2">
        {loading && (
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
        )}
        {!loading && icon && <span>{icon}</span>}
        {children}
      </div>
    </button>
  );
};

export default Button;
