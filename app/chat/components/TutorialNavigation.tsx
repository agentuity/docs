'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { TutorialData } from '../types';

interface TutorialNavigationProps {
  tutorialData: TutorialData;
  onNavigate: (action: string, tutorialId: string) => Promise<void>;
}

export function TutorialNavigation({ tutorialData, onNavigate }: TutorialNavigationProps) {
  const [isNavigating, setIsNavigating] = useState(false);
  const { tutorialId, currentStep, tutorialStep } = tutorialData;
  const totalSteps = tutorialStep.totalSteps;
  
  const handlePrevious = async () => {
    if (currentStep <= 1 || isNavigating) return;
    
    setIsNavigating(true);
    try {
      await onNavigate('previous', tutorialId);
    } finally {
      setIsNavigating(false);
    }
  };
  
  const handleNext = async () => {
    if (currentStep >= totalSteps || isNavigating) return;
    
    setIsNavigating(true);
    try {
      await onNavigate('next', tutorialId);
    } finally {
      setIsNavigating(false);
    }
  };
  
  return (
    <div className="flex items-center justify-between mt-4">
      <button
        onClick={handlePrevious}
        disabled={currentStep <= 1 || isNavigating}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all ${
          currentStep <= 1 || isNavigating
            ? 'bg-gray-700/30 text-gray-500 cursor-not-allowed'
            : 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30'
        }`}
      >
        <ChevronLeft className="w-4 h-4" />
        Previous Step
      </button>
      
      <div className="text-sm text-gray-400">
        Step {currentStep} of {totalSteps}
      </div>
      
      <button
        onClick={handleNext}
        disabled={currentStep >= totalSteps || isNavigating}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all ${
          currentStep >= totalSteps || isNavigating
            ? 'bg-gray-700/30 text-gray-500 cursor-not-allowed'
            : 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30'
        }`}
      >
        Next Step
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
} 