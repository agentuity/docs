import React from 'react';

interface TutorialStepProps {
  number: number;
  title: string;
  estimatedTime?: string;
  children: React.ReactNode;
}

export function TutorialStep({ number, title, estimatedTime, children }: TutorialStepProps) {
  return (
    <div data-tutorial-step={number} data-title={title} data-estimated-time={estimatedTime}>
      {children}
    </div>
  );
}

// Export for MDX components map
export default TutorialStep;
