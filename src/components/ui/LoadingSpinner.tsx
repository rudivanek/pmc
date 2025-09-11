import React from 'react';
import { cn } from '../../lib/utils';

interface LoadingSpinnerProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'white' | 'gray';
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  className,
  size = 'md',
  color = 'primary'
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  const colorClasses = {
    primary: 'text-gray-500',
    white: 'text-white',
    gray: 'text-gray-700 dark:text-gray-300'
  };

  return (
    <div className={cn('animate-spin border-4 border-gray-500 border-t-transparent', sizeClasses[size], className)} role="status">
      <svg
        className="sr-only"
      >
      </svg>
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export default LoadingSpinner;