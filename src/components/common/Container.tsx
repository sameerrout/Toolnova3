import React from 'react';
import { cn } from '@/lib/utils/cn';

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export function Container({
  children,
  className,
  size = 'lg',
  ...props
}: ContainerProps) {
  const sizeClasses = {
    sm: 'max-w-3xl',
    md: 'max-w-5xl',
    lg: 'max-w-7xl',
    xl: 'max-w-[1400px]',
    full: 'max-w-full',
  };

  return (
    <div
      className={cn(
        'mx-auto w-full px-4 sm:px-6 lg:px-8',
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

