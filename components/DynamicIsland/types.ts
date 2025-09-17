export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  icon: string;
  estimatedTime: string;
  completed: boolean;
}

export interface Tutorial {
  id: string;
  title: string;
  currentStep: number;
  totalSteps: number;
  steps: TutorialStep[];
  isActive: boolean;
}

export interface DynamicIslandProps {
  tutorial: Tutorial;
  onNextStep: () => void;
  onPreviousStep: () => void;
  onSkipStep: () => void;
  onDismiss?: () => void;
  className?: string;
}

export interface IslandWrapperProps {
  isExpanded: boolean;
  children: React.ReactNode;
  className?: string;
}

export interface CompactViewProps {
  tutorial: Tutorial;
  currentStepData: TutorialStep;
  progressPercentage: number;
}

export interface ExpandedViewProps {
  tutorial: Tutorial;
  currentStepData: TutorialStep;
  progressPercentage: number;
  onNextStep: () => void;
  onPreviousStep: () => void;
  onSkipStep: () => void;
} 