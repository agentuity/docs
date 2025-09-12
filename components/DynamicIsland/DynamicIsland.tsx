'use client';

import React, { useState, useMemo } from 'react';
import { DynamicIslandProps } from './types';
import { IslandWrapper } from './IslandWrapper';
import { CompactView } from './CompactView';
import { ExpandedView } from './ExpandedView';

export function DynamicIsland({
  tutorial,
  onNextStep,
  onPreviousStep,
  onSkipStep,
  onDismiss,
  className = ''
}: DynamicIslandProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);

  // Calculate derived state
  const currentStepData = useMemo(() => {
    return tutorial.steps[tutorial.currentStep] || tutorial.steps[0];
  }, [tutorial.steps, tutorial.currentStep]);

  const progressPercentage = useMemo(() => {
    const completedSteps = tutorial.steps.filter(step => step.completed).length;
    return (completedSteps / tutorial.totalSteps) * 100;
  }, [tutorial.steps, tutorial.totalSteps]);

  // Handle hover events for expansion
  const handleMouseEnter = () => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      setHoverTimeout(null);
    }
    setIsExpanded(true);
  };

  const handleMouseLeave = () => {
    const timeout = setTimeout(() => {
      setIsExpanded(false);
    }, 300);
    setHoverTimeout(timeout);
  };

  // Handle focus events for keyboard accessibility
  const handleFocus = () => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      setHoverTimeout(null);
    }
    setIsExpanded(true);
  };

  const handleBlur = () => {
    const timeout = setTimeout(() => {
      setIsExpanded(false);
    }, 300);
    setHoverTimeout(timeout);
  };

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
      }
    };
  }, [hoverTimeout]);

  // Don't render if tutorial is not active
  if (!tutorial.isActive) {
    return null;
  }

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      tabIndex={0}
      className="outline-none absolute"
      role="region"
      aria-label={`Tutorial: ${tutorial.title}`}
      aria-expanded={isExpanded}
    >
      <IslandWrapper
        isExpanded={isExpanded}
        className={className}
      >
        {isExpanded ? (
          <ExpandedView
            tutorial={tutorial}
            currentStepData={currentStepData}
            progressPercentage={progressPercentage}
            onNextStep={onNextStep}
            onPreviousStep={onPreviousStep}
            onSkipStep={onSkipStep}
          />
        ) : (
          <CompactView
            tutorial={tutorial}
            currentStepData={currentStepData}
            progressPercentage={progressPercentage}
          />
        )}
      </IslandWrapper>
    </div>
  );
} 