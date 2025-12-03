import type * as React from 'react';

interface TagProps {
  children: React.ReactNode;
  className?: string;
}

export function Tag({ children, className = '' }: TagProps) {
  return (
    <span
      className={`inline-flex items-center rounded-md bg-fd-secondary px-2 py-0.5 text-xs font-medium text-fd-secondary-foreground ${className}`}
    >
      {children}
    </span>
  );
}
