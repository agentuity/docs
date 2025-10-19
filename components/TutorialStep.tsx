'use client';

import React from 'react';
import Link from 'next/link';

interface TutorialStepProps {
  number: number;
  title: string;
  estimatedTime?: string;
  children: React.ReactNode;
}

export function TutorialStep({ number, title, estimatedTime, children }: TutorialStepProps) {
  return (
    <div data-tutorial-step={number} data-title={title} data-estimated-time={estimatedTime} className="relative group">
      <div className="flex items-start justify-end gap-4 mb-4">
        <Link
          href="/chat"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 shadow-sm hover:shadow-md no-underline whitespace-nowrap"
          title="Open interactive sandbox to explore this step"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Move to Sandbox
        </Link>
      </div>
      {children}
    </div>
  );
}

// Export for MDX components map
export default TutorialStep;
