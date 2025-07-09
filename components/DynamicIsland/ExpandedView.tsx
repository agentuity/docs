import { ExpandedViewProps } from './types';

export function ExpandedView({ 
  tutorial, 
  currentStepData, 
  progressPercentage, 
  onNextStep, 
  onPreviousStep, 
  onSkipStep
}: ExpandedViewProps) {
  const isFirstStep = tutorial.currentStep === 0;
  const isLastStep = tutorial.currentStep === tutorial.totalSteps - 1;
  
  return (
    <div className="p-4 h-full flex flex-col">
      {/* Header with icon and progress */}
      <div className="flex items-center gap-3 mb-4">
        <div className="text-2xl">{currentStepData.icon}</div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold text-white truncate">
            {currentStepData.title}
          </h2>
          <p className="text-sm text-white/60">
            Step {tutorial.currentStep + 1} of {tutorial.totalSteps}
          </p>
        </div>
        
        {/* Circular Progress Ring */}
        <div className="w-10 h-10">
          <svg className="w-10 h-10 -rotate-90" viewBox="0 0 40 40">
            {/* Background circle */}
            <circle
              cx="20"
              cy="20"
              r="15"
              fill="none"
              stroke="rgba(255, 255, 255, 0.2)"
              strokeWidth="2"
            />
            
            {/* Progress circle */}
            <circle
              cx="20"
              cy="20"
              r="15"
              fill="none"
              stroke="rgb(34, 211, 238)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 15}`}
              strokeDashoffset={`${2 * Math.PI * 15 * (1 - progressPercentage / 100)}`}
              className="transition-all duration-300"
            />
          </svg>
        </div>
      </div>
      
      {/* Progress Dots */}
      <div className="flex gap-2 mb-4">
        {tutorial.steps.map((step, index) => (
          <div
            key={step.id}
            className={`w-3 h-3 rounded-full transition-colors duration-200 ${
              index === tutorial.currentStep 
                ? 'bg-white' 
                : step.completed 
                  ? 'bg-cyan-400' 
                  : 'bg-white/30'
            }`}
          />
        ))}
      </div>
      
      {/* Description */}
      <div className="flex-1 mb-4">
        <p className="text-sm text-white/80 leading-relaxed">
          {currentStepData.description}
        </p>
        
        {/* Estimated time */}
        <div className="mt-2 text-xs text-white/60">
          Estimated time: {currentStepData.estimatedTime}
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="flex gap-2 flex-row">
        <button
          onClick={onPreviousStep}
          disabled={isFirstStep}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
            isFirstStep 
              ? 'bg-white/10 text-white/40 cursor-not-allowed' 
              : 'bg-white/20 text-white hover:bg-white/30'
          }`}
        >
          Previous
        </button>
        
        <button
          onClick={onSkipStep}
          className="px-4 py-2 text-sm font-medium text-white/60 hover:text-white/80 transition-colors duration-200"
        >
          Skip
        </button>
        
        <button
          onClick={onNextStep}
          className="px-4 py-2 text-sm font-medium bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors duration-200 flex-1"
        >
          {isLastStep ? 'Finish' : 'Continue'}
        </button>
      </div>
    </div>
  );
} 