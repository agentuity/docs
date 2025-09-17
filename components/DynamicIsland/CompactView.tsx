import { CompactViewProps } from './types';

export function CompactView({ tutorial, currentStepData, progressPercentage }: CompactViewProps) {
  return (
    <div className="flex items-center justify-center gap-3 p-3 h-full">
      {/* Tutorial Icon */}
      <div className="text-xl">{currentStepData.icon}</div>
      
      {/* Step Title */}
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-medium text-white truncate">
          {currentStepData.title}
        </h3>
      </div>
      
      {/* Progress Dots */}
      <div className="flex gap-1">
        {tutorial.steps.map((step, index) => (
          <div
            key={step.id}
            className={`w-2 h-2 rounded-full transition-colors duration-200 ${
              index === tutorial.currentStep 
                ? 'bg-white' 
                : step.completed 
                  ? 'bg-cyan-400' 
                  : 'bg-white/30'
            }`}
          />
        ))}
      </div>
      
      {/* Circular Progress Ring */}
      <div className="w-8 h-8">
        <svg className="w-8 h-8 -rotate-90" viewBox="0 0 32 32">
          {/* Background circle */}
          <circle
            cx="16"
            cy="16"
            r="12"
            fill="none"
            stroke="rgba(255, 255, 255, 0.2)"
            strokeWidth="2"
          />
          
          {/* Progress circle */}
          <circle
            cx="16"
            cy="16"
            r="12"
            fill="none"
            stroke="rgb(34, 211, 238)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 12}`}
            strokeDashoffset={`${2 * Math.PI * 12 * (1 - progressPercentage / 100)}`}
            className="transition-all duration-300"
          />
        </svg>
      </div>
    </div>
  );
} 