import React from "react";

interface ClaudeIconProps {
  className?: string;
  size?: number;
}

export function ClaudeIcon({ className = "w-5 h-5", size }: ClaudeIconProps) {
  return (
    <svg 
      className={className}
      width={size}
      height={size}
      fill="currentColor" 
      viewBox="0 0 24 24"
      role="img"
      aria-label="Claude"
    >
      <title>Claude</title>
      <path d="M7.5 2.25C7.5 1.00736 8.50736 0 9.75 0H14.25C15.4926 0 16.5 1.00736 16.5 2.25V21.75C16.5 22.9926 15.4926 24 14.25 24H9.75C8.50736 24 7.5 22.9926 7.5 21.75V2.25Z"/>
      <path d="M2.25 7.5C1.00736 7.5 0 8.50736 0 9.75V14.25C0 15.4926 1.00736 16.5 2.25 16.5H21.75C22.9926 16.5 24 15.4926 24 14.25V9.75C24 8.50736 22.9926 7.5 21.75 7.5H2.25Z"/>
    </svg>
  );
}
